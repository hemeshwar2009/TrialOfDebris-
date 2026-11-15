// Cloud save: syncs mission progress to Supabase (project "TrialOfDebris").
//
// Players are either:
//   • guests  – signed in anonymously (no account), or
//   • members – a registered Supabase account (email + password and/or passkey).
// Each player can only read/write their own row in public.player_progress (RLS).
// localStorage stays the offline fallback, so the game works if Supabase is unreachable.
//
// This file also owns the single shared Supabase client (window.CloudSync.client)
// that js/auth.js uses for accounts.
(function () {
  const SUPABASE_URL = 'https://qlocjvakgyngzilvveap.supabase.co';
  // Publishable key: safe to ship in a browser; access is limited by RLS policies.
  const SUPABASE_KEY = 'sb_publishable_HJphtrx20mE9kiJFRk4qXA_egcp8TZM';
  const TABLE = 'player_progress';
  const PROGRESS_KEY = 'nasa_space_legacy_progress_v2';
  const OWNER_KEY = 'td_progress_owner';        // user id the local progress belongs to
  const OWNER_GUEST_KEY = 'td_progress_owner_guest'; // '1' if that owner was a guest
  const REMEMBER_KEY = 'td_remember_session';   // '0' = keep session for this tab only

  let client = null;
  let userId = null;
  let pushTimer = null;
  let sessionPromise = null;

  function safeGet(store, k) { try { return store.getItem(k); } catch (e) { return null; } }
  function safeSet(store, k, v) { try { store.setItem(k, v); } catch (e) {} }
  function safeDel(store, k) { try { store.removeItem(k); } catch (e) {} }

  // "Remember me": sessions live in localStorage by default, or sessionStorage
  // (cleared when the tab closes) when the player unticks it at login.
  const sessionStore = {
    getItem: (k) => safeGet(localStorage, k) ?? safeGet(sessionStorage, k),
    setItem: (k, v) => {
      if (safeGet(localStorage, REMEMBER_KEY) === '0') { safeSet(sessionStorage, k, v); safeDel(localStorage, k); }
      else { safeSet(localStorage, k, v); safeDel(sessionStorage, k); }
    },
    removeItem: (k) => { safeDel(localStorage, k); safeDel(sessionStorage, k); },
  };

  function setStatus(text, state) {
    const el = document.getElementById('cloud-sync-status');
    if (!el) return;
    el.textContent = text;
    el.dataset.state = state;
  }

  function emptyProgress() {
    const tier = () => ({ unlocked: 1, solved: [] });
    return {
      mars: { starter: tier(), middle: tier(), advanced: tier() },
      moon: { starter: tier(), middle: tier(), advanced: tier() },
    };
  }

  // Combine two progress objects: union of solved ids, highest unlocked level.
  function merge(a, b) {
    const out = JSON.parse(JSON.stringify(a || {}));
    for (const dest of Object.keys(b || {})) {
      out[dest] = out[dest] || {};
      for (const tier of Object.keys(b[dest] || {})) {
        const x = out[dest][tier] || { unlocked: 1, solved: [] };
        const y = b[dest][tier] || { unlocked: 1, solved: [] };
        out[dest][tier] = {
          unlocked: Math.max(x.unlocked || 1, y.unlocked || 1),
          solved: Array.from(new Set([...(x.solved || []), ...(y.solved || [])])),
        };
      }
    }
    return out;
  }

  function countSolved(p) {
    let n = 0;
    for (const dest of Object.values(p || {})) {
      for (const tier of Object.values(dest || {})) n += (tier.solved || []).length;
    }
    return Math.min(24, n);
  }

  async function push(progress) {
    if (!client || !userId) return;
    const { error } = await client.from(TABLE).upsert({
      user_id: userId,
      progress,
      solved_count: countSolved(progress),
    });
    if (error) {
      console.warn('Cloud save failed:', error.message);
      setStatus('☁ CLOUD: OFFLINE', 'offline');
    } else {
      setStatus('☁ CLOUD: SAVED', 'online');
    }
  }

  function getClient() {
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) return null;
    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { storage: sessionStore, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return client;
  }

  const CloudSync = {
    SUPABASE_URL,
    SUPABASE_KEY,
    get client() { return getClient(); },
    emptyProgress,
    merge,

    setRemember(remember) { safeSet(localStorage, REMEMBER_KEY, remember ? '1' : '0'); },

    // Make sure someone is signed in: keep an existing (member or guest) session,
    // otherwise start a new anonymous guest session.
    // Concurrent callers share one in-flight request so only one guest is created.
    ensureSession() {
      const c = getClient();
      if (!c) return Promise.resolve(null);
      if (!sessionPromise) {
        sessionPromise = (async () => {
          let { data: { session } } = await c.auth.getSession();
          if (!session) {
            const { data, error } = await c.auth.signInAnonymously();
            if (error) throw error;
            session = data.session;
          }
          return session;
        })().finally(() => { sessionPromise = null; });
      }
      return sessionPromise;
    },

    // Sign in (guest if needed), pull this player's saved row and merge it with
    // the browser's copy. Returns merged progress, or null if offline.
    async init(localProgress) {
      if (!getClient()) { setStatus('☁ CLOUD: OFFLINE', 'offline'); return null; }
      try {
        setStatus('☁ CLOUD: CONNECTING', 'pending');
        const session = await this.ensureSession();
        const user = session.user;
        userId = user.id;

        // Only carry local progress into this account if it belongs to it, or
        // to a guest (so a guest's progress follows them into a new account).
        // Progress left by a *different* member on this browser is not merged.
        const owner = safeGet(localStorage, OWNER_KEY);
        const ownerWasGuest = safeGet(localStorage, OWNER_GUEST_KEY) === '1';
        const local = (!owner || owner === user.id || ownerWasGuest) ? localProgress : emptyProgress();

        const { data: row, error } = await getClient()
          .from(TABLE).select('progress').eq('user_id', userId).maybeSingle();
        if (error) throw error;

        const merged = merge(local, row ? row.progress : {});
        safeSet(localStorage, OWNER_KEY, user.id);
        safeSet(localStorage, OWNER_GUEST_KEY, user.is_anonymous ? '1' : '0');
        await push(merged);
        return merged;
      } catch (e) {
        console.warn('Cloud sync unavailable:', e.message || e);
        userId = null;
        setStatus('☁ CLOUD: OFFLINE', 'offline');
        return null;
      }
    },

    // Debounced save after each local save.
    save(progress) {
      if (!client || !userId) return;
      clearTimeout(pushTimer);
      const snapshot = JSON.parse(JSON.stringify(progress));
      pushTimer = setTimeout(() => push(snapshot), 600);
    },

    // Flush any pending save immediately (before logout / account switch).
    async flush(progress) {
      clearTimeout(pushTimer);
      if (progress) await push(JSON.parse(JSON.stringify(progress)));
    },

    // Forget this browser's copy of progress (cloud copy is kept).
    clearLocal() {
      safeDel(localStorage, PROGRESS_KEY);
      safeDel(localStorage, OWNER_KEY);
      safeDel(localStorage, OWNER_GUEST_KEY);
    },

    currentUserId() { return userId; },
  };

  window.CloudSync = CloudSync;
})();
