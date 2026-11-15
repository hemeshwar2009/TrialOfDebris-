// Wrong verdicts must not solve/unlock; correct ones must. Checked on all 24 cases.
const puppeteer = require('puppeteer-core');
const URL = process.argv[2] || 'http://localhost:5180/';
const results = [];
const check = (n, ok, d = '') => { results.push(!!ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  try {
    const p = await browser.newPage();
    const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    p.on('dialog', (d) => { errors.push('unexpected dialog: ' + d.message()); d.dismiss(); });
    await p.setViewport({ width: 1200, height: 900 });
    await p.goto(URL, { waitUntil: 'networkidle2' });
    await p.waitForFunction(() => window.TDAuth && document.getElementById('btn-account'), { timeout: 20000 });

    // Detailed UI check on one case with real clicks
    await p.evaluate(() => { const a = window.gameApp; a.enterMainPage(); a.selectDestination('mars'); a.selectDepth('starter'); a.startLevel('mars_01_oppy'); });
    await new Promise((r) => setTimeout(r, 600));
    await p.evaluate(() => window.gameApp.switchGameTab('hypothesis'));
    await new Promise((r) => setTimeout(r, 400));
    await p.click('#submit-hypothesis-btn');
    check('Submitting with nothing selected shows an inline hint (no pop-up)', /select a hypothesis/i.test(await p.evaluate(() => document.getElementById('hypo-feedback')?.textContent || '')));
    await p.click('#hypo-card-h2');
    await p.click('#submit-hypothesis-btn');
    await new Promise((r) => setTimeout(r, 500));
    const ui = await p.evaluate(() => ({
      msg: document.getElementById('hypo-feedback')?.textContent || '',
      rejected: document.getElementById('hypo-card-h2').classList.contains('rejected'),
      debrief: !document.getElementById('game-debrief-view').classList.contains('hidden'),
      solved: window.gameApp.savedProgress.mars.starter.solved.includes('mars_01_oppy'),
      unlocked: window.gameApp.savedProgress.mars.starter.unlocked,
      badge: document.getElementById('solved-count-badge')?.textContent,
    }));
    check('Wrong verdict shows "verdict rejected" with the reason', /VERDICT REJECTED/.test(ui.msg) && ui.msg.length > 60, ui.msg.slice(0, 90));
    check('Wrong verdict crosses that option out', ui.rejected);
    check('Wrong verdict does NOT solve, unlock or show the debrief', !ui.solved && ui.unlocked === 1 && !ui.debrief, JSON.stringify({ solved: ui.solved, unlocked: ui.unlocked, debrief: ui.debrief, badge: ui.badge }));
    await p.click('#hypo-card-h2');
    check('A rejected option cannot be picked again', await p.evaluate(() => window.gameApp.selectedHypoId === null));
    await p.click('#hypo-card-h1');
    await p.click('#submit-hypothesis-btn');
    await new Promise((r) => setTimeout(r, 600));
    const ok = await p.evaluate(() => ({
      debrief: !document.getElementById('game-debrief-view').classList.contains('hidden'),
      tag: document.getElementById('debrief-verdict-tag').textContent,
      solved: window.gameApp.savedProgress.mars.starter.solved.includes('mars_01_oppy'),
      unlocked: window.gameApp.savedProgress.mars.starter.unlocked,
      msgHidden: document.getElementById('hypo-feedback').hidden,
    }));
    check('Correct verdict then solves, unlocks next and shows the debrief', ok.debrief && ok.solved && ok.unlocked === 2 && /CONFIRMED/.test(ok.tag) && ok.msgHidden, JSON.stringify(ok));

    // Opening the next case starts with a clean hypothesis panel
    await p.evaluate(() => window.gameApp.startLevel('mars_02_mco')); await new Promise((r) => setTimeout(r, 500));
    const clean = await p.evaluate(() => ({ fb: document.getElementById('hypo-feedback').hidden, rej: document.querySelectorAll('.hypo-card.rejected').length }));
    check('Next case starts with no leftover rejection', clean.fb && clean.rej === 0, JSON.stringify(clean));

    // All 24 cases: every wrong option is rejected without progress; the correct one solves
    const all = await p.evaluate(async () => {
      const app = window.gameApp; const bad = [];
      app.savedProgress = window.CloudSync.emptyProgress();
      for (const d of ['mars', 'moon']) for (const t of ['starter', 'middle', 'advanced']) {
        app.destination = d; app.depth = t;
        for (const c of window.MISSION_DATABASE[d][t]) {
          app.startLevel(c.id); await new Promise((r) => setTimeout(r, 60));
          for (const h of c.hypotheses.filter((x) => !x.correct)) {
            app.selectHypothesis(h.id); app.submitHypothesis();
            if ((app.savedProgress[d][t].solved || []).includes(c.id)) bad.push(c.id + ' solved by wrong ' + h.id);
          }
          const right = c.hypotheses.find((x) => x.correct);
          if (!right) { bad.push(c.id + ' has no correct answer'); continue; }
          app.selectHypothesis(right.id); app.submitHypothesis();
          if (!app.savedProgress[d][t].solved.includes(c.id)) bad.push(c.id + ' not solved by correct answer');
        }
      }
      return { bad, total: app.getSolvedTotal() };
    });
    check('All 24 cases: wrong answers never solve, correct answers always do', all.bad.length === 0 && all.total === 24, all.bad.slice(0, 4).join('; ') || 'total=' + all.total);
    check('No JavaScript errors or pop-ups', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { console.error(e); results.push(false); }
  finally { await browser.close(); console.log(`\n${results.filter(Boolean).length}/${results.length} passed`); }
})();
