// Checks the four UX fixes at a narrow (736px) and a desktop (1400px) width.
const puppeteer = require('puppeteer-core');
const URL = process.argv[2] || 'http://localhost:5180/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (n, ok, d = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`); };

// Is the centre (and left/right thirds) of an element reachable by a click?
const reachable = (p, sel) => p.evaluate((s) => {
  const el = document.querySelector(s); if (!el) return 'missing';
  el.scrollIntoView({ block: 'center' });
  return new Promise((res) => setTimeout(() => {
    const r = el.getBoundingClientRect();
    const pts = [0.2, 0.5, 0.8].map((f) => document.elementFromPoint(r.left + r.width * f, r.top + r.height / 2));
    const blocked = pts.filter((e) => !(e === el || el.contains(e))).map((e) => e.id || e.className);
    res(blocked.length ? 'blocked by ' + blocked.join(',') : 'ok');
  }, 400));
}, sel);

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  try {
    const p = await browser.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    await p.setViewport({ width: 736, height: 820 });
    await p.goto(URL, { waitUntil: 'networkidle2' });
    await p.waitForFunction(() => window.TDAuth && document.getElementById('btn-account'), { timeout: 20000 });
    await sleep(1000);

    // 4. No sideways scroll
    const sw = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth, sx: (scrollTo(500, 0), scrollX) }));
    check('No sideways scroll on the title screen at 736px', sw.sx === 0, JSON.stringify(sw));

    // Enter and go to the Mars starter case board
    await p.evaluate(() => { const a = window.gameApp; a.enterMainPage(); a.selectDestination('mars'); a.selectDepth('starter'); });
    await sleep(1500);
    const sw2 = await p.evaluate(() => ({ sx: (scrollTo(500, window.scrollY), scrollX) }));
    check('No sideways scroll inside the game at 736px', sw2.sx === 0);
    const droid = await p.evaluate(() => { const r = document.getElementById('helix7-canvas').getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); });
    check('HELIX-7 is smaller on narrow screens', droid === '104x125', droid);

    // 1. Buttons behind the droid are clickable — test every Open Investigation button at the droid's spot
    const caseBtn = await p.evaluate(async () => {
      const btn = document.querySelector('.level-row-card:not(.locked) button, .level-row-card:not(.locked) .open-btn, .level-row-card:not(.locked)');
      return !!btn;
    });
    // Scroll so the first case row sits right where the droid is (bottom-right)
    const blockedAtDroid = await p.evaluate(async () => {
      const card = document.querySelector('.level-row-card:not(.locked)');
      const w = document.getElementById('helix7-canvas').getBoundingClientRect();
      const r0 = card.getBoundingClientRect();
      window.scrollBy(0, r0.bottom - w.bottom + 10);
      await new Promise((r) => setTimeout(r, 400));
      // sample a grid over the droid's empty corners
      const pts = [[w.left + 5, w.top + 5], [w.right - 5, w.top + 5], [w.left + 5, w.bottom - 20], [w.right - 5, w.bottom - 20]];
      return pts.map(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.id === 'helix7-canvas' || e.closest('.helix7-droid-container')) ? 'droid' : 'page'; });
    });
    check("Empty space around HELIX-7 lets clicks through", blockedAtDroid.every((x) => x === 'page'), JSON.stringify(blockedAtDroid));

    // Open the Opportunity case by actually clicking
    await p.evaluate(() => window.gameApp.startLevel('mars_01_oppy'));
    await sleep(800);
    await p.evaluate(() => window.gameApp.switchGameTab('action'));
    await sleep(800);
    const reach = await reachable(p, '#tilt-right');
    check('"Tilt South-East" button is fully clickable', reach === 'ok', reach);
    check('"Tilt North-West" and "Purge" are clickable', (await reachable(p, '#tilt-left')) === 'ok' && (await reachable(p, '#clean-brush')) === 'ok');
    // Real click on tilt-right changes the angle
    const before = await p.evaluate(() => window.gameApp.miniGameManager.activeGame.angle);
    const tr = await p.$('#tilt-right'); const box = await tr.boundingBox();
    await p.mouse.click(box.x + box.width * 0.7, box.y + box.height / 2);
    const after = await p.evaluate(() => window.gameApp.miniGameManager.activeGame.angle);
    check('Real click on "Tilt South-East" works', after === before + 15, `${before} -> ${after}`);

    // 3. Power lost -> overlay + retry
    // Drain it: panels covered in dust so no charge comes in, battery nearly empty
    await p.evaluate(() => { const g = window.gameApp.miniGameManager.activeGame; g.dustLevel = 100; g.power = 0.5; });
    await p.waitForSelector('#mg-loss-modal', { timeout: 4000 }).catch(() => {});
    const lost = await p.evaluate(() => document.getElementById('mg-loss-modal')?.innerText || '');
    check('Mini-game shows the mission-lost pop-up with a retry', /MISSION LOST/.test(lost) && /TRY AGAIN/.test(lost));
    await p.click('#mg-loss-modal [data-act="retry"]');
    await sleep(500);
    const reset = await p.evaluate(() => { const g = window.gameApp.miniGameManager.activeGame; return { power: Math.round(g.power), lost: g.isLost, overlay: !!document.getElementById('mg-loss-modal') }; });
    check('Retry restarts the mini-game', !reset.lost && !reset.overlay && reset.power >= 28, JSON.stringify(reset));

    // 2. Chat box auto-hides; closing keeps it closed; clicking the droid reopens
    await p.evaluate(() => window.bb8Bot.say('Short test message from HELIX-7.', 'chirp'));
    await sleep(800);
    const open1 = await p.evaluate(() => !document.getElementById('bb8-holo-box').classList.contains('minimized'));
    await sleep(5200);
    const open2 = await p.evaluate(() => !document.getElementById('bb8-holo-box').classList.contains('minimized'));
    check('Chat box opens when HELIX-7 speaks, then hides itself', open1 && !open2, `open=${open1} afterWait=${open2}`);
    await p.evaluate(() => window.bb8Bot.say('Another message.', 'chirp')); await sleep(400);
    await p.evaluate(() => document.getElementById('bb8-btn-toggle').click()); await sleep(300);
    await p.evaluate(() => window.gameApp.goToScreen('levels')); await sleep(1200);
    const stayedClosed = await p.evaluate(() => document.getElementById('bb8-holo-box').classList.contains('minimized'));
    check('After closing it, screen changes keep the chat closed', stayedClosed);
    const hit = await p.$('#helix7-hit'); const hb = await hit.boundingBox();
    await p.mouse.click(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await sleep(900);
    const reopened = await p.evaluate(() => !document.getElementById('bb8-holo-box').classList.contains('minimized'));
    check('Clicking HELIX-7 opens the chat again (with a tip)', reopened);

    // Drag still works
    const w0 = await p.evaluate(() => { const r = document.getElementById('helix7-widget').getBoundingClientRect(); return { x: r.left, y: r.top }; });
    await p.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await p.mouse.down(); await p.mouse.move(hb.x - 200, hb.y - 150, { steps: 8 }); await p.mouse.up();
    await sleep(500);
    const w1 = await p.evaluate(() => { const r = document.getElementById('helix7-widget').getBoundingClientRect(); return { x: r.left, y: r.top }; });
    check('HELIX-7 can still be dragged', Math.abs(w1.x - w0.x) > 100, `${JSON.stringify(w0)} -> ${JSON.stringify(w1)}`);

    // Desktop width: normal droid size, still no sideways scroll
    await p.setViewport({ width: 1400, height: 900 });
    await p.goto(URL, { waitUntil: 'networkidle2' }); await sleep(1500);
    await p.evaluate(() => window.gameApp.enterMainPage()); await sleep(800);
    const d = await p.evaluate(() => { const c = document.getElementById('helix7-canvas'); return { size: c.offsetWidth + 'x' + c.offsetHeight, sx: (scrollTo(500, 0), scrollX) }; });
    check('Desktop: HELIX-7 full size and no sideways scroll', d.size === '150x180' && d.sx === 0, JSON.stringify(d));

    // Regression: all 24 cases still open, login screen still renders
    const cases = await p.evaluate(async () => {
      const app = window.gameApp; let ok = 0;
      for (const de of ['mars', 'moon']) for (const t of ['starter', 'middle', 'advanced']) { app.destination = de; app.depth = t;
        for (const c of window.MISSION_DATABASE[de][t]) { app.startLevel(c.id); await new Promise((r) => setTimeout(r, 120)); app.switchGameTab('action'); await new Promise((r) => setTimeout(r, 200)); if ((document.getElementById('minigame-container').innerHTML || '').length > 50) ok++; } }
      window.TDAuth.showAuth('login'); await new Promise((r) => setTimeout(r, 300));
      return { ok, login: !!document.getElementById('auth-passkey-btn') };
    });
    check('All 24 cases still open; login screen still works', cases.ok === 24 && cases.login, JSON.stringify(cases));
    check('No JavaScript errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { console.error(e); results.push(false); }
  finally { await browser.close(); console.log(`\n${results.filter(Boolean).length}/${results.length} passed`); }
})();
