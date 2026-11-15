// End-to-end test of Trail of Debris accounts against the local site + real Supabase.
// Uses Chrome's CDP virtual authenticator to stand in for Face ID / Windows Hello.
// Usage: TD_TEST_EMAIL=... TD_TEST_PASSWORD=... node tests/auth-test.js http://localhost:5180/
// Needs: npm i puppeteer-core@23.11.1, Chrome, and a verified test account whose username is td_test_alpha.
const puppeteer = require('puppeteer-core');

const URL = process.argv[2] || 'http://localhost:5180/';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const EMAIL = process.env.TD_TEST_EMAIL;          // a verified test account
const PW = process.env.TD_TEST_PASSWORD;
const PW2 = process.env.TD_TEST_PASSWORD2 || 'Changed' + PW + '9';

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function check(name, ok, detail = '') { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); }

async function newContext(browser, { authenticator = true, noWebAuthn = false } = {}) {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1200, height: 900 });
  page.on('dialog', (d) => d.accept());
  page.on('pageerror', (e) => console.log('  [pageerror]', e.message));
  if (noWebAuthn) await page.evaluateOnNewDocument(() => { delete window.PublicKeyCredential; });
  let auth = null;
  if (authenticator) {
    const cdp = await page.createCDPSession();
    await cdp.send('WebAuthn.enable');
    const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', {
      options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
    });
    auth = { cdp, authenticatorId };
  }
  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => window.TDAuth && document.querySelector('.auth-view'), { timeout: 20000 });
  await sleep(800);
  return { ctx, page, auth };
}

const view = (p) => p.evaluate(() => document.querySelector('.auth-view')?.dataset.view);
const msg = (p, id = 'auth-msg') => p.evaluate((i) => document.getElementById(i)?.textContent || '', id);
const header = (p) => p.evaluate(() => document.getElementById('btn-account')?.textContent || '');
const screenVisible = (p, s) => p.evaluate((s) => { const e = document.getElementById('screen-' + s); return !!e && !e.classList.contains('hidden'); }, s);
async function waitMsg(p, re, id = 'auth-msg', timeout = 15000) {
  try { await p.waitForFunction((r, i) => new RegExp(r, 'i').test(document.getElementById(i)?.textContent || ''), { timeout }, re.source, id); } catch (e) {}
  return msg(p, id);
}

