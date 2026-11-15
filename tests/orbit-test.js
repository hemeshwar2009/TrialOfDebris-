// Orbit capture must start off-target, lose if fired untouched, and win after tuning.
const puppeteer = require('puppeteer-core');
const URL = process.argv[2] || 'http://localhost:5180/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (n, ok, d = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  try {
    const p = await browser.newPage();
    const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    await p.setViewport({ width: 1200, height: 900 });
    await p.goto(URL, { waitUntil: 'networkidle2' });
    await p.waitForFunction(() => window.TDAuth && window.gameApp, { timeout: 20000 });
    const open = () => p.evaluate(() => {
      const a = window.gameApp; a.enterMainPage();
      for (const d of ['mars', 'moon']) for (const t of ['starter', 'middle', 'advanced']) {
        const c = window.MISSION_DATABASE[d][t].find((x) => x.miniGame.type === 'orbital_slingshot');
        if (c) { a.destination = d; a.depth = t; a.goToScreen('game'); a.startLevel(c.id); a.switchGameTab('action'); return c.title; }
      }
    });
    const title = await open();
    await sleep(400);

    const starts = await p.evaluate(() => {
      const out = []; const m = window.gameApp.miniGameManager;
      for (let i = 0; i < 30; i++) {
        m.launch(m.lastType, m.lastCase);
        const g = m.activeGame;
        out.push({ a: g.angle, dv: g.deltaV, status: document.getElementById('slingshot-orbit-status').textContent, shown: document.getElementById('slingshot-angle-val').textContent });
      }
      return out;
    });
    const inWindow = starts.filter((s) => Math.abs(s.a - 6) <= 6 && Math.abs(s.dv - 1650) <= 120);
    check(`30 launches of "${title.split(':')[0]}" all start outside the winning window`, inWindow.length === 0, `e.g. ${starts.slice(0, 4).map((s) => s.a + '°/' + s.dv).join(', ')}`);
    check('Predicted orbit never starts as "stable"', starts.every((s) => !/STABLE/.test(s.status)), [...new Set(starts.map((s) => s.status))].join(' | '));
    check('Negative angles display correctly (no "+-")', starts.every((s) => !/\+-/.test(s.shown)));
    check('Starting values vary between launches', new Set(starts.map((s) => s.a + '/' + s.dv)).size > 3);

    // Fire immediately → loss pop-up
    await p.click('#btn-fire-slingshot');
    await p.waitForSelector('#mg-loss-modal', { timeout: 6000 }).catch(() => {});
    check('Firing without tuning loses (mission-lost pop-up)', await p.evaluate(() => !!document.getElementById('mg-loss-modal')),
      await p.evaluate(() => document.querySelector('#mg-loss-modal .mg-loss-title')?.textContent || ''));
    await p.click('#mg-loss-modal [data-act="retry"]');
    await sleep(400);

    // Tune with the real sliders (set value + fire input event like a drag), then fire → win
    await p.evaluate(() => {
      const set = (id, v) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('input', { bubbles: true })); };
      set('slider-angle', 6); set('slider-dv', 1650);
    });
    const status = await p.evaluate(() => document.getElementById('slingshot-orbit-status').textContent);
    check('Tuning to ~6° and ~1650 m/s shows a stable capture prediction', /STABLE/.test(status), status);
    await p.click('#btn-fire-slingshot');
    await sleep(3500);
    check('Firing after tuning wins (Evidence tab opens, no pop-up)', await p.evaluate(() => !document.getElementById('mg-loss-modal') && document.getElementById('tab-btn-clues').classList.contains('active')));
    check('No JavaScript errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { console.error(e); results.push(false); }
  finally { await browser.close(); console.log(`\n${results.filter(Boolean).length}/${results.length} passed`); }
})();
