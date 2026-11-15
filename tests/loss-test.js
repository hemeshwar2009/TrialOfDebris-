// Forces each of the 12 mini-games into its real losing condition and checks the
// "MISSION LOST" pop-up (science + real mission + tip), Try again and Review evidence.
const puppeteer = require('puppeteer-core');
const URL = process.argv[2] || 'http://localhost:5180/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (n, ok, d = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`); };

// How to push each game into its losing state (runs in the page).
const FORCE = {
  sun_hunter: `g.dustLevel = 100; g.power = 0.5;`,
  touchdown_sensor: `g.altitude = 44; g.filteredCount = 0;`,
  lunar_lander: `g.ship.x = g.pad.x + 40; g.ship.y = g.pad.y - 14; g.ship.vy = 6; g.ship.vx = 0; g.ship.angle = 0;`,
  asteroid_dodge: `g.hull = 1; g.invulnerableTimer = 0; g.asteroids.push({ x: g.probe.x, y: g.probe.y, size: 22, vx: 0, vy: 0, angle: 0, rotSpeed: 0 });`,
  orbital_slingshot: `g.deltaV = 1200; g.executeBurn();`,
  rover_drive: `const s = g.hazards.find(h => h.type === 'sand'); g.rover.x = s.x; g.rover.y = s.y; g.rover.speed = 0;`,
  circuit_patch: `g.connected = { T1: 'S1', T2: 'S2', T3: 'S3', T4: 'S4' }; g.verify();`,
};
const TIMED = ['unit_converter', 'lifeboat_power', 'spectrometer_hunter', 'memory_decrypt', 'radio_tuner'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  try {
    const p = await browser.newPage();
    const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    p.on('dialog', (d) => { errors.push('browser pop-up: ' + d.message()); d.dismiss(); });
    await p.setViewport({ width: 1200, height: 900 });
    await p.goto(URL, { waitUntil: 'networkidle2' });
    await p.waitForFunction(() => window.TDAuth && window.gameApp, { timeout: 20000 });
    await p.evaluate(() => window.gameApp.enterMainPage());

    const cases = await p.evaluate(() => {
      const map = {};
      for (const d of ['mars', 'moon']) for (const t of ['starter', 'middle', 'advanced'])
        for (const c of window.MISSION_DATABASE[d][t]) if (!map[c.miniGame.type]) map[c.miniGame.type] = { d, t, id: c.id, title: c.title };
      return map;
    });
    check('Found a case for all 12 mini-game types', Object.keys(cases).length === 12, Object.keys(cases).length + ' types');

    for (const [type, c] of Object.entries(cases)) {
      await p.evaluate((c) => { const a = window.gameApp; a.destination = c.d; a.depth = c.t; a.goToScreen('game'); a.startLevel(c.id); a.switchGameTab('action'); }, c);
      await sleep(500);
      const timed = TIMED.includes(type);
      if (timed) {
        const t0 = await p.evaluate(() => document.getElementById('mg-countdown')?.innerText || '');
        await sleep(2100);
        const t1 = await p.evaluate(() => document.getElementById('mg-countdown')?.innerText || '');
        check(`${type}: countdown shows and ticks`, /\d:\d\d/.test(t0) && t0 !== t1, `${t0.replace(/\n/g, ' ')} → ${t1.replace(/\n/g, ' ')}`);
        // Run out the clock quickly by triggering the same timeout path the countdown uses
        await p.evaluate((type) => window.gameApp.miniGameManager.showLoss(type, 'timeout'), type);
      } else {
        await p.evaluate((code) => { const g = window.gameApp.miniGameManager.activeGame; new Function('g', code)(g); }, FORCE[type]);
      }
      await p.waitForSelector('#mg-loss-modal', { timeout: type === 'rover_drive' ? 7000 : 5000 }).catch(() => {});
      const m = await p.evaluate(() => {
        const el = document.getElementById('mg-loss-modal'); if (!el) return null;
        return {
          title: el.querySelector('.mg-loss-title')?.textContent || '',
          concept: el.querySelector('.concept p')?.textContent || '',
          real: el.querySelector('.real p')?.textContent || '',
          realHead: el.querySelector('.real h4')?.textContent || '',
          tip: el.querySelector('.mg-loss-tip')?.textContent || '',
          lost: window.gameApp.miniGameManager.activeGame?.isLost,
          timerGone: !document.getElementById('mg-countdown'),
        };
      });
      check(`${type}: "Mission lost" pop-up with science + real mission + tip`,
        m && m.title.length > 20 && m.concept.length > 80 && m.real.length > 30 && m.tip.length > 15 && m.lost && m.timerGone,
        m ? `"${m.title.slice(0, 60)}" | ${m.realHead.slice(0, 50)}` : 'no pop-up');
      // Try again → fresh game, pop-up gone
      await p.click('#mg-loss-modal [data-act="retry"]');
      await sleep(400);
      const fresh = await p.evaluate(() => ({ modal: !!document.getElementById('mg-loss-modal'), lost: !!window.gameApp.miniGameManager.activeGame?.isLost, timer: !!document.getElementById('mg-countdown') }));
      check(`${type}: Try again restarts the game`, !fresh.modal && !fresh.lost && (!timed || fresh.timer), JSON.stringify(fresh));
    }

    // Review evidence closes the pop-up and opens the Evidence tab
    await p.evaluate((c) => { const a = window.gameApp; a.destination = c.d; a.depth = c.t; a.startLevel(c.id); a.switchGameTab('action'); }, cases.circuit_patch);
    await sleep(400);
    await p.evaluate(() => { const g = window.gameApp.miniGameManager.activeGame; g.connected = { T1: 'S1', T2: 'S2', T3: 'S3', T4: 'S4' }; g.verify(); });
    await p.waitForSelector('#mg-loss-modal');
    await p.click('#mg-loss-modal [data-act="review"]');
    await sleep(400);
    check('Review evidence closes the pop-up and opens the Evidence tab',
      await p.evaluate(() => !document.getElementById('mg-loss-modal') && document.getElementById('tab-btn-clues').classList.contains('active')));

    // A timed game can still be won, and winning removes the countdown
    await p.evaluate((c) => { const a = window.gameApp; a.destination = c.d; a.depth = c.t; a.startLevel(c.id); a.switchGameTab('action'); }, cases.unit_converter);
    await sleep(400);
    await p.evaluate(() => { [1, 2, 3].forEach((id) => window.activeUnitGame.fixPacket(id)); });
    await sleep(2800);
    check('Timed game can be won; countdown disappears on win',
      await p.evaluate(() => !document.getElementById('mg-countdown') && !document.getElementById('mg-loss-modal') && document.getElementById('tab-btn-clues').classList.contains('active')));

    // Leaving the case screen stops a running countdown (no surprise pop-up later)
    await p.evaluate((c) => { const a = window.gameApp; a.destination = c.d; a.depth = c.t; a.startLevel(c.id); a.switchGameTab('action'); }, cases.radio_tuner);
    await sleep(300);
    await p.evaluate(() => window.gameApp.goToScreen('levels'));
    await sleep(500);
    check('Leaving the case stops the countdown', await p.evaluate(() => !document.getElementById('mg-countdown') && !window.gameApp.miniGameManager.activeGame));

    // One real full-length timeout (spectrometer, 35 s) to prove the clock itself ends the game
    await p.evaluate((c) => { const a = window.gameApp; a.destination = c.d; a.depth = c.t; a.goToScreen('game'); a.startLevel(c.id); a.switchGameTab('action'); }, cases.spectrometer_hunter);
    await p.waitForSelector('#mg-loss-modal', { timeout: 40000 }).catch(() => {});
    check('Countdown reaching 0:00 really triggers the pop-up (35 s spectrometer)', await p.evaluate(() => /observation window/i.test(document.querySelector('#mg-loss-modal .mg-loss-title')?.textContent || '')));

    check('No JavaScript errors or browser pop-ups', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { console.error(e); results.push(false); }
  finally { await browser.close(); console.log(`\n${results.filter(Boolean).length}/${results.length} passed`); }
})();
