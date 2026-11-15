// Trail of Debris accounts (Supabase Auth + WebAuthn passkeys).
//
// • Email + password: sign-up with email verification, login, "remember me",
//   forgot/reset password — all through Supabase Auth.
// • Passkeys (Face ID, Windows Hello, fingerprint, device PIN): ceremonies run in
//   the browser with @simplewebauthn/browser and are verified server-side by the
//   `td-auth` Edge Function, which then hands back a one-time token that
//   supabase.auth.verifyOtp() turns into a real Supabase session. No biometric
//   data ever leaves the device.
// • Guests keep playing without an account; their progress follows them into a
//   new account the first time they log in on this browser.
// • Account panel (profile, password, passkeys, logout, delete) and, for admins,
//   an admin panel (stats, users, suspend/delete).
(function () {
  'use strict';

  const CS = () => window.CloudSync;
  const sb = () => CS().client;
  const FN_URL = () => CS().SUPABASE_URL + '/functions/v1/td-auth';
  const SITE_URL = () => location.origin + location.pathname;
  const WA = () => window.SimpleWebAuthnBrowser;

  // Capture auth redirect info before supabase-js consumes the URL.
  const urlHash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const urlQuery = new URLSearchParams(location.search);
  const redirectType = urlHash.get('type') || urlQuery.get('type');
  const redirectError = urlHash.get('error_description') || urlQuery.get('error_description');

  const state = {
    user: null,        // Supabase user (member or guest)
    profile: null,     // public.profiles row
    loggingOut: false,
    lastUserId: null,
    recovery: redirectType === 'recovery',
  };

  // ------------------------------------------------------------- helpers
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isMember = () => !!(state.user && !state.user.is_anonymous && state.user.email);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

  function sound(kind) {
    try {
      const s = window.soundEngine;
      if (!s) return;
      if (kind === 'ok' && s.playSuccess) s.playSuccess();
      else if (kind === 'err' && s.playTone) s.playTone(180, 0.12);
      else if (s.playClick) s.playClick();
    } catch (e) {}
  }

  function setMsg(el, text, kind = 'info') {
    if (!el) return;
    el.textContent = text || '';
    el.dataset.kind = kind;
    if (text && kind === 'error') sound('err');
  }

  async function busy(btn, fn) {
    if (btn) { btn.classList.add('is-busy'); btn.setAttribute('aria-busy', 'true'); btn.disabled = true; }
    try { return await fn(); }
    finally { if (btn) { btn.classList.remove('is-busy'); btn.removeAttribute('aria-busy'); btn.disabled = false; } }
  }

  function passwordScore(pw) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s++;
    return pw ? Math.max(1, s) : 0;
  }
  function passwordProblem(pw) {
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw)) return 'Use both upper- and lower-case letters.';
    if (!/\d/.test(pw)) return 'Add at least one number.';
    return null;
  }

  function friendlyAuthError(error) {
    const m = (error && (error.message || error.error_description || String(error))) || 'Something went wrong.';
    if (/invalid login credentials/i.test(m)) return 'Wrong email or password.';
    if (/email not confirmed/i.test(m)) return 'Please verify your email first — check your inbox for the link.';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Please wait a minute and try again.';
    if (/password should be|weak password/i.test(m)) return m;
    if (/same.*password|different from the old/i.test(m)) return 'New password must be different from your current one.';
    if (/fetch|network/i.test(m)) return 'Network error — check your connection and try again.';
    return m;
  }

  function deviceLabel() {
    const ua = navigator.userAgent;
    const os = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'Mac'
      : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Device';
    const br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    return `${os} · ${br}`;
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch (e) { return iso.slice(0, 10); }
  }

  // Call the td-auth Edge Function. Authenticated calls send the user's access token.
  async function callFn(action, payload = {}, withAuth = true) {
    const headers = { 'Content-Type': 'application/json', apikey: CS().SUPABASE_KEY };
    if (withAuth) {
      const { data: { session } } = await sb().auth.getSession();
      if (!session) throw new Error('Please log in first.');
      headers.Authorization = 'Bearer ' + session.access_token;
    }
    let res;
    try {
      res = await fetch(FN_URL(), { method: 'POST', headers, body: JSON.stringify({ action, ...payload }) });
    } catch (e) { throw new Error('Network error — check your connection and try again.'); }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status}).`);
    return body;
  }

  const passkeysSupported = () => !!(WA() && WA().browserSupportsWebAuthn && WA().browserSupportsWebAuthn());

  function webauthnError(e) {
    const n = e && e.name;
    if (n === 'NotAllowedError' || n === 'AbortError') return 'The passkey prompt was cancelled or timed out.';
    if (n === 'InvalidStateError') return 'This device already has a passkey for your account.';
    if (n === 'SecurityError') return 'Passkeys need a secure (https) connection on this site.';
    if (n === 'NotSupportedError') return 'This device or browser does not support passkeys.';
    return (e && e.message) || 'Passkey failed.';
  }

  // ------------------------------------------------------------- identity
  async function refreshIdentity() {
    const { data: { user } } = await sb().auth.getUser();
    state.user = user || null;
    state.profile = null;
    if (user) {
      const { data } = await sb().from('profiles').select('id, username, email, role, is_guest, created_at').eq('id', user.id).maybeSingle();
      state.profile = data || null;
    }
    updateHeader();
    return state.user;
  }

  function displayName() {
    if (!isMember()) return null;
    return (state.profile && state.profile.username) || state.user.email.split('@')[0];
  }

  function updateHeader() {
    const row = document.querySelector('.header-status-row');
    if (!row) return;
    let acct = $('btn-account');
    if (!acct) {
      acct = document.createElement('button');
      acct.id = 'btn-account';
      acct.className = 'pixel-pill pill-purple pill-action-btn';
      acct.type = 'button';
      acct.addEventListener('click', () => (isMember() ? openAccount() : showAuth('login')));
      row.insertBefore(acct, $('btn-logout') || null);
    }
    acct.textContent = isMember() ? `👤 ${displayName().toUpperCase()}` : '🔑 LOG IN / SIGN UP';
    acct.title = isMember() ? 'Your account' : 'Create an account or log in to save progress to your account';

    let adm = $('btn-admin');
    const admin = isMember() && state.profile && state.profile.role === 'admin';
    if (admin && !adm) {
      adm = document.createElement('button');
      adm.id = 'btn-admin';
      adm.className = 'pixel-pill pill-offline pill-action-btn';
      adm.type = 'button';
      adm.textContent = '🛡 ADMIN';
      adm.addEventListener('click', openAdmin);
      row.insertBefore(adm, $('btn-logout') || null);
    } else if (!admin && adm) {
      adm.remove();
    }

    const rank = $('player-rank-pill');
    if (rank && window.gameApp) {
      const solved = window.gameApp.getSolvedTotal ? window.gameApp.getSolvedTotal() : 0;
      const who = isMember() ? displayName().toUpperCase() : 'GUEST RECON';
      rank.innerHTML = `👤 ${esc(who)} | <span id="solved-count-badge">${solved}/24 SOLVED</span>`;
    }
  }

  // Re-load progress for whoever is signed in now and refresh the UI.
  async function reloadProgress() {
    const app = window.gameApp;
    if (!app) return;
    app.savedProgress = app.loadProgress();
    await app.initCloudSync();
    if (app.updateOverallProgressStats) app.updateOverallProgressStats();
    updateHeader();
  }

  // ------------------------------------------------------------- auth screens
  const ICON_FACE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M9 9.5v1M15 9.5v1M12 9v4h-1M9 15.5c1.6 1.4 4.4 1.4 6 0"/></svg>';
  const ICON_KEY = '<svg viewBox="0 0 64 64" fill="none" stroke="#00f0ff" stroke-width="3" stroke-linecap="round" aria-hidden="true"><circle cx="22" cy="24" r="10"/><path d="M30 30l20 20M42 42l6-6M47 47l5-5"/><path d="M8 54c4-8 10-12 14-12s10 4 14 12" stroke="#a855f7"/></svg>';

  function pwField(id, label, autocomplete) {
    return `
      <div class="form-field-group">
        <label for="${id}" class="retro-label">${label}</label>
        <div class="input-with-icon">
          <span class="input-icon">🔒</span>
          <input type="password" id="${id}" class="retro-input-field has-toggle" autocomplete="${autocomplete}" required>
          <button type="button" class="auth-pw-toggle" data-for="${id}" aria-label="Show password" aria-pressed="false">SHOW</button>
        </div>
      </div>`;
  }

  const views = {
    login: (o = {}) => `
      <h3 class="login-card-title">WELCOME BACK</h3>
      <div class="auth-msg" id="auth-msg" role="status" aria-live="polite" data-kind="${o.kind || 'info'}">${esc(o.msg || '')}</div>
      <button type="button" id="auth-passkey-btn" class="retro-btn full-btn passkey-btn" ${passkeysSupported() ? '' : 'disabled'}>
        ${ICON_FACE}<span>LOGIN WITH FACE ID / PASSKEY</span>
      </button>
      ${passkeysSupported() ? '' : '<p class="auth-hint">Passkeys aren\'t available in this browser — use your email and password.</p>'}
      <div class="login-card-divider"><span class="divider-line"></span><span class="divider-text">OR</span><span class="divider-line"></span></div>
      <form id="auth-login-form" class="retro-login-form" novalidate>
        <div class="form-field-group">
          <label for="login-email" class="retro-label">EMAIL ADDRESS</label>
          <div class="input-with-icon"><span class="input-icon">✉</span>
            <input type="email" id="login-email" class="retro-input-field" autocomplete="username webauthn" placeholder="you@example.com" required value="${esc(o.email || '')}">
          </div>
        </div>
        ${pwField('login-password', 'PASSWORD', 'current-password')}
        <div class="auth-row">
          <label class="auth-check"><input type="checkbox" id="login-remember" checked> Remember me</label>
          <button type="button" class="auth-link" data-go="forgot">Forgot password?</button>
        </div>
        <button type="submit" class="retro-btn pulse-btn full-btn auth-submit-btn" id="login-submit">LOGIN ▶</button>
      </form>
      <p class="auth-switch">Don't have an account? <button type="button" class="auth-link" data-go="register">Create account</button></p>
      <div class="login-card-divider"><span class="divider-line"></span><span class="divider-text">OR PLAY WITHOUT AN ACCOUNT</span><span class="divider-line"></span></div>
      <button type="button" class="retro-btn guest-btn full-btn" id="auth-guest-btn">🚀 CONTINUE AS GUEST</button>`,

    register: (o = {}) => `
      <h3 class="login-card-title">CREATE YOUR ACCOUNT</h3>
      <div class="auth-msg" id="auth-msg" role="status" aria-live="polite" data-kind="${o.kind || 'info'}">${esc(o.msg || '')}</div>
      <form id="auth-register-form" class="retro-login-form" novalidate>
        <div class="form-field-group">
          <label for="reg-username" class="retro-label">USERNAME</label>
          <div class="input-with-icon"><span class="input-icon">👤</span>
            <input type="text" id="reg-username" class="retro-input-field" autocomplete="nickname" maxlength="20" placeholder="3–20 letters, numbers or _" required>
          </div>
          <p class="auth-hint" id="reg-username-hint" aria-live="polite"></p>
        </div>
        <div class="form-field-group">
          <label for="reg-email" class="retro-label">EMAIL ADDRESS</label>
          <div class="input-with-icon"><span class="input-icon">✉</span>
            <input type="email" id="reg-email" class="retro-input-field" autocomplete="email" placeholder="you@example.com" required>
          </div>
        </div>
        ${pwField('reg-password', 'PASSWORD', 'new-password')}
        <div class="pw-meter" id="reg-meter" data-score="0" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        <p class="auth-hint" id="reg-pw-hint">At least 8 characters with upper- and lower-case letters and a number.</p>
        ${pwField('reg-confirm', 'CONFIRM PASSWORD', 'new-password')}
        <button type="submit" class="retro-btn pulse-btn full-btn auth-submit-btn" id="reg-submit">CREATE ACCOUNT ▶</button>
      </form>
      <p class="auth-switch">Already registered? <button type="button" class="auth-link" data-go="login">Login</button></p>`,

    'check-email': (o = {}) => `
      <h3 class="login-card-title">CHECK YOUR INBOX</h3>
      <div class="auth-msg" id="auth-msg" role="status" aria-live="polite" data-kind="success">We sent a verification link to ${esc(o.email)}. Open it on this device to activate your account, then you'll be logged in.</div>
      <p class="auth-lead">No email? Check spam, or resend it.</p>
      <div class="auth-btn-row">
        <button type="button" class="retro-btn full-btn" id="auth-resend" data-email="${esc(o.email)}">RESEND EMAIL</button>
        <button type="button" class="retro-btn guest-btn full-btn" data-go="login">BACK TO LOGIN</button>
      </div>`,

    forgot: (o = {}) => `
      <h3 class="login-card-title">RESET PASSWORD</h3>
      <p class="auth-lead">Enter your account email and we'll send you a reset link.</p>
      <div class="auth-msg" id="auth-msg" role="status" aria-live="polite" data-kind="${o.kind || 'info'}">${esc(o.msg || '')}</div>
      <form id="auth-forgot-form" class="retro-login-form" novalidate>
        <div class="form-field-group">
          <label for="forgot-email" class="retro-label">EMAIL ADDRESS</label>
          <div class="input-with-icon"><span class="input-icon">✉</span>
            <input type="email" id="forgot-email" class="retro-input-field" autocomplete="email" required value="${esc(o.email || '')}">
          </div>
        </div>
        <button type="submit" class="retro-btn pulse-btn full-btn" id="forgot-submit">SEND RESET LINK ▶</button>
      </form>
      <p class="auth-switch"><button type="button" class="auth-link" data-go="login">◀ Back to login</button></p>`,

    reset: (o = {}) => `
      <h3 class="login-card-title">CHOOSE A NEW PASSWORD</h3>
      <div class="auth-msg" id="auth-msg" role="status" aria-live="polite" data-kind="${o.kind || 'info'}">${esc(o.msg || '')}</div>
      <form id="auth-reset-form" class="retro-login-form" novalidate>
        ${pwField('reset-password', 'NEW PASSWORD', 'new-password')}
        <div class="pw-meter" id="reset-meter" data-score="0" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
        ${pwField('reset-confirm', 'CONFIRM NEW PASSWORD', 'new-password')}
        <button type="submit" class="retro-btn pulse-btn full-btn" id="reset-submit">SAVE NEW PASSWORD ▶</button>
      </form>`,

    'passkey-setup': (o = {}) => `
      <h3 class="login-card-title">SET UP A PASSKEY</h3>
      <div class="passkey-hero">${ICON_KEY}</div>
      <p class="auth-lead">Make your next login faster and more secure. Use Face ID, Windows Hello, your fingerprint or your device PIN — your face and fingerprint never leave your device.</p>
      <div class="auth-msg" id="auth-msg" role="status" aria-live="polite" data-kind="${o.kind || 'info'}">${esc(o.msg || '')}</div>
      <div class="auth-btn-row">
        <button type="button" class="retro-btn pulse-btn full-btn passkey-btn" id="auth-setup-passkey" ${passkeysSupported() ? '' : 'disabled'}>${ICON_FACE}<span>SET UP PASSKEY</span></button>
        <button type="button" class="retro-btn guest-btn full-btn" id="auth-skip-passkey">MAYBE LATER</button>
      </div>
      ${passkeysSupported() ? '' : '<p class="auth-hint">This browser doesn\'t support passkeys. You can add one later from another device.</p>'}`,

    'pick-username': (o = {}) => `
      <h3 class="login-card-title">PICK A USERNAME</h3>
      <p class="auth-lead">That username was taken when your account was created. Choose another to finish setting up.</p>
      <div class="auth-msg" id="auth-msg" role="status" aria-live="polite" data-kind="${o.kind || 'info'}">${esc(o.msg || '')}</div>
      <form id="auth-username-form" class="retro-login-form" novalidate>
        <div class="form-field-group">
          <label for="pick-username" class="retro-label">USERNAME</label>
          <div class="input-with-icon"><span class="input-icon">👤</span>
            <input type="text" id="pick-username" class="retro-input-field" maxlength="20" required>
          </div>
        </div>
        <button type="submit" class="retro-btn pulse-btn full-btn" id="pick-submit">SAVE ▶</button>
      </form>`,
  };

  function cardBody() {
    let body = $('auth-card-body');
    if (!body) {
      const card = document.querySelector('#screen-login .retro-login-card');
      if (!card) return null;
      card.innerHTML = `
        <div class="login-card-badge"><span class="badge-dot"></span> SECURE ACCESS · SUPABASE AUTH + PASSKEYS</div>
        <div id="auth-card-body"></div>
        <div class="login-card-footer"><button type="button" class="back-link-btn" id="auth-back-title">◀ RETURN TO TITLE</button></div>`;
      $('auth-back-title').addEventListener('click', () => window.gameApp.goToScreen('landing'));
      body = $('auth-card-body');
    }
    return body;
  }

  function showAuth(view = 'login', opts = {}) {
    if (window.gameApp && window.gameApp.goToScreen) window.gameApp.goToScreen('login');
    closeModals();
    render(view, opts);
  }

  function render(view, opts = {}) {
    const body = cardBody();
    if (!body) return;
    body.innerHTML = `<div class="auth-view" data-view="${view}">${views[view](opts)}</div>`;
    body.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => render(b.dataset.go)));
    body.querySelectorAll('.auth-pw-toggle').forEach((t) => t.addEventListener('click', () => {
      const input = $(t.dataset.for);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      t.textContent = show ? 'HIDE' : 'SHOW';
      t.setAttribute('aria-pressed', String(show));
      t.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }));
    (binders[view] || (() => {}))(opts);
    const first = body.querySelector('input:not([type=checkbox]), button.passkey-btn:not([disabled])');
    if (first && view !== 'passkey-setup') setTimeout(() => first.focus(), 50);
  }

  const binders = {
    login() {
      $('auth-passkey-btn').addEventListener('click', (e) => passkeyLogin(e.currentTarget));
      $('auth-guest-btn').addEventListener('click', () => window.gameApp.enterMainPage());
      $('auth-login-form').addEventListener('submit', (e) => { e.preventDefault(); passwordLogin($('login-submit')); });
    },
    register() {
      const u = $('reg-username'), hint = $('reg-username-hint');
      let t = null;
      u.addEventListener('input', () => {
        clearTimeout(t);
        const v = u.value.trim();
        if (!v) { hint.textContent = ''; hint.removeAttribute('data-ok'); return; }
        if (!USERNAME_RE.test(v)) { hint.textContent = '3–20 letters, numbers or underscores.'; hint.dataset.ok = 'false'; return; }
        hint.textContent = 'Checking…'; hint.removeAttribute('data-ok');
        t = setTimeout(async () => {
          const { data, error } = await sb().rpc('username_available', { name: v });
          if (u.value.trim() !== v) return;
          if (error) { hint.textContent = ''; return; }
          hint.textContent = data ? '✓ Available' : '✗ That username is taken.';
          hint.dataset.ok = String(!!data);
        }, 350);
      });
      $('reg-password').addEventListener('input', (e) => { $('reg-meter').dataset.score = passwordScore(e.target.value); });
      $('auth-register-form').addEventListener('submit', (e) => { e.preventDefault(); register($('reg-submit')); });
    },
    'check-email'() {
      $('auth-resend').addEventListener('click', (e) => busy(e.currentTarget, async () => {
        const { error } = await sb().auth.resend({ type: 'signup', email: e.currentTarget.dataset.email, options: { emailRedirectTo: SITE_URL() } });
        setMsg($('auth-msg'), error ? friendlyAuthError(error) : 'Sent again. It can take a minute to arrive.', error ? 'error' : 'success');
      }));
    },
    forgot() {
      $('auth-forgot-form').addEventListener('submit', (e) => { e.preventDefault(); forgot($('forgot-submit')); });
    },
    reset() {
      $('reset-password').addEventListener('input', (e) => { $('reset-meter').dataset.score = passwordScore(e.target.value); });
      $('auth-reset-form').addEventListener('submit', (e) => { e.preventDefault(); resetPassword($('reset-submit')); });
    },
    'passkey-setup'() {
      $('auth-setup-passkey').addEventListener('click', async (e) => {
        const ok = await addPasskey(e.currentTarget, $('auth-msg'));
        if (ok) setTimeout(enterGame, 900);
      });
      $('auth-skip-passkey').addEventListener('click', () => {
        try { localStorage.setItem('td_passkey_prompt_done_' + state.user.id, '1'); } catch (e) {}
        enterGame();
      });
    },
    'pick-username'() {
      $('auth-username-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const ok = await saveUsername($('pick-username').value.trim(), $('pick-submit'), $('auth-msg'));
        if (ok) afterLogin({ skipReload: true });
      });
    },
  };

  // ------------------------------------------------------------- flows
  async function passwordLogin(btn) {
    const msg = $('auth-msg');
    setMsg(msg, ''); // clear any previous result before a new attempt
    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    if (!EMAIL_RE.test(email)) return setMsg(msg, 'Enter a valid email address.', 'error');
    if (!password) return setMsg(msg, 'Enter your password.', 'error');
    await busy(btn, async () => {
      CS().setRemember($('login-remember').checked);
      await CS().flush(window.gameApp && window.gameApp.savedProgress);
      const { error } = await sb().auth.signInWithPassword({ email, password });
      if (error) {
        setMsg(msg, friendlyAuthError(error), 'error');
        if (/not confirmed/i.test(error.message)) {
          msg.insertAdjacentHTML('beforeend', ' ');
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'auth-link'; b.textContent = 'Resend verification email';
          b.addEventListener('click', () => render('check-email', { email }));
          msg.appendChild(b);
        }
        return;
      }
      await afterLogin();
    });
  }

  async function passkeyLogin(btn) {
    const msg = $('auth-msg');
    setMsg(msg, ''); // clear any previous result before a new attempt
    if (!passkeysSupported()) return setMsg(msg, 'This browser does not support passkeys.', 'error');
    await busy(btn, async () => {
      try {
        setMsg(msg, 'Waiting for your device…', 'info');
        const { options, challengeId } = await callFn('login-options', {}, false);
        let response;
        try { response = await WA().startAuthentication({ optionsJSON: options }); }
        catch (e) { return setMsg(msg, webauthnError(e), 'error'); }
        const { token_hash } = await callFn('login-verify', { challengeId, response }, false);
        await CS().flush(window.gameApp && window.gameApp.savedProgress);
        CS().setRemember(true);
        const { error } = await sb().auth.verifyOtp({ token_hash, type: 'magiclink' });
        if (error) throw error;
        setMsg(msg, 'Passkey verified.', 'success');
        await afterLogin();
      } catch (e) {
        setMsg(msg, friendlyAuthError(e), 'error');
      }
    });
  }

  async function register(btn) {
    const msg = $('auth-msg');
    setMsg(msg, ''); // clear any previous result before a new attempt
    const username = $('reg-username').value.trim();
    const email = $('reg-email').value.trim();
    const password = $('reg-password').value;
    const confirm = $('reg-confirm').value;
    if (!USERNAME_RE.test(username)) return setMsg(msg, 'Username must be 3–20 letters, numbers or underscores.', 'error');
    if (!EMAIL_RE.test(email)) return setMsg(msg, 'Enter a valid email address.', 'error');
    const problem = passwordProblem(password);
    if (problem) return setMsg(msg, problem, 'error');
    if (password !== confirm) return setMsg(msg, 'Passwords do not match.', 'error');

    await busy(btn, async () => {
      const { data: free, error: rpcErr } = await sb().rpc('username_available', { name: username });
      if (rpcErr) return setMsg(msg, friendlyAuthError(rpcErr), 'error');
      if (!free) return setMsg(msg, 'That username is taken. Try another.', 'error');

      // Save guest progress first; it carries into the new account on first login.
      await CS().flush(window.gameApp && window.gameApp.savedProgress);
      const { data, error } = await sb().auth.signUp({
        email, password,
        options: { data: { username }, emailRedirectTo: SITE_URL() },
      });
      if (error) return setMsg(msg, friendlyAuthError(error), 'error');
      // Supabase hides whether an email exists; an empty identities list means it already does.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return setMsg(msg, 'An account with this email already exists. Log in instead, or reset your password.', 'error');
      }
      sound('ok');
      if (data.session) { await afterLogin({ isNew: true }); return; } // email confirmation disabled
      render('check-email', { email });
    });
  }

  async function forgot(btn) {
    const msg = $('auth-msg');
    setMsg(msg, ''); // clear any previous result before a new attempt
    const email = $('forgot-email').value.trim();
    if (!EMAIL_RE.test(email)) return setMsg(msg, 'Enter a valid email address.', 'error');
    await busy(btn, async () => {
      const { error } = await sb().auth.resetPasswordForEmail(email, { redirectTo: SITE_URL() });
      // Same message whether or not the email has an account, so the form can't
      // be used to discover accounts. Only rate-limit / network problems are shown.
      if (error && /rate|too many|fetch|network/i.test(error.message)) setMsg(msg, friendlyAuthError(error), 'error');
      else setMsg(msg, 'If an account exists for that email, a reset link is on its way.', 'success');
    });
  }

  async function resetPassword(btn) {
    const msg = $('auth-msg');
    setMsg(msg, ''); // clear any previous result before a new attempt
    const pw = $('reset-password').value;
    const problem = passwordProblem(pw);
    if (problem) return setMsg(msg, problem, 'error');
    if (pw !== $('reset-confirm').value) return setMsg(msg, 'Passwords do not match.', 'error');
    await busy(btn, async () => {
      const { error } = await sb().auth.updateUser({ password: pw });
      if (error) return setMsg(msg, friendlyAuthError(error), 'error');
      state.recovery = false;
      setMsg(msg, 'Password updated. Logging you in…', 'success');
      sound('ok');
      setTimeout(() => afterLogin(), 800);
    });
  }

  // Runs after any successful member login (password, passkey, email link).
  async function afterLogin(opts = {}) {
    await refreshIdentity();
    state.lastUserId = state.user && state.user.id;
    if (!opts.skipReload) await reloadProgress();
    if (!isMember()) { enterGame(); return; }
    if (!state.profile || !state.profile.username) { showAuth('pick-username'); return; }
    let promptDone = false;
    try { promptDone = localStorage.getItem('td_passkey_prompt_done_' + state.user.id) === '1'; } catch (e) {}
    if (!promptDone && passkeysSupported()) {
      const { count } = await sb().from('passkey_credentials').select('id', { count: 'exact', head: true });
      if (!count) { showAuth('passkey-setup'); return; }
    }
    enterGame();
  }

  function enterGame() {
    closeModals();
    if (window.gameApp) window.gameApp.enterMainPage();
  }

  async function addPasskey(btn, msgEl) {
    if (!passkeysSupported()) { setMsg(msgEl, 'This browser does not support passkeys.', 'error'); return false; }
    return busy(btn, async () => {
      try {
        setMsg(msgEl, 'Follow the prompt on your device…', 'info');
        const { options, challengeId } = await callFn('register-options');
        let response;
        try { response = await WA().startRegistration({ optionsJSON: options }); }
        catch (e) { setMsg(msgEl, webauthnError(e), 'error'); return false; }
        await callFn('register-verify', { challengeId, response, nickname: deviceLabel() });
        try { localStorage.setItem('td_passkey_prompt_done_' + state.user.id, '1'); } catch (e) {}
        setMsg(msgEl, '✓ Passkey added. Next time, just tap "Login with Face ID / Passkey".', 'success');
        sound('ok');
        return true;
      } catch (e) {
        setMsg(msgEl, friendlyAuthError(e), 'error');
        return false;
      }
    });
  }

  async function saveUsername(name, btn, msgEl) {
    setMsg(msgEl, '');
    if (!USERNAME_RE.test(name)) { setMsg(msgEl, 'Username must be 3–20 letters, numbers or underscores.', 'error'); return false; }
    return busy(btn, async () => {
      const { error } = await sb().from('profiles').update({ username: name }).eq('id', state.user.id);
      if (error) {
        setMsg(msgEl, error.code === '23505' ? 'That username is taken.' : error.code === '23514' ? 'Username must be 3–20 letters, numbers or underscores.' : friendlyAuthError(error), 'error');
        return false;
      }
      await refreshIdentity();
      setMsg(msgEl, '✓ Username saved.', 'success');
      sound('ok');
      return true;
    });
  }

  async function logout(opts = {}) {
    state.loggingOut = true;
    try {
      await CS().flush(window.gameApp && window.gameApp.savedProgress);
      await sb().auth.signOut({ scope: 'local' });
    } catch (e) { /* even if the network fails, clear local state */ }
    CS().clearLocal();
    state.user = null; state.profile = null; state.lastUserId = null;
    const app = window.gameApp;
    if (app) { app.savedProgress = CS().emptyProgress(); }
    closeModals();
    await reloadProgress();          // starts a fresh guest session
    state.lastUserId = state.user && state.user.id;
    state.loggingOut = false;
    await refreshIdentity();
    showAuth('login', { msg: opts.msg || 'You have logged out. Your progress is safe in your account.', kind: opts.kind || 'success' });
  }

  // ------------------------------------------------------------- modals
  function modal(id, title) {
    let m = $(id);
    if (!m) {
      m = document.createElement('div');
      m.id = id; m.className = 'td-modal'; m.hidden = true;
      m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', id + '-title');
      m.innerHTML = `<div class="td-modal-panel"><div class="td-modal-head"><h2 id="${id}-title">${title}</h2>
        <button type="button" class="td-close" data-close>✕ CLOSE</button></div><div class="td-modal-body"></div></div>`;
      m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('[data-close]')) closeModals(); });
      document.body.appendChild(m);
    }
    return m;
  }
  function openModal(m) {
    closeModals();
    m.hidden = false;
    setTimeout(() => { const c = m.querySelector('[data-close]'); if (c) c.focus(); }, 30);
  }
  function closeModals() { document.querySelectorAll('.td-modal').forEach((m) => { m.hidden = true; }); }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModals(); });

  async function openAccount() {
    await refreshIdentity();
    if (!isMember()) { showAuth('login'); return; }
    const m = modal('td-account-modal', '👤 YOUR ACCOUNT');
    const body = m.querySelector('.td-modal-body');
    const p = state.profile || {};
    body.innerHTML = `
      <section class="td-section">
        <h3>PROFILE</h3>
        <p class="td-kv">Email: <b>${esc(state.user.email)}</b>${state.user.email_confirmed_at ? ' ✓ verified' : ''}</p>
        <p class="td-kv">Member since: <b>${fmtDate(state.user.created_at)}</b> · Cases solved: <b>${window.gameApp ? window.gameApp.getSolvedTotal() : 0}/24</b></p>
        <form id="acct-username-form" class="retro-login-form" novalidate>
          <div class="form-field-group">
            <label for="acct-username" class="retro-label">USERNAME</label>
            <div class="input-with-icon"><span class="input-icon">👤</span>
              <input type="text" id="acct-username" class="retro-input-field" maxlength="20" value="${esc(p.username || '')}" required>
            </div>
          </div>
          <div class="auth-msg" id="acct-username-msg" role="status" aria-live="polite"></div>
          <button type="submit" class="retro-btn" id="acct-username-save">SAVE USERNAME</button>
        </form>
      </section>
      <section class="td-section">
        <h3>PASSKEYS (FACE ID · WINDOWS HELLO · FINGERPRINT · PIN)</h3>
        <ul class="passkey-list" id="acct-passkeys"><li class="empty">Loading…</li></ul>
        <div class="auth-msg" id="acct-passkey-msg" role="status" aria-live="polite"></div>
        <button type="button" class="retro-btn passkey-btn" id="acct-add-passkey" ${passkeysSupported() ? '' : 'disabled'}>${ICON_FACE}<span>ADD A PASSKEY ON THIS DEVICE</span></button>
      </section>
      <section class="td-section">
        <h3>CHANGE PASSWORD</h3>
        <form id="acct-pw-form" class="retro-login-form" novalidate>
          ${pwField('acct-pw-current', 'CURRENT PASSWORD', 'current-password')}
          ${pwField('acct-pw-new', 'NEW PASSWORD', 'new-password')}
          ${pwField('acct-pw-confirm', 'CONFIRM NEW PASSWORD', 'new-password')}
          <div class="auth-msg" id="acct-pw-msg" role="status" aria-live="polite"></div>
          <button type="submit" class="retro-btn" id="acct-pw-save">UPDATE PASSWORD</button>
        </form>
      </section>
      <section class="td-section">
        <h3>SESSION</h3>
        <button type="button" class="retro-btn" id="acct-logout">🚪 LOG OUT</button>
      </section>
      <section class="td-section danger">
        <h3>DELETE ACCOUNT</h3>
        <p class="td-kv">This permanently deletes your account, saved progress and passkeys. It can't be undone.</p>
        <div class="form-field-group">
          <label for="acct-delete-confirm" class="retro-label">TYPE DELETE TO CONFIRM</label>
          <input type="text" id="acct-delete-confirm" class="retro-input-field" style="padding-left:12px" autocomplete="off">
        </div>
        <div class="auth-msg" id="acct-delete-msg" role="status" aria-live="polite"></div>
        <button type="button" class="retro-btn danger-btn" id="acct-delete">DELETE MY ACCOUNT</button>
      </section>`;

    body.querySelectorAll('.auth-pw-toggle').forEach((t) => t.addEventListener('click', () => {
      const input = $(t.dataset.for); const show = input.type === 'password';
      input.type = show ? 'text' : 'password'; t.textContent = show ? 'HIDE' : 'SHOW'; t.setAttribute('aria-pressed', String(show));
    }));
    $('acct-username-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveUsername($('acct-username').value.trim(), $('acct-username-save'), $('acct-username-msg'));
    });
    $('acct-add-passkey').addEventListener('click', async (e) => {
      if (await addPasskey(e.currentTarget, $('acct-passkey-msg'))) loadPasskeys();
    });
    $('acct-pw-form').addEventListener('submit', (e) => { e.preventDefault(); changePassword(); });
    $('acct-logout').addEventListener('click', () => logout());
    $('acct-delete').addEventListener('click', deleteAccount);
    openModal(m);
    loadPasskeys();
  }

  async function loadPasskeys() {
    const list = $('acct-passkeys');
    if (!list) return;
    const { data, error } = await sb().from('passkey_credentials')
      .select('id, nickname, device_type, backed_up, created_at, last_used_at').order('created_at');
    if (error) { list.innerHTML = `<li class="empty">${esc(friendlyAuthError(error))}</li>`; return; }
    if (!data.length) { list.innerHTML = '<li class="empty">No passkeys yet. Add one for one-tap login.</li>'; return; }
    list.innerHTML = data.map((k) => `
      <li>
        <span><strong>${esc(k.nickname || 'Passkey')}</strong>
          Added ${fmtDate(k.created_at)} · Last used ${k.last_used_at ? fmtDate(k.last_used_at) : 'never'}${k.backed_up ? ' · synced' : ''}</span>
        <button type="button" class="mini-btn danger" data-del="${k.id}" aria-label="Remove passkey ${esc(k.nickname || '')}">REMOVE</button>
      </li>`).join('');
    list.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Remove this passkey? You can still log in with your password.')) return;
      await busy(b, async () => {
        const { data: gone, error: delErr } = await sb().from('passkey_credentials').delete().eq('id', b.dataset.del).select('id');
        setMsg($('acct-passkey-msg'), delErr ? friendlyAuthError(delErr) : (gone && gone.length ? 'Passkey removed.' : 'Could not remove that passkey.'),
          delErr || !(gone && gone.length) ? 'error' : 'success');
      });
      loadPasskeys();
    }));
  }

  async function changePassword() {
    const msg = $('acct-pw-msg');
    setMsg(msg, ''); // clear any previous result before a new attempt
    const current = $('acct-pw-current').value;
    const next = $('acct-pw-new').value;
    if (!current) return setMsg(msg, 'Enter your current password.', 'error');
    const problem = passwordProblem(next);
    if (problem) return setMsg(msg, problem, 'error');
    if (next !== $('acct-pw-confirm').value) return setMsg(msg, 'New passwords do not match.', 'error');
    await busy($('acct-pw-save'), async () => {
      // Re-authenticate before changing the password.
      const { error: reErr } = await sb().auth.signInWithPassword({ email: state.user.email, password: current });
      if (reErr) return setMsg(msg, /invalid login/i.test(reErr.message) ? 'Current password is incorrect.' : friendlyAuthError(reErr), 'error');
      const { error } = await sb().auth.updateUser({ password: next });
      if (error) return setMsg(msg, friendlyAuthError(error), 'error');
      ['acct-pw-current', 'acct-pw-new', 'acct-pw-confirm'].forEach((id) => { $(id).value = ''; });
      setMsg(msg, '✓ Password updated.', 'success');
      sound('ok');
    });
  }

  async function deleteAccount() {
    const msg = $('acct-delete-msg');
    setMsg(msg, ''); // clear any previous result before a new attempt
    if ($('acct-delete-confirm').value.trim() !== 'DELETE') return setMsg(msg, 'Type DELETE in capitals to confirm.', 'error');
    if (!confirm('Permanently delete your account and all saved progress?')) return;
    await busy($('acct-delete'), async () => {
      try {
        await callFn('delete-account');
        CS().clearLocal();
        await logout({ msg: 'Your account and its data were deleted.', kind: 'success' });
      } catch (e) { setMsg(msg, friendlyAuthError(e), 'error'); }
    });
  }

  // ------------------------------------------------------------- admin
  async function openAdmin() {
    await refreshIdentity();
    if (!(isMember() && state.profile && state.profile.role === 'admin')) return;
    const m = modal('td-admin-modal', '🛡 ADMIN CONSOLE');
    const body = m.querySelector('.td-modal-body');
    body.innerHTML = `
      <section class="td-section"><h3>PLATFORM STATS</h3><div id="adm-stats" class="stat-grid"><p class="td-kv">Loading…</p></div>
        <h3>SIGN-UPS · LAST 14 DAYS</h3><div id="adm-bars" class="signup-bars"></div>
        <div class="signup-legend"><span><b style="background:var(--cyan-neon)"></b>Registered</span><span><b style="background:var(--border-primary)"></b>Guests</span></div>
      </section>
      <section class="td-section"><h3>USERS</h3>
        <div class="admin-tools">
          <input type="search" id="adm-search" class="retro-input-field" placeholder="Search username or email" aria-label="Search users">
          <label class="auth-check"><input type="checkbox" id="adm-guests"> Include guests</label>
        </div>
        <div class="auth-msg" id="adm-msg" role="status" aria-live="polite"></div>
        <div class="admin-table-wrap"><table class="admin-table"><thead><tr>
          <th>USER</th><th class="hide-sm">EMAIL</th><th>SOLVED</th><th class="hide-sm">PASSKEYS</th><th class="hide-sm">JOINED</th><th></th>
        </tr></thead><tbody id="adm-rows"><tr><td colspan="6">Loading…</td></tr></tbody></table></div>
      </section>`;
    openModal(m);
    $('adm-search').addEventListener('input', renderAdminRows);
    $('adm-guests').addEventListener('change', loadAdminUsers);
    loadAdminStats();
    loadAdminUsers();
  }

  let adminUsers = [];
  async function loadAdminStats() {
    const { data, error } = await sb().rpc('admin_stats');
    const box = $('adm-stats');
    if (error) { box.innerHTML = `<p class="td-kv">${esc(friendlyAuthError(error))}</p>`; return; }
    const tiles = [
      ['registered_users', 'REGISTERED'], ['verified_users', 'VERIFIED EMAIL'], ['guest_players', 'GUEST PLAYERS'],
      ['users_with_passkeys', 'USE PASSKEYS'], ['active_last_7_days', 'ACTIVE · 7 DAYS'], ['cases_solved_total', 'CASES SOLVED'],
    ];
    box.innerHTML = tiles.map(([k, label]) => `<div class="stat-tile"><span class="v">${Number(data[k] || 0).toLocaleString()}</span><span class="k">${label}</span></div>`).join('');
    const days = data.signups_by_day || [];
    const max = Math.max(1, ...days.map((d) => d.registered + d.guests));
    $('adm-bars').innerHTML = days.length ? days.map((d) => `
      <div class="bar" title="${esc(d.day)}: ${d.registered} registered, ${d.guests} guests">
        <i class="gst" style="height:${(d.guests / max) * 80}px"></i><i class="reg" style="height:${(d.registered / max) * 80}px"></i>
      </div>`).join('') : '<p class="td-kv">No sign-ups in the last 14 days.</p>';
  }

  async function loadAdminUsers() {
    const { data, error } = await sb().rpc('admin_list_users', { include_guests: $('adm-guests').checked, max_rows: 300 });
    if (error) { $('adm-rows').innerHTML = `<tr><td colspan="6">${esc(friendlyAuthError(error))}</td></tr>`; return; }
    adminUsers = data || [];
    renderAdminRows();
  }

  function renderAdminRows() {
    const q = ($('adm-search').value || '').toLowerCase();
    const rows = adminUsers.filter((u) => !q || (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q));
    $('adm-rows').innerHTML = rows.length ? rows.map((u) => {
      const tags = [u.role === 'admin' && '<span class="tag admin">ADMIN</span>', u.is_guest && '<span class="tag guest">GUEST</span>',
        u.banned && '<span class="tag banned">SUSPENDED</span>', !u.is_guest && !u.email_verified && '<span class="tag unverified">UNVERIFIED</span>'].filter(Boolean).join('');
      const self = state.user && u.id === state.user.id;
      const actions = (u.role === 'admin' || self) ? '' : `
        <button type="button" class="mini-btn" data-op="${u.banned ? 'unban' : 'ban'}" data-id="${u.id}">${u.banned ? 'RESTORE' : 'SUSPEND'}</button>
        <button type="button" class="mini-btn danger" data-op="delete" data-id="${u.id}">DELETE</button>`;
      return `<tr>
        <td>${esc(u.username || (u.is_guest ? 'Guest' : '—'))} ${tags}</td>
        <td class="hide-sm">${esc(u.email || '—')}</td>
        <td class="num">${u.solved_count}</td>
        <td class="num hide-sm">${u.passkeys}</td>
        <td class="hide-sm">${fmtDate(u.created_at)}</td>
        <td><div class="actions">${actions}</div></td></tr>`;
    }).join('') : '<tr><td colspan="6">No matching users.</td></tr>';
    $('adm-rows').querySelectorAll('[data-op]').forEach((b) => b.addEventListener('click', async () => {
      const u = adminUsers.find((x) => x.id === b.dataset.id);
      const who = (u && (u.username || u.email)) || 'this user';
      const op = b.dataset.op;
      const q = op === 'delete' ? `Permanently delete ${who} and all their data?` : op === 'ban' ? `Suspend ${who}? They won't be able to log in.` : `Restore ${who}?`;
      if (!confirm(q)) return;
      await busy(b, async () => {
        try {
          await callFn('admin', { op, userId: b.dataset.id });
          setMsg($('adm-msg'), op === 'delete' ? `Deleted ${who}.` : op === 'ban' ? `Suspended ${who}.` : `Restored ${who}.`, 'success');
        } catch (e) { setMsg($('adm-msg'), friendlyAuthError(e), 'error'); }
      });
      loadAdminUsers(); loadAdminStats();
    }));
  }

  // ------------------------------------------------------------- boot
  async function boot() {
    if (!CS() || !sb()) return; // offline: guest play still works
    cardBody();
    render('login');

    sb().auth.onAuthStateChange((event) => {
      // Never await Supabase calls inside this callback (it can deadlock the client).
      setTimeout(() => onAuthEvent(event), 0);
    });

    // Wait for the app's first cloud sync (which also processes email links).
    await CS().ensureSession().catch(() => null);
    await refreshIdentity();
    state.lastUserId = state.user && state.user.id;

    if (redirectError) {
      showAuth('login', { msg: 'That link is invalid or has expired. ' + redirectError.replace(/\+/g, ' '), kind: 'error' });
    } else if (state.recovery && isMember()) {
      showAuth('reset');
    } else if (redirectType === 'signup' && isMember()) {
      // Arrived from the verification email: account is active now.
      await reloadProgress();
      const name = displayName();
      if (!state.profile || !state.profile.username) showAuth('pick-username');
      else if (passkeysSupported()) showAuth('passkey-setup', { msg: `Email verified — welcome, ${name}!`, kind: 'success' });
      else enterGame();
    }
    if (redirectType || redirectError) history.replaceState(null, '', SITE_URL());
  }

  async function onAuthEvent(event) {
    if (event === 'PASSWORD_RECOVERY') { state.recovery = true; await refreshIdentity(); showAuth('reset'); return; }
    if (event === 'SIGNED_OUT' && !state.loggingOut) {
      // Session ended elsewhere or expired.
      const wasMember = isMember();
      state.user = null; state.profile = null;
      if (wasMember) {
        CS().clearLocal();
        if (window.gameApp) window.gameApp.savedProgress = CS().emptyProgress();
        await reloadProgress();
        await refreshIdentity();
        showAuth('login', { msg: 'Your session ended. Please log in again — your progress is saved.', kind: 'info' });
      }
      return;
    }
    if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') { await refreshIdentity(); }
  }

  window.TDAuth = {
    boot, showAuth, openAccount, openAdmin, logout,
    displayName, isMember, refreshIdentity,
    get user() { return state.user; },
    get profile() { return state.profile; },
  };
})();
