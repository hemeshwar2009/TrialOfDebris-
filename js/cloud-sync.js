// Cloud save: syncs mission progress to Supabase (project "TrialOfDebris").
// Each browser signs in anonymously (no password) and can only read/write its own
// row in public.player_progress (row-level security). localStorage stays the
// offline fallback, so the game works the same if Supabase is unreachable.
(function () {
  const SUPABASE_URL = 'https://qlocjvakgyngzilvveap.supabase.co';
  // Publishable key: safe to ship in a browser; access is limited by RLS policies.
  const SUPABASE_KEY = 'sb_publishable_HJphtrx20mE9kiJFRk4qXA_egcp8TZM';
  const TABLE = 'player_progress';

  let client = null;
  let userId = null;
  let pushTimer = null;

  function setStatus(text, state) {
    const el = document.getElementById('cloud-sync-status');
    if (!el) return;
    el.textContent = text;
    el.dataset.state = state;
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

  const CloudSync = {
    // Sign in and pull the saved row. Returns merged progress, or null if offline.
    async init(localProgress) {
      if (!window.supabase || !window.supabase.createClient) {
        setStatus('☁ CLOUD: OFFLINE', 'offline');
        return null;
      }
      try {
        setStatus('☁ CLOUD: CONNECTING', 'pending');
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        let { data: { session } } = await client.auth.getSession();
        if (!session) {
          const { data, error } = await client.auth.signInAnonymously();
          if (error) throw error;
          session = data.session;
        }
        userId = session.user.id;

        const { data: row, error } = await client
          .from(TABLE).select('progress').eq('user_id', userId).maybeSingle();
        if (error) throw error;

        const merged = merge(localProgress, row ? row.progress : {});
        await push(merged);
        return merged;
      } catch (e) {
        console.warn('Cloud sync unavailable:', e.message || e);
        client = null;
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
  };

  window.CloudSync = CloudSync;
})();