async function showLogin(p) { await p.evaluate(() => window.TDAuth.showAuth('login')); await sleep(200); }
async function passwordLogin(p, email, pw) {
  await showLogin(p);
  await p.evaluate((e, w) => { document.getElementById('login-email').value = e; document.getElementById('login-password').value = w; }, email, pw);
  await p.click('#login-submit');
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-first-run'] });
  try {
    // ---------- Prep: clean slate for the test account (no passkeys, original password) ----------
    {
      const prep = await newContext(browser, { authenticator: false });
      const r = await prep.page.evaluate(async (email, pw, pw2) => {
        const c = window.CloudSync.client;
        let { error } = await c.auth.signInWithPassword({ email, password: pw });
        let used = 'PW';
        if (error) { ({ error } = await c.auth.signInWithPassword({ email, password: pw2 })); used = 'PW2'; if (!error) await c.auth.updateUser({ password: pw }); }
        if (error) return 'login failed: ' + error.message;
        const del = await c.from('passkey_credentials').delete().not('id', 'is', null).select('id');
        await c.from('profiles').update({ username: 'td_test_alpha' }).eq('email', email);
        await c.auth.signOut({ scope: 'local' });
        return `prep ok (password was ${used}, removed ${del.data?.length || 0} old passkeys)`;
      }, EMAIL, PW, PW2);
      console.log('  ' + r);
      await prep.ctx.close();
    }

    // ---------- Device 1 ----------
    const d1 = await newContext(browser);
    const p = d1.page;
    await p.waitForFunction(() => document.getElementById('btn-account'), { timeout: 15000 }).catch(() => {});
    check('Guest session starts and cloud save connects', /SAVED/.test(await p.evaluate(() => document.getElementById('cloud-sync-status').textContent)));
    check('Header offers LOG IN / SIGN UP to guests', /LOG IN/.test(await header(p)), await header(p));
    await p.evaluate(() => window.gameApp.goToScreen('login'));
    check('Login screen shows passkey button + email/password', await p.evaluate(() => !!document.getElementById('auth-passkey-btn') && !!document.getElementById('login-password')));

    // Password visibility toggle
    await p.click('.auth-pw-toggle');
    check('Password visibility toggle works', (await p.evaluate(() => document.getElementById('login-password').type)) === 'text');

    // Incorrect password
    await passwordLogin(p, EMAIL, 'WrongPass999');
    check('Incorrect password is rejected', /wrong email or password/i.test(await waitMsg(p, /wrong|error|invalid/)), await msg(p));

    // Registration validation (no emails sent)
    await p.evaluate(() => window.TDAuth.showAuth('register')); await sleep(200);
    await p.type('#reg-username', 'td_test_alpha');
    await p.waitForFunction(() => /taken|available/i.test(document.getElementById('reg-username-hint').textContent), { timeout: 8000 }).catch(() => {});
    check('Duplicate username detected live', /taken/i.test(await p.evaluate(() => document.getElementById('reg-username-hint').textContent)),
      await p.evaluate(() => document.getElementById('reg-username-hint').textContent));
    await p.evaluate(() => { document.getElementById('reg-username').value = 'td_new_' + Date.now().toString().slice(-6); document.getElementById('reg-email').value = 'not-an-email'; document.getElementById('reg-password').value = 'Abcdefg1'; document.getElementById('reg-confirm').value = 'Abcdefg1'; });
    await p.click('#reg-submit');
    check('Invalid email rejected', /valid email/i.test(await msg(p)));
    await p.evaluate(() => { document.getElementById('reg-email').value = 'someone@mailinator.com'; document.getElementById('reg-password').value = 'short'; document.getElementById('reg-confirm').value = 'short'; });
    await p.click('#reg-submit');
    check('Weak password rejected', /at least 8/i.test(await msg(p)));
    await p.evaluate(() => { document.getElementById('reg-password').value = 'Goodpass123'; document.getElementById('reg-confirm').value = 'Goodpass124'; });
    await p.click('#reg-submit');
    check('Password mismatch rejected', /do not match/i.test(await msg(p)));
    await p.evaluate(() => { document.getElementById('reg-username').value = 'td_test_alpha'; document.getElementById('reg-password').value = 'Goodpass123'; document.getElementById('reg-confirm').value = 'Goodpass123'; });
    await p.click('#reg-submit');
    check('Duplicate username blocked on submit', /taken/i.test(await waitMsg(p, /taken|error/)));

    // Correct password -> passkey setup offered
    await passwordLogin(p, EMAIL, PW);
    await p.waitForFunction(() => document.querySelector('.auth-view')?.dataset.view === 'passkey-setup' || document.getElementById('screen-destination') && !document.getElementById('screen-destination').classList.contains('hidden'), { timeout: 20000 }).catch(() => {});
    check('Password login works and offers passkey setup', (await view(p)) === 'passkey-setup', 'view=' + (await view(p)));

    // Register passkey on device 1
    await p.click('#auth-setup-passkey');
    const setupMsg = await waitMsg(p, /passkey added|error|could not|cancel/);
    check('Passkey registered on device 1 (virtual Face ID)', /passkey added/i.test(setupMsg), setupMsg);
    await p.waitForFunction(() => !document.getElementById('screen-destination').classList.contains('hidden'), { timeout: 8000 }).catch(() => {});
    check('Enters the game after passkey setup', await screenVisible(p, 'destination'));
    check('Header shows account name', /TD_TEST_ALPHA/i.test(await header(p)), await header(p));

    // Save some progress as this member
    await p.evaluate(() => { const a = window.gameApp; a.savedProgress.moon.middle.solved = Array.from(new Set([...(a.savedProgress.moon.middle.solved || []), 'moon_05_surveyor4'])); a.savedProgress.moon.middle.unlocked = 2; a.saveProgress(); });
    await sleep(2500);
    const solvedBefore = await p.evaluate(() => window.gameApp.getSolvedTotal());

    // Logout
    await p.evaluate(() => window.TDAuth.openAccount()); await sleep(1500);
    await p.click('#acct-logout');
    await p.waitForFunction(() => document.querySelector('.auth-view')?.dataset.view === 'login', { timeout: 15000 }).catch(() => {});
    check('Logout returns to the login screen', (await view(p)) === 'login' && /logged out/i.test(await msg(p)), await msg(p));
    check('After logout the browser is a fresh guest with no member progress',
      await p.evaluate(() => window.TDAuth.user?.is_anonymous === true && window.gameApp.getSolvedTotal() === 0));

    // Passkey login
    await p.click('#auth-passkey-btn');
    await p.waitForFunction(() => !document.getElementById('screen-destination').classList.contains('hidden'), { timeout: 20000 }).catch(() => {});
    const pkUser = await p.evaluate(() => ({ email: window.TDAuth.user?.email, anon: window.TDAuth.user?.is_anonymous }));
    check('Passkey login creates a real Supabase session', pkUser.email === EMAIL && pkUser.anon === false, JSON.stringify(pkUser));
    await sleep(1500);
    const solvedAfter = await p.evaluate(() => window.gameApp.getSolvedTotal());
    check('Saved progress is restored after passkey login', solvedAfter >= solvedBefore && await p.evaluate(() => window.gameApp.savedProgress.moon.middle.solved.includes('moon_05_surveyor4')), `before=${solvedBefore} after=${solvedAfter}`);

    // Session persists across reload (remember me)
    await p.reload({ waitUntil: 'networkidle2' }); await sleep(3000);
    check('Session is remembered after reload', await p.evaluate(() => window.TDAuth.user?.email) === EMAIL);

    // ---------- Device 2: second passkey for same account ----------
    const d2 = await newContext(browser);
    await passwordLogin(d2.page, EMAIL, PW);
    await d2.page.waitForFunction(() => ['passkey-setup'].includes(document.querySelector('.auth-view')?.dataset.view) || !document.getElementById('screen-destination').classList.contains('hidden'), { timeout: 20000 }).catch(() => {});
    if ((await view(d2.page)) === 'passkey-setup') {
      await d2.page.click('#auth-setup-passkey');
      check('Second passkey registered on device 2', /passkey added/i.test(await waitMsg(d2.page, /passkey added|error/)));
    } else {
      await d2.page.evaluate(() => window.TDAuth.openAccount()); await sleep(1500);
      await d2.page.click('#acct-add-passkey');
      check('Second passkey registered on device 2', /passkey added/i.test(await waitMsg(d2.page, /passkey added|error/, 'acct-passkey-msg')));
    }

    // Same device again -> excluded credential
    await p.evaluate(() => window.TDAuth.openAccount()); await sleep(1800);
    const count2 = await p.evaluate(() => document.querySelectorAll('#acct-passkeys li [data-del]').length);
    check('Account panel lists both passkeys', count2 === 2, 'listed=' + count2);
    await p.click('#acct-add-passkey');
    check('Registering a second passkey on the same device is refused', /already has a passkey|already registered/i.test(await waitMsg(p, /already|error|added/, 'acct-passkey-msg')), await msg(p, 'acct-passkey-msg'));

    // Remove device-2 passkey (the newest)
    const delBtns = await p.$$('#acct-passkeys [data-del]');
    await delBtns[delBtns.length - 1].click();
    await waitMsg(p, /removed|could not/, 'acct-passkey-msg'); await sleep(1200);
    const count1 = await p.evaluate(() => document.querySelectorAll('#acct-passkeys li [data-del]').length);
    check('Removing a passkey works', count1 === 1, 'listed=' + count1);

    // Device 2 passkey login should now fail (credential removed)
    await d2.page.evaluate(() => window.TDAuth.logout()); await sleep(3000);
    await d2.page.click('#auth-passkey-btn');
    check('Removed passkey can no longer log in', /isn't registered|not registered/i.test(await waitMsg(d2.page, /registered|error|verified/)), await msg(d2.page));

    // Username change
    await p.evaluate(() => { document.getElementById('acct-username').value = 'td_alpha_2'; });
    await p.click('#acct-username-save');
    check('Username can be changed', /saved/i.test(await waitMsg(p, /saved|taken|error/, 'acct-username-msg')) && /TD_ALPHA_2/.test(await header(p)));
    await p.evaluate(() => { document.getElementById('acct-username').value = 'x!'; });
    await p.click('#acct-username-save');
    check('Invalid username refused', /3–20/.test(await msg(p, 'acct-username-msg')));
    await p.evaluate(() => { document.getElementById('acct-username').value = 'td_test_alpha'; });
    await p.click('#acct-username-save');
    await waitMsg(p, /saved|taken/, 'acct-username-msg');

    // Password change
    await p.evaluate((a, b) => { document.getElementById('acct-pw-current').value = 'nope'; document.getElementById('acct-pw-new').value = b; document.getElementById('acct-pw-confirm').value = b; }, PW, PW2);
    await p.click('#acct-pw-save');
    check('Password change needs the correct current password', /incorrect/i.test(await waitMsg(p, /incorrect|updated|error/, 'acct-pw-msg')));
    await p.evaluate((a, b) => { document.getElementById('acct-pw-current').value = a; document.getElementById('acct-pw-new').value = b; document.getElementById('acct-pw-confirm').value = b; }, PW, PW2);
    await p.click('#acct-pw-save');
    check('Password change works', /updated/i.test(await waitMsg(p, /updated|error|incorrect/, 'acct-pw-msg')), await msg(p, 'acct-pw-msg'));
    await p.evaluate(() => window.TDAuth.logout()); await sleep(3000);
    await passwordLogin(p, EMAIL, PW);
    check('Old password stops working', /wrong email or password/i.test(await waitMsg(p, /wrong|error/)));
    await passwordLogin(p, EMAIL, PW2);
    await p.waitForFunction(() => window.TDAuth.user && !window.TDAuth.user.is_anonymous, { timeout: 15000 }).catch(() => {});
    check('New password works', await p.evaluate(() => window.TDAuth.user?.email) === EMAIL);
    await p.waitForFunction(() => !document.getElementById('screen-destination').classList.contains('hidden'), { timeout: 15000 }).catch(() => {});
    await sleep(500);
    // restore original password
    await p.evaluate(() => window.TDAuth.openAccount());
    await p.waitForSelector('#acct-pw-save', { visible: true, timeout: 10000 });
    await p.evaluate((a, b) => { document.getElementById('acct-pw-current').value = b; document.getElementById('acct-pw-new').value = a; document.getElementById('acct-pw-confirm').value = a; }, PW, PW2);
    await p.click('#acct-pw-save'); await waitMsg(p, /updated|error/, 'acct-pw-msg');

    // Forgot password: generic message, no account discovery
    await p.evaluate(() => window.TDAuth.logout()); await sleep(3000);
    await p.evaluate(() => window.TDAuth.showAuth('forgot')); await sleep(200);
    await p.evaluate(() => { document.getElementById('forgot-email').value = 'nobody-here-123@mailinator.com'; });
    await p.click('#forgot-submit');
    const fm = await waitMsg(p, /if an account|too many|error/);
    check('Forgot password shows a neutral message (or rate-limit notice)', /if an account|too many/i.test(fm), fm);

    // ---------- Device 3: guest acting as "another user" for isolation ----------
    const d3 = await newContext(browser, { authenticator: false });
    const iso = await d3.page.evaluate(async (email) => {
      const c = window.CloudSync.client; const out = {};
      const me = (await c.auth.getUser()).data.user; out.guest = me && me.is_anonymous;
      out.profilesVisible = (await c.from('profiles').select('id')).data?.length;
      out.otherProfileByEmail = (await c.from('profiles').select('id').eq('email', email)).data?.length;
      out.progressRows = (await c.from('player_progress').select('user_id')).data?.length;
      out.passkeysVisible = (await c.from('passkey_credentials').select('id')).data?.length;
      out.insertPasskey = (await c.from('passkey_credentials').insert({ user_id: me.id, credential_id: 'fake', public_key: 'fake' })).error?.code || 'allowed';
      out.selfPromote = (await c.from('profiles').update({ role: 'admin' }).eq('id', me.id)).error?.code || 'allowed';
      out.adminStats = (await c.rpc('admin_stats')).error?.message || 'allowed';
      out.adminList = (await c.rpc('admin_list_users', {})).error?.message || 'allowed';
      out.challengesVisible = (await c.from('webauthn_challenges').select('id')).error?.code || 'allowed';
      return out;
    }, EMAIL);
    check('Other users only see their own profile', iso.profilesVisible === 1 && iso.otherProfileByEmail === 0, JSON.stringify({ p: iso.profilesVisible, o: iso.otherProfileByEmail }));
    check('Other users only see their own progress', iso.progressRows === 1, 'rows=' + iso.progressRows);
    check("Other users can't see passkeys", iso.passkeysVisible === 0);
    check("Users can't insert passkey credentials directly", iso.insertPasskey !== 'allowed', iso.insertPasskey);
    check("Users can't make themselves admin", iso.selfPromote !== 'allowed', iso.selfPromote);
    check("Non-admins can't read admin stats or user list", /not authorized|permission/i.test(iso.adminStats) && /not authorized|permission/i.test(iso.adminList));
    check("WebAuthn challenges table is server-only", iso.challengesVisible !== 'allowed', iso.challengesVisible);
    const fnAdmin = await d3.page.evaluate(async () => {
      const s = (await window.CloudSync.client.auth.getSession()).data.session;
      const r = await fetch(window.CloudSync.SUPABASE_URL + '/functions/v1/td-auth', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: window.CloudSync.SUPABASE_KEY, Authorization: 'Bearer ' + s.access_token }, body: JSON.stringify({ action: 'admin', op: 'delete', userId: '00000000-0000-0000-0000-000000000000' }) });
      return r.status + ' ' + (await r.json()).error;
    });
    check("Non-admins can't call admin actions on the server", /^403 Administrator access required/.test(fnAdmin), fnAdmin);
    const guestPasskey = await d3.page.evaluate(async () => {
      const s = (await window.CloudSync.client.auth.getSession()).data.session;
      const r = await fetch(window.CloudSync.SUPABASE_URL + '/functions/v1/td-auth', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: window.CloudSync.SUPABASE_KEY, Authorization: 'Bearer ' + s.access_token }, body: JSON.stringify({ action: 'register-options' }) });
      return r.status + ' ' + (await r.json()).error;
    });
    check('Guests must create an account before adding a passkey', /^403/.test(guestPasskey), guestPasskey);

    // ---------- Simultaneous users ----------
    await passwordLogin(p, EMAIL, PW);
    await p.waitForFunction(() => window.TDAuth.user && !window.TDAuth.user.is_anonymous, { timeout: 15000 }).catch(() => {});
    await sleep(1500);
    await d3.page.evaluate(() => { const a = window.gameApp; a.savedProgress.mars.starter.solved = ['mars_01_oppy']; a.saveProgress(); });
    await sleep(2500);
    const memberHasGuestCase = await p.evaluate(async () => {
      const r = await window.CloudSync.client.from('player_progress').select('progress').maybeSingle();
      return (r.data?.progress?.mars?.starter?.solved || []).includes('mars_01_oppy');
    });
    check("Simultaneous players don't share progress", !memberHasGuestCase);

    // ---------- No-WebAuthn browser ----------
    const d4 = await newContext(browser, { authenticator: false, noWebAuthn: true });
    await d4.page.evaluate(() => window.TDAuth.showAuth('login')); await sleep(200);
    check('Passkey button disabled with a fallback hint when unsupported', await d4.page.evaluate(() => document.getElementById('auth-passkey-btn').disabled && /aren't available/.test(document.querySelector('.auth-view').textContent)));

    // Replay protection: reuse a consumed challenge id
    const replay = await d4.page.evaluate(async () => {
      const call = (b) => fetch(window.CloudSync.SUPABASE_URL + '/functions/v1/td-auth', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: window.CloudSync.SUPABASE_KEY }, body: JSON.stringify(b) }).then(async (r) => r.status + ' ' + (await r.json()).error);
      const o = await fetch(window.CloudSync.SUPABASE_URL + '/functions/v1/td-auth', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: window.CloudSync.SUPABASE_KEY }, body: JSON.stringify({ action: 'login-options' }) }).then((r) => r.json());
      const first = await call({ action: 'login-verify', challengeId: o.challengeId, response: { id: 'unknown-cred' } });
      const second = await call({ action: 'login-verify', challengeId: o.challengeId, response: { id: 'unknown-cred' } });
      return { first, second };
    });
    check('Challenges are single-use (replay refused)', /expired/i.test(replay.second), JSON.stringify(replay));

    for (const d of [d1, d2, d3, d4]) await d.ctx.close();
  } catch (e) {
    console.error('TEST CRASH', e);
    check('Test run completed without crashing', false, e.message);
  } finally {
    await browser.close();
    const failed = results.filter((r) => !r.ok);
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
    if (failed.length) { console.log('FAILED:'); failed.forEach((f) => console.log(' - ' + f.name + ' ' + f.detail)); }
  }
})();
