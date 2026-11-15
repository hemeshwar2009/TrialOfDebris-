/**
 * NASA SPACE LEGACY - Retro Action Mini-Games
 * Interactive, retro-styled detective action puzzles that teach hardware mechanisms silently.
 */

/**
 * "MISSION LOST" pop-up content for every mini-game.
 * Each entry teaches the science concept behind the failure. The real-mission
 * paragraph in the pop-up comes from the case's own historicalDebrief text
 * (cases-data.js), so no new historical claims are made here.
 *   reasons:  why the player lost (key passed by the game)
 *   concept:  the general science / engineering idea
 *   tip:      how to win next time
 *   timer:    [seconds, label] for puzzle games that are lost when time runs out
 */
const MG_LOSS = {
  sun_hunter: {
    reasons: { power: 'The battery hit zero — the rover went silent.' },
    concept: 'Solar panels only make power when they face the Sun and stay clean. Thick dust in the air (high opacity, τ) and dust on the panels both cut the light. Below a minimum charge a rover can\'t run its heaters, and its cold electronics stop working.',
    tip: 'Tilt toward the sun as it moves and purge dust often — dust builds up fast.',
  },
  unit_converter: {
    reasons: { timeout: 'The orbit-insertion burn started with the wrong numbers — the orbiter dived too deep into the atmosphere.' },
    concept: 'Units must match. 1 pound-force-second = 4.45 newton-seconds. If one program reports thruster pushes in one unit and another reads them as a different unit, every correction is mis-sized, and small errors pile up over months into a big trajectory error.',
    tip: 'Convert every telemetry packet to metric (×4.45) before the countdown ends.',
    timer: [30, 'ORBIT INSERTION BURN IN'],
  },
  touchdown_sensor: {
    reasons: { engines_cut: 'A false "touchdown" signal shut the descent engines off while the lander was still in the air.' },
    concept: 'Sensors can produce false readings, called transients. Flight software must "debounce" them — ignore a signal unless it is real and steady — or it can act on a glitch. A spurious "we\'ve landed" signal can cut the engines too early.',
    tip: 'Purge every transient spike before the lander drops below 40 m.',
  },
  lifeboat_power: {
    reasons: { timeout: 'Carbon dioxide built up before the lifeboat was reconfigured.' },
    concept: 'Batteries are a fixed budget: current (amps) × time. In an emergency you power only what keeps the crew alive and in contact. Astronauts breathe out CO₂; lithium-hydroxide canisters absorb it — without a working scrubber, CO₂ rises to dangerous levels.',
    tip: 'Shut down the non-essential loads, keep life support and radio on, connect the CO₂ scrubber, and stay at or under 15 amps.',
    timer: [45, 'CO₂ REACHES DANGER LEVEL IN'],
  },
  spectrometer_hunter: {
    reasons: { timeout: 'The observation window closed before the water-ice signature was confirmed.' },
    concept: 'Molecules absorb light at specific wavelengths, leaving dips ("absorption bands") in a spectrum — a chemical fingerprint. Water shows absorption near 1.45 µm and 1.95 µm in the near-infrared.',
    tip: 'Sweep the slider to 1.45 µm or 1.95 µm and confirm the band quickly.',
    timer: [35, 'OBSERVATION WINDOW CLOSES IN'],
  },
  lunar_lander: {
    reasons: {
      too_fast: 'The lander hit the ground too fast and crushed its landing struts.',
      missed_pad: 'The lander came down off the safe landing zone, into rough terrain.',
      tilt: 'The lander touched down tilted too far and tipped over.',
    },
    concept: 'Gravity never stops pulling. The engine has to cancel both the falling speed and the sideways drift. A safe touchdown needs low vertical and horizontal speed, an upright attitude, and a flat, clear spot — with fuel to spare.',
    tip: 'Burn early to slow your fall, level out before touchdown, and arrive over the pad slowly.',
  },
  asteroid_dodge: {
    reasons: { hull: 'Debris strikes destroyed the probe\'s hull.' },
    concept: 'In space even tiny particles travel at kilometres per second, so they carry enormous energy. Spacecraft survive dust and micrometeoroids with shielding, careful trajectories and by limiting time in debris-rich regions.',
    tip: 'Keep moving, use the shield pulse when rocks cluster, and grab data packets between waves.',
  },
  orbital_slingshot: {
    reasons: {
      escape: 'The braking burn was too small — the spacecraft flew past the planet and escaped.',
      impact: 'The braking burn was too large — the spacecraft dropped too low into the atmosphere.',
      eccentric: 'The burn missed the target corridor — the spacecraft ended up in the wrong orbit.',
    },
    concept: 'To be captured into orbit a spacecraft must fire its engine to slow down by just the right amount (Δv) at the right angle. Too little and gravity can\'t hold it; too much or the wrong angle and it falls too low or ends up in the wrong orbit.',
    tip: 'Use the orbit preview: aim for an approach angle near 6° and a Δv near 1,650 m/s before firing.',
  },
  rover_drive: {
    reasons: {
      sand: 'The rover\'s wheels dug into soft soil and it got stuck.',
      rocks: 'Sharp rocks tore up the rover\'s wheels.',
    },
    concept: 'Loose, soft soil can\'t support a rover\'s weight — wheels dig in and spin in place. Sharp, wind-carved rocks can puncture thin aluminium wheels. Rover drivers plan routes around both and watch wheel slip as they drive.',
    tip: 'Steer around the sand patches and rock fields — the slower, longer route is the safer one.',
  },
  circuit_patch: {
    reasons: { miswired: 'A jumper was patched to the wrong relay and the circuit overloaded.' },
    concept: 'Every wire has a job. Connecting power, timing and data lines to the wrong place can overload circuits or make flight software stall. Engineers check every connection against the schematic before powering up.',
    tip: 'Match each terminal\'s function to the socket that needs it (power → heater, watchdog → timer, mutex → CPU, RF → transceiver).',
  },
  memory_decrypt: {
    reasons: { timeout: 'The ground-station pass ended before the corrupted memory was repaired.' },
    concept: 'Radiation in space can flip bits in computer memory (a 0 becomes a 1). Parity bits and checksums detect the damage, and engineers upload corrected bytes before the spacecraft acts on bad commands.',
    tip: 'Cycle only the faulty bytes until the checksum reaches 100%, then commit.',
    timer: [45, 'COMMAND UPLINK WINDOW CLOSES IN'],
  },
  radio_tuner: {
    reasons: { timeout: 'The faint signal faded before the receiver locked on.' },
    concept: 'A ground receiver must match the spacecraft\'s carrier frequency and phase to pull a weak signal out of noise. Deep Space Network antennas "lock" onto the carrier — if they\'re off, the data turns into static.',
    tip: 'Tune frequency first until the waves match in speed, then shift phase until they line up.',
    timer: [40, 'SIGNAL FADES IN'],
  },
};

class MiniGameManager {
  constructor(containerId, onComplete) {
    this.container = document.getElementById(containerId);
    this.onComplete = onComplete;
    this.activeGame = null;
    this.animFrame = null;
    this.lastType = null;
    this.lastCase = null;
    this.countdown = null;
  }

  stop() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    this.clearCountdown();
    this.closeLoss();
    if (this.activeGame && this.activeGame.destroy) {
      this.activeGame.destroy();
    }
    this.activeGame = null;
    this.container.innerHTML = '';
  }

  // ---------- "Mission lost" pop-up ----------
  showLoss(type, reasonKey) {
    const info = MG_LOSS[type];
    const game = this.activeGame;
    if (!info || !game || game.isWon || game.lossShown) return;
    game.isLost = true;
    game.lossShown = true;
    this.clearCountdown();
    try { window.soundEngine.playError(); } catch (e) {}

    const c = this.lastCase || {};
    const esc = (s) => String(s || '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const real = c.historicalDebrief && c.historicalDebrief.whatInvestigatorsProved;
    const what = info.reasons[reasonKey] || Object.values(info.reasons)[0];

    this.closeLoss();
    const modal = document.createElement('div');
    modal.className = 'mg-loss-modal';
    modal.id = 'mg-loss-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'mg-loss-title');
    modal.innerHTML = `
      <div class="mg-loss-card">
        <div class="mg-loss-badge">⚠ MISSION LOST</div>
        <h3 id="mg-loss-title" class="mg-loss-title">${esc(what)}</h3>
        <section class="mg-loss-sec concept">
          <h4>🔬 THE SCIENCE</h4>
          <p>${esc(info.concept)}</p>
        </section>
        ${real ? `<section class="mg-loss-sec real">
          <h4>🛰 THE REAL MISSION${c.title ? ' · ' + esc(c.title.split(':')[0]) : ''}</h4>
          <p>${esc(real)}</p>
        </section>` : ''}
        <p class="mg-loss-tip"><strong>TIP:</strong> ${esc(info.tip)}</p>
        <div class="mg-loss-actions">
          <button type="button" class="retro-btn pulse-btn" data-act="retry">↻ TRY AGAIN</button>
          <button type="button" class="retro-btn" data-act="review">🔍 REVIEW EVIDENCE</button>
        </div>
      </div>`;
    modal.querySelector('[data-act="retry"]').onclick = () => this.retry();
    modal.querySelector('[data-act="review"]').onclick = () => {
      this.closeLoss();
      if (window.gameApp && window.gameApp.switchGameTab) window.gameApp.switchGameTab('clues');
    };
    modal.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.querySelector('[data-act="review"]').click(); });
    document.body.appendChild(modal);
    setTimeout(() => { const b = modal.querySelector('[data-act="retry"]'); if (b) b.focus(); }, 50);

    if (window.bb8Bot && window.bb8Bot.say) {
      window.bb8Bot.say('BOOP-BZZT! Mission lost — but that\'s how real engineers learned! Read the science, then try again!', 'curious');
    }
  }

  closeLoss() {
    const m = document.getElementById('mg-loss-modal');
    if (m) m.remove();
  }

  retry() {
    this.closeLoss();
    if (this.lastType) this.launch(this.lastType, this.lastCase);
  }

  // ---------- Countdown for puzzle games ----------
  startCountdown(type) {
    this.clearCountdown();
    const info = MG_LOSS[type];
    if (!info || !info.timer) return;
    let left = info.timer[0];
    const label = info.timer[1];
    const bar = document.createElement('div');
    bar.className = 'mg-countdown';
    bar.id = 'mg-countdown';
    bar.setAttribute('role', 'timer');
    const paint = () => {
      const m = Math.floor(left / 60), s = String(left % 60).padStart(2, '0');
      bar.innerHTML = `<span>⏱ ${label}</span><strong>${m}:${s}</strong>`;
      bar.classList.toggle('urgent', left <= 10);
    };
    paint();
    this.container.parentElement.insertBefore(bar, this.container);
    this.countdown = setInterval(() => {
      const g = this.activeGame;
      if (!g || g.isWon || g.isLost) { this.clearCountdown(); return; }
      left -= 1;
      paint();
      if (left <= 0) this.showLoss(type, 'timeout');
    }, 1000);
  }

  clearCountdown() {
    if (this.countdown) clearInterval(this.countdown);
    this.countdown = null;
    const bar = document.getElementById('mg-countdown');
    if (bar) bar.remove();
  }

  launch(type, caseData) {
    this.stop();
    this.lastType = type;
    this.lastCase = caseData;
    window.soundEngine.playSelect();

        switch (type) {
      case 'sun_hunter':
        this.activeGame = new SunHunterGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'unit_converter':
        this.activeGame = new UnitConverterGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'touchdown_sensor':
        this.activeGame = new TouchdownSensorGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'lifeboat_power':
        this.activeGame = new LifeboatPowerGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'spectrometer_hunter':
        this.activeGame = new SpectrometerGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'lunar_lander':
        this.activeGame = new LunarLanderArcadeGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'asteroid_dodge':
        this.activeGame = new AsteroidDodgeGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'orbital_slingshot':
        this.activeGame = new OrbitalSlingshotGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'rover_drive':
        this.activeGame = new RoverDriveGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'circuit_patch':
        this.activeGame = new CircuitWirePatchGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'memory_decrypt':
        this.activeGame = new MemoryDecryptGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      case 'radio_tuner':
        this.activeGame = new RadioTunerGame(this.container, () => this.handleSuccess(caseData), caseData);
        break;
      default:
        this.activeGame = new SunHunterGame(this.container, () => this.handleSuccess(caseData), caseData);
    }
    // Games report a loss with this.onLose('reasonKey'); puzzle games also get a countdown.
    const gameType = MG_LOSS[type] ? type : 'sun_hunter';
    if (this.activeGame) this.activeGame.onLose = (reason) => this.showLoss(gameType, reason);
    this.startCountdown(gameType);
  }

  handleSuccess(caseData) {
    this.clearCountdown();
    window.soundEngine.playSuccess();
    if (this.onComplete) {
      this.onComplete(caseData);
    }
  }
}

/**
 * MINI-GAME 1: Sun Hunter & Dust Storm Survival (Opportunity & Spirit)
 */
class SunHunterGame {
  constructor(container, onWin) {
    this.container = container;
    this.onWin = onWin;
    this.power = 30; // 0 to 100
    this.dustLevel = 25; // 0 to 100
    this.angle = 0; // -45 to 45
    this.targetSunAngle = 0;
    this.isWon = false;
    this.isLost = false;

    this.render();
    this.initCanvas();
    this.startLoop();
  }

  render() {
    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> RETRO ACTION SIMULATOR</span>
          <h3 class="minigame-title">MARTIAN DUST STORM & SOLAR HARVEST</h3>
          <p class="minigame-sub">Align solar panels with sporadic sunbeams & click/tap dust clusters to wipe them away before battery power hits zero!</p>
        </div>

        <div class="canvas-wrap">
          <canvas id="mg-canvas" width="600" height="260"></canvas>
          <div class="scanline-overlay"></div>
        </div>

        <div class="mg-hud-row">
          <div class="mg-stat-box">
            <span class="mg-stat-label">BATTERY POWER</span>
            <div class="mg-progress-bar"><div id="mg-power-fill" class="mg-fill power-fill" style="width: 30%"></div></div>
            <span id="mg-power-text" class="mg-stat-val">30%</span>
          </div>

          <div class="mg-stat-box">
            <span class="mg-stat-label">SOLAR ARRAY DUST</span>
            <div class="mg-progress-bar"><div id="mg-dust-fill" class="mg-fill dust-fill" style="width: 25%"></div></div>
            <span id="mg-dust-text" class="mg-stat-val">25% (Wipe dust!)</span>
          </div>
        </div>

        <div class="mg-controls">
          <button id="tilt-left" class="retro-btn sm-btn">◀ TILT NORTH-WEST</button>
          <button id="clean-brush" class="retro-btn pulse-btn sm-btn">🧹 PURGE DUST CLUSTERS</button>
          <button id="tilt-right" class="retro-btn sm-btn">TILT SOUTH-EAST ▶</button>
        </div>
      </div>
    `;

    document.getElementById('tilt-left').onclick = () => {
      this.angle = Math.max(-45, this.angle - 15);
      window.soundEngine.playTone(400, 0.05);
    };
    document.getElementById('tilt-right').onclick = () => {
      this.angle = Math.min(45, this.angle + 15);
      window.soundEngine.playTone(550, 0.05);
    };
    document.getElementById('clean-brush').onclick = () => {
      this.dustLevel = Math.max(0, this.dustLevel - 20);
      window.soundEngine.playGlitch();
      this.spawnDustSparks();
    };

    const canvas = document.getElementById('mg-canvas');
    canvas.addEventListener('click', (e) => {
      this.dustLevel = Math.max(0, this.dustLevel - 15);
      window.soundEngine.playTone(700, 0.04);
      this.spawnDustSparks();
    });
  }

  initCanvas() {
    this.canvas = document.getElementById('mg-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.sparks = [];

    // Init dust particles
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 3 - 2,
        speedY: Math.random() * 1.5 + 0.5
      });
    }
  }

  spawnDustSparks() {
    for (let i = 0; i < 15; i++) {
      this.sparks.push({
        x: this.canvas.width / 2 + (Math.random() - 0.5) * 160,
        y: 180 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 2,
        life: 1.0,
        color: '#c084fc'
      });
    }
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (!this.isWon && !this.isLost) {
        // Sun angle wanders slowly
        this.targetSunAngle = Math.sin(time / 2000) * 35;

        // Dust accumulates gradually
        this.dustLevel = Math.min(100, this.dustLevel + dt * 4);

        // Alignment check
        const diff = Math.abs(this.angle - this.targetSunAngle);
        const alignmentFactor = Math.max(0, 1 - diff / 40);
        const cleanlinessFactor = Math.max(0, (100 - this.dustLevel) / 100);

        const powerGain = alignmentFactor * cleanlinessFactor * 18 - 4;
        this.power = Math.max(0, Math.min(100, this.power + powerGain * dt));

        // Update UI
        const powerFill = document.getElementById('mg-power-fill');
        const powerText = document.getElementById('mg-power-text');
        const dustFill = document.getElementById('mg-dust-fill');
        const dustText = document.getElementById('mg-dust-text');

        if (powerFill) {
          powerFill.style.width = `${this.power}%`;
          powerText.textContent = `${Math.round(this.power)}%`;
          dustFill.style.width = `${this.dustLevel}%`;
          dustText.textContent = `${Math.round(this.dustLevel)}% dust`;
        }

        if (this.power >= 100) {
          this.isWon = true;
          this.onWin();
        } else if (this.power <= 0) {
          this.showPowerLost();
        }
      }

      this.draw(time);
      this.animFrame = requestAnimationFrame(loop);
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  // Battery hit zero → shared "mission lost" pop-up (MiniGameManager.showLoss).
  showPowerLost() {
    this.isLost = true;
    if (this.onLose) this.onLose('power');
  }

  draw(time) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Martian dark purple sky
    ctx.fillStyle = '#0f081d';
    ctx.fillRect(0, 0, w, h);

    // Starfield / red dust haze
    ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
    ctx.fillRect(0, 0, w, h);

    // Sunbeam
    const sunX = w / 2 + Math.sin(time / 2000) * 120;
    const sunY = 40;
    const grad = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 140);
    grad.addColorStop(0, 'rgba(255, 220, 100, 0.8)');
    grad.addColorStop(0.3, 'rgba(217, 70, 239, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 140, 0, Math.PI * 2);
    ctx.fill();

    // Sun orb
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 14, 0, Math.PI * 2);
    ctx.fill();

    // Sun direction beam line
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(w / 2, 180);
    ctx.stroke();
    ctx.setLineDash([]);

    // Martian Horizon
    ctx.fillStyle = '#261238';
    ctx.beginPath();
    ctx.moveTo(0, 210);
    ctx.bezierCurveTo(150, 195, 450, 220, w, 205);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Rover Chassis Silhouette
    ctx.fillStyle = '#4c1d95';
    ctx.fillRect(w / 2 - 35, 180, 70, 25);
    // Wheels
    ctx.fillStyle = '#1e0e3e';
    ctx.beginPath();
    ctx.arc(w / 2 - 38, 205, 10, 0, Math.PI * 2);
    ctx.arc(w / 2, 207, 10, 0, Math.PI * 2);
    ctx.arc(w / 2 + 38, 205, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Solar Panel (Tilts!)
    ctx.save();
    ctx.translate(w / 2, 175);
    ctx.rotate((this.angle * Math.PI) / 180);

    // Solar array wings
    ctx.fillStyle = '#172554';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(-70, -8, 140, 16);
    ctx.strokeRect(-70, -8, 140, 16);

    // Solar cells lines
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    for (let x = -60; x <= 60; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, -8);
      ctx.lineTo(x, 8);
      ctx.stroke();
    }

    // Dust buildup layer on solar panel
    if (this.dustLevel > 5) {
      ctx.fillStyle = `rgba(180, 83, 9, ${this.dustLevel / 120})`;
      ctx.fillRect(-70, -8, 140, 16);
      // Clumps
      ctx.fillStyle = 'rgba(217, 119, 6, 0.7)';
      for (let c = 0; c < Math.floor(this.dustLevel / 10); c++) {
        ctx.beginPath();
        ctx.arc(-55 + c * 14, (c % 2 === 0 ? -3 : 3), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Sparks from cleaning
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.03;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      } else {
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life;
        ctx.fillRect(s.x, s.y, 3, 3);
      }
    }
    ctx.globalAlpha = 1.0;

    // Flying dust particles
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    this.particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      if (p.x < 0) p.x = w;
      if (p.y > h) p.y = 0;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // Retro HUD text
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#a855f7';
    ctx.fillText(`PANEL ANGLE: ${this.angle}°`, 14, 25);
    ctx.fillText(`SUN ELEVATION: ${Math.round(this.targetSunAngle)}°`, 14, 42);

    if (this.isWon) {
      ctx.fillStyle = 'rgba(10, 6, 20, 0.85)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.fillStyle = '#4ade80';
      ctx.textAlign = 'center';
      ctx.fillText('CRITICAL POWER RESTORED!', w / 2, h / 2 - 10);
      ctx.font = '10px "VT323", monospace';
      ctx.fillStyle = '#e879f9';
      ctx.fillText('BATTERY WARMTH SAVED // DECRYPTING CASE CLUES...', w / 2, h / 2 + 15);
      ctx.textAlign = 'start';
    }
  }

  destroy() {
    this.isWon = true;
  }
}

/**
 * MINI-GAME 2: Navigation Unit Mix-Up Calibrator (Mars Climate Orbiter)
 */
class UnitConverterGame {
  constructor(container, onWin) {
    this.container = container;
    this.onWin = onWin;
    this.isWon = false;
    this.altitude = 57; // km
    this.targetAltitude = 145; // safe km
    this.burnData = [
      { id: 1, label: 'TCM-1 DESATURATION BURN', value: 3.2, unit: 'lbf·s (Imperial)', correctUnit: 'N·s (Metric)', factor: 4.45, fixed: false },
      { id: 2, label: 'TCM-2 TRAJECTORY SHIFT', value: 1.8, unit: 'lbf·s (Imperial)', correctUnit: 'N·s (Metric)', factor: 4.45, fixed: false },
      { id: 3, label: 'TCM-3 PERIAPSIS TRIM', value: 4.5, unit: 'lbf·s (Imperial)', correctUnit: 'N·s (Metric)', factor: 4.45, fixed: false }
    ];

    this.render();
  }

  render() {
    const fixedCount = this.burnData.filter(b => b.fixed).length;
    this.altitude = 57 + fixedCount * 30;

    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> FORENSIC CODE AUDITOR</span>
          <h3 class="minigame-title">THRUSTER TELEMETRY UNIT MISMATCH</h3>
          <p class="minigame-sub">Navigation expects SI Metric (Newton·seconds). Lockheed ground software handed off Imperial (Pound-force·seconds)! Convert each telemetry packet before atmospheric burnup!</p>
        </div>

        <div class="mco-trajectory-gauge">
          <div class="trajectory-scale">
            <div class="zone-danger">DANGER ENTRY: &lt; 80 KM (BURNUP ZONE)</div>
            <div class="zone-safe">SAFE ORBIT: 140 - 160 KM</div>
          </div>
          <div class="altitude-marker" style="left: ${Math.min(100, Math.max(0, (this.altitude - 40) / (160 - 40) * 100))}%">
            ▲ ${this.altitude} KM PERIAPSIS
          </div>
        </div>

        <div class="unit-packets-grid">
          ${this.burnData.map(burn => `
            <div class="unit-packet-card ${burn.fixed ? 'fixed-packet' : 'error-packet'}">
              <div class="packet-head">
                <span class="packet-tag">${burn.label}</span>
                <span class="packet-status">${burn.fixed ? '✓ VERIFIED METRIC' : '⚠ UNIT MISMATCH'}</span>
              </div>
              <div class="packet-math">
                <div class="math-row">
                  <span>GROUND FILE:</span>
                  <span class="code-val">${burn.value} ${burn.unit}</span>
                </div>
                <div class="math-row">
                  <span>REQUIRED SI:</span>
                  <span class="code-val target-metric">${burn.fixed ? (burn.value * burn.factor).toFixed(2) + ' N·s' : '??? N·s'}</span>
                </div>
              </div>
              <button class="retro-btn sm-btn ${burn.fixed ? 'btn-disabled' : 'pulse-btn'}" onclick="window.activeUnitGame.fixPacket(${burn.id})">
                ${burn.fixed ? 'SI COMPLIANT (×4.45)' : 'CONVERT TO METRIC (×4.45)'}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    window.activeUnitGame = this;

    if (fixedCount === this.burnData.length && !this.isWon) {
      this.isWon = true;
      setTimeout(() => {
        this.onWin();
      }, 700);
    }
  }

  fixPacket(id) {
    const item = this.burnData.find(b => b.id === id);
    if (item && !item.fixed) {
      item.fixed = true;
      window.soundEngine.playSuccess();
      this.render();
    }
  }

  destroy() {
    window.activeUnitGame = null;
  }
}

/**
 * MINI-GAME 3: Touchdown Sensor Debounce Filter (Mars Polar Lander & Apollo 11)
 */
class TouchdownSensorGame {
  constructor(container, onWin) {
    this.container = container;
    this.onWin = onWin;
    this.altitude = 120; // meters
    this.engineStatus = 'FIRING (ACTIVE)';
    this.noiseEvents = [];
    this.filteredCount = 0;
    this.targetFilters = 4;
    this.isWon = false;

    this.render();
    this.startSimulation();
  }

  render() {
    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> RADAR DESCENT CONTROLLER</span>
          <h3 class="minigame-title">LEG SENSOR TRANSIENT FILTER</h3>
          <p class="minigame-sub">Landing legs deployment generated transient electrical noise. Filter out the false touchdown signals before the computer prematurely cuts the descent engines!</p>
        </div>

        <div class="radar-hud-screen">
          <div class="radar-dial">
            <span class="radar-label">RADAR ALTITUDE</span>
            <span id="alt-readout" class="alt-digital">${Math.round(this.altitude)} M</span>
            <span id="engine-readout" class="engine-digital">STATUS: ${this.engineStatus}</span>
          </div>

          <div class="signal-stream-container">
            <span class="stream-title">DESCENT SENSOR TRANSIENT INTERRUPT QUEUE</span>
            <div id="noise-stream" class="noise-stream">
              <!-- Noise signal items appear here -->
            </div>
          </div>
        </div>

        <div class="filter-action-bar">
          <button id="debounce-filter-btn" class="retro-btn pulse-btn">⚡ DEBOUNCE FALSE SIGNAL PULSE (<span id="filter-progress">${this.filteredCount}/${this.targetFilters}</span>)</button>
        </div>
      </div>
    `;

    document.getElementById('debounce-filter-btn').onclick = () => {
      this.handleFilterClick();
    };
  }

  startSimulation() {
    this.timer = setInterval(() => {
      if (this.isWon || this.isLost) return;

      this.altitude = Math.max(0, this.altitude - 4);
      const altReadout = document.getElementById('alt-readout');
      if (altReadout) {
        altReadout.textContent = `${Math.round(this.altitude)} M`;
      }

      // Add noise pulse if less than 3 active
      if (this.noiseEvents.length < 3 && Math.random() > 0.4) {
        this.spawnNoisePulse();
      }

      if (this.altitude <= 0 && this.filteredCount >= this.targetFilters) {
        this.isWon = true;
        clearInterval(this.timer);
        window.soundEngine.playSuccess();
        this.onWin();
      } else if (this.altitude <= 40 && this.filteredCount < this.targetFilters) {
        // Unfiltered transient read as "touchdown" → engines cut while still airborne.
        clearInterval(this.timer);
        const eng = document.getElementById('engine-readout');
        if (eng) eng.textContent = 'STATUS: ENGINES CUT (FALSE TOUCHDOWN)';
        this.isLost = true;
        if (this.onLose) this.onLose('engines_cut');
      }
    }, 400);
  }

  spawnNoisePulse() {
    const stream = document.getElementById('noise-stream');
    if (!stream) return;

    const pulseId = Date.now();
    const item = document.createElement('div');
    item.className = 'noise-pulse-item pulse-warning';
    item.innerHTML = `<span>⚠ TRANSIENT LEG MICROSWITCH SPIKE</span><button class="purge-pill" onclick="window.activeTouchdownGame.purgeSignal(${pulseId})">PURGE</button>`;
    item.dataset.id = pulseId;
    stream.appendChild(item);
    this.noiseEvents.push(pulseId);
    window.soundEngine.playGlitch();

    window.activeTouchdownGame = this;
  }

  handleFilterClick() {
    if (this.noiseEvents.length > 0) {
      const pid = this.noiseEvents.shift();
      this.removePulseElement(pid);
      this.filteredCount++;
      window.soundEngine.playTone(800, 0.08);
      this.updateProgress();
    }
  }

  purgeSignal(pulseId) {
    this.noiseEvents = this.noiseEvents.filter(id => id !== pulseId);
    this.removePulseElement(pulseId);
    this.filteredCount++;
    window.soundEngine.playTone(850, 0.08);
    this.updateProgress();
  }

  removePulseElement(pulseId) {
    const stream = document.getElementById('noise-stream');
    if (!stream) return;
    const el = stream.querySelector(`[data-id="${pulseId}"]`);
    if (el) el.remove();
  }

  updateProgress() {
    const p = document.getElementById('filter-progress');
    if (p) p.textContent = `${this.filteredCount}/${this.targetFilters}`;
    if (this.filteredCount >= this.targetFilters) {
      this.altitude = 0;
      this.isWon = true;
      clearInterval(this.timer);
      this.onWin();
    }
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    window.activeTouchdownGame = null;
  }
}

/**
 * MINI-GAME 4: Apollo 13 Lifeboat Power & Oxygen Rerouter
 */
class LifeboatPowerGame {
  constructor(container, onWin) {
    this.container = container;
    this.onWin = onWin;
    this.isWon = false;
    this.systems = [
      { name: 'CABIN HEATER', amps: 8, required: false, active: true },
      { name: 'ODYSSEY MAIN BUS', amps: 12, required: false, active: true },
      { name: 'LM AQUARIUS LIFE SUPPORT', amps: 6, required: true, active: true },
      { name: 'RADIO COMMUNICATIONS', amps: 3, required: true, active: true },
      { name: 'CO2 LIOH SCRUBBER ADAPTER', amps: 2, required: true, active: false }
    ];

    this.render();
  }

  calculateAmps() {
    return this.systems.filter(s => s.active).reduce((sum, s) => sum + s.amps, 0);
  }

  render() {
    const currentAmps = this.calculateAmps();
    const isSafe = currentAmps <= 15;
    const scrubberOn = this.systems.find(s => s.name.includes('SCRUBBER')).active;
    const commsOn = this.systems.find(s => s.name.includes('RADIO')).active;
    const canSurvive = isSafe && scrubberOn && commsOn;

    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> LIFE SUPPORT RESCUE DIRECTIVE</span>
          <h3 class="minigame-title">APOLLO 13: 15-AMP LIFEBOAT BUDGET</h3>
          <p class="minigame-sub">Total spacecraft amperage must not exceed 15.0 AMPS. Power down non-critical heaters and connect the improvised Lithium Hydroxide CO2 scrubber!</p>
        </div>

        <div class="power-meter-container">
          <div class="amp-gauge-display ${currentAmps > 15 ? 'amp-overload' : 'amp-nominal'}">
            <span class="amp-label">TOTAL CURRENT DRAW</span>
            <span class="amp-digit">${currentAmps.toFixed(1)} / 15.0 AMPS</span>
            <span class="amp-alert">${currentAmps > 15 ? '⚠ CRITICAL BATTERY DRAIN OVERLOAD' : '✓ BUS OPERATING WITHIN EMERGENCY ENVELOPE'}</span>
          </div>
        </div>

        <div class="subsystems-list">
          ${this.systems.map((sys, idx) => `
            <div class="subsystem-row ${sys.active ? 'sys-active' : 'sys-inactive'}">
              <div class="sys-info">
                <span class="sys-name">${sys.name}</span>
                <span class="sys-draw">${sys.amps} AMPS | ${sys.required ? 'CRITICAL PRIORITY' : 'NON-ESSENTIAL'}</span>
              </div>
              <button class="retro-btn sm-btn ${sys.active ? 'btn-red' : 'btn-green'}" onclick="window.activeLifeboatGame.toggleSys(${idx})">
                ${sys.active ? 'SHUT DOWN' : 'POWER ON'}
              </button>
            </div>
          `).join('')}
        </div>

        <div class="filter-action-bar">
          <button id="commit-power-btn" class="retro-btn ${canSurvive ? 'pulse-btn' : 'btn-disabled'}" onclick="window.activeLifeboatGame.commit()">
            ${canSurvive ? 'EXECUTE LIFEBOAT RECONFIGURATION ✓' : 'BALANCE SYSTEMS & ACTIVATE SCRUBBER'}
          </button>
        </div>
      </div>
    `;

    window.activeLifeboatGame = this;
  }

  toggleSys(index) {
    this.systems[index].active = !this.systems[index].active;
    window.soundEngine.playTone(this.systems[index].active ? 600 : 350, 0.05);
    this.render();
  }

  commit() {
    const currentAmps = this.calculateAmps();
    const scrubberOn = this.systems.find(s => s.name.includes('SCRUBBER')).active;
    const commsOn = this.systems.find(s => s.name.includes('RADIO')).active;

    if (currentAmps <= 15 && scrubberOn && commsOn) {
      this.isWon = true;
      window.soundEngine.playSuccess();
      this.onWin();
    } else {
      window.soundEngine.playError();
    }
  }

  destroy() {
    window.activeLifeboatGame = null;
  }
}

/**
 * MINI-GAME 5: LCROSS Plume Spectrometer Ice Hunter
 */
class SpectrometerGame {
  constructor(container, onWin) {
    this.container = container;
    this.onWin = onWin;
    this.wavelength = 1.0; // microns
    this.locked = false;
    this.isWon = false;

    this.render();
  }

  render() {
    const isTargetBand = Math.abs(this.wavelength - 1.45) < 0.08 || Math.abs(this.wavelength - 1.95) < 0.08;

    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> NEAR-INFRARED SPECTROMETER</span>
          <h3 class="minigame-title">CABEIUS PLUME VOLATILE DETECTOR</h3>
          <p class="minigame-sub">Tune the near-infrared detector across the illuminated ejecta plume. Locate the distinctive absorption signature of water ice (H2O at 1.45 µm or 1.95 µm)!</p>
        </div>

        <div class="spectrum-visualizer">
          <div class="spectrum-wave-box">
            <div class="spectrum-line" style="height: ${isTargetBand ? '85px' : '20px'}"></div>
            <div class="spectrum-absorb-dip ${isTargetBand ? 'dip-found' : ''}">
              ${isTargetBand ? 'H2O / OH MOLECULAR ABSORPTION TROUGH DETECTED!' : 'SEARCHING SPECTRUM...'}
            </div>
          </div>
          <div class="frequency-slider-wrap">
            <span class="band-label">WAVELENGTH: <strong id="wave-val">${this.wavelength.toFixed(2)} µm</strong></span>
            <input type="range" id="wave-slider" min="1.0" max="2.5" step="0.02" value="${this.wavelength}" class="retro-slider">
          </div>
        </div>

        <div class="filter-action-bar">
          <button id="lock-ice-btn" class="retro-btn ${isTargetBand ? 'pulse-btn' : 'btn-disabled'}" onclick="window.activeSpecGame.lockIce()">
            ${isTargetBand ? 'CONFIRM WATER ICE ABSORPTION BAND ✓' : 'SWEEP TO 1.45 µm OR 1.95 µm'}
          </button>
        </div>
      </div>
    `;

    window.activeSpecGame = this;

    const slider = document.getElementById('wave-slider');
    slider.oninput = (e) => {
      this.wavelength = parseFloat(e.target.value);
      window.soundEngine.playTone(300 + this.wavelength * 300, 0.03);
      this.render();
    };
  }

  lockIce() {
    const isTargetBand = Math.abs(this.wavelength - 1.45) < 0.08 || Math.abs(this.wavelength - 1.95) < 0.08;
    if (isTargetBand) {
      this.isWon = true;
      window.soundEngine.playSuccess();
      this.onWin();
    } else {
      window.soundEngine.playError();
    }
  }

  destroy() {
    window.activeSpecGame = null;
  }
}


/**
 * MINI-GAME 6: Lunar Module 2D Thruster Descent (Apollo 11, Surveyor 2, Surveyor 4)
 */
class LunarLanderArcadeGame {
  constructor(container, onWin, caseData) {
    this.container = container;
    this.onWin = onWin;
    this.caseData = caseData;
    this.ship = {
      x: 75,
      y: 45,
      vx: 1.1,
      vy: 0.2,
      angle: 0,
      fuel: 100
    };
    this.thrusting = false;
    this.rotatingLeft = false;
    this.rotatingRight = false;
    this.pad = { x: 380, y: 215, w: 90, h: 12 };
    this.particles = [];
    this.stars = [];
    this.isWon = false;
    this.isCrashed = false;
    this.animFrame = null;
    this.statusMsg = "DESCENDING TOWARD DESIGNATED TOUCHDOWN SITE";
    this.statusClass = "text-cyan";

    this.render();
    this.initControls();
    this.initCanvas();
    this.startLoop();
  }

  render() {
    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> 2D LUNAR DESCENT RADAR</span>
          <h3 class="minigame-title">LUNAR MODULE POWERED DESCENT SIMULATOR</h3>
          <p class="minigame-sub">Control descent velocity (< 2.0 m/s), horizontal drift (< 1.2 m/s), and attitude tilt. Touch down on the designated landing pad!</p>
        </div>

        <div class="canvas-wrap">
          <canvas id="lander-canvas" width="600" height="260"></canvas>
          <div class="scanline-overlay"></div>
        </div>

        <div class="mg-hud-row">
          <div class="mg-stat-box">
            <span class="mg-stat-label">DESCENT RATE (V-SPD)</span>
            <span id="lander-vspd" class="mg-stat-val text-green">0.2 m/s</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">DRIFT (H-SPD)</span>
            <span id="lander-hspd" class="mg-stat-val">1.1 m/s</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">RADAR ALTITUDE</span>
            <span id="lander-alt" class="mg-stat-val">170 m</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">FUEL TANK</span>
            <div class="mg-progress-bar"><div id="lander-fuel-fill" class="mg-fill power-fill" style="width: 100%"></div></div>
            <span id="lander-fuel-text" class="mg-stat-val">100%</span>
          </div>
        </div>

        <div class="lander-status-bar">
          <span id="lander-status-text" class="${this.statusClass}">${this.statusMsg}</span>
        </div>

        <div class="flight-controls-grid">
          <button id="btn-rot-left" class="arcade-btn">◀ RCS PORT<br><small>[A / ◄]</small></button>
          <button id="btn-thrust" class="arcade-btn arcade-thrust-btn">▲ MAIN THRUSTER (HOLD)<br><small>[W / ▲ / SPACE]</small></button>
          <button id="btn-rot-right" class="arcade-btn">RCS STBD ▶<br><small>[D / ►]</small></button>
        </div>
      </div>
    `;
  }

  initControls() {
    this.keyHandlerDown = (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        this.thrusting = true;
        e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.rotatingLeft = true;
        e.preventDefault();
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.rotatingRight = true;
        e.preventDefault();
      }
    };

    this.keyHandlerUp = (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        this.thrusting = false;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.rotatingLeft = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.rotatingRight = false;
      }
    };

    window.addEventListener('keydown', this.keyHandlerDown);
    window.addEventListener('keyup', this.keyHandlerUp);

    // On-screen touch/click buttons
    const thrustBtn = document.getElementById('btn-thrust');
    const leftBtn = document.getElementById('btn-rot-left');
    const rightBtn = document.getElementById('btn-rot-right');

    const bindHold = (btn, onStart, onEnd) => {
      if (!btn) return;
      btn.addEventListener('mousedown', (e) => { e.preventDefault(); onStart(); });
      btn.addEventListener('mouseup', onEnd);
      btn.addEventListener('mouseleave', onEnd);
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); onStart(); });
      btn.addEventListener('touchend', onEnd);
    };

    bindHold(thrustBtn, () => { this.thrusting = true; }, () => { this.thrusting = false; });
    bindHold(leftBtn, () => { this.rotatingLeft = true; }, () => { this.rotatingLeft = false; });
    bindHold(rightBtn, () => { this.rotatingRight = true; }, () => { this.rotatingRight = false; });
  }

  initCanvas() {
    this.canvas = document.getElementById('lander-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Create background stars
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.canvas.height - 60),
        size: Math.random() * 2 + 0.5,
        alpha: Math.random()
      });
    }
  }

  startLoop() {
    const loop = () => {
      this.updatePhysics();
      this.draw();
      if (!this.isWon) {
        this.animFrame = requestAnimationFrame(loop);
      }
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  updatePhysics() {
    if (this.isWon || this.isCrashed) return;

    const gravity = 0.032;

    if (this.thrusting && this.ship.fuel > 0) {
      this.ship.vx += Math.sin(this.ship.angle) * 0.075;
      this.ship.vy -= Math.cos(this.ship.angle) * 0.075;
      this.ship.fuel = Math.max(0, this.ship.fuel - 0.2);

      // Spawn thruster plume particles
      const tipX = this.ship.x - Math.sin(this.ship.angle) * 12;
      const tipY = this.ship.y + Math.cos(this.ship.angle) * 12;
      for (let p = 0; p < 2; p++) {
        this.particles.push({
          x: tipX + (Math.random() - 0.5) * 4,
          y: tipY + (Math.random() - 0.5) * 4,
          vx: -Math.sin(this.ship.angle) * (2 + Math.random() * 2) + (Math.random() - 0.5),
          vy: Math.cos(this.ship.angle) * (2 + Math.random() * 2) + (Math.random() - 0.5),
          life: 1.0,
          color: Math.random() > 0.4 ? '#fbbf24' : '#f97316'
        });
      }

      if (Math.random() < 0.25) {
        window.soundEngine.playTone(160 + Math.random() * 40, 0.03);
      }
    }

    if (this.rotatingLeft) {
      this.ship.angle = Math.max(-0.75, this.ship.angle - 0.035);
      if (Math.random() < 0.2) window.soundEngine.playTone(450, 0.02);
    }
    if (this.rotatingRight) {
      this.ship.angle = Math.min(0.75, this.ship.angle + 0.035);
      if (Math.random() < 0.2) window.soundEngine.playTone(450, 0.02);
    }

    this.ship.vy += gravity;
    this.ship.x += this.ship.vx;
    this.ship.y += this.ship.vy;

    // Bounds checking
    if (this.ship.x < 15) { this.ship.x = 15; this.ship.vx = Math.abs(this.ship.vx) * 0.5; }
    if (this.ship.x > this.canvas.width - 15) { this.ship.x = this.canvas.width - 15; this.ship.vx = -Math.abs(this.ship.vx) * 0.5; }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Touchdown detection
    const padContactY = this.pad.y - 12;
    if (this.ship.y >= padContactY) {
      const onPad = this.ship.x >= this.pad.x - 8 && this.ship.x <= this.pad.x + this.pad.w + 8;
      const safeV = Math.abs(this.ship.vy) <= 1.9;
      const safeH = Math.abs(this.ship.vx) <= 1.2;
      const safeAngle = Math.abs(this.ship.angle) <= 0.3;

      if (onPad && safeV && safeH && safeAngle) {
        // Safe landing!
        this.isWon = true;
        this.ship.y = padContactY;
        this.ship.vx = 0;
        this.ship.vy = 0;
        this.ship.angle = 0;
        this.statusMsg = "★ CONTACT LIGHT ON! TOUCHDOWN CONFIRMED! TRANQUILITY BASE NOMINAL!";
        this.statusClass = "text-green";
        this.updateHUD();
        window.soundEngine.playSuccess();
        setTimeout(() => this.onWin(), 1200);
      } else {
        // Crash
        let reason = "EXCESS DESCENT VELOCITY CRUSHED STRUTS!";
        let reasonKey = 'too_fast';
        if (!onPad) { reason = "MISSED PAD! ROLLED INTO BOULDER CRATER!"; reasonKey = 'missed_pad'; }
        else if (!safeAngle) { reason = "LANDER TILT EXCEEDED ROLL MARGIN!"; reasonKey = 'tilt'; }
        this.crash(reason, reasonKey);
      }
    }

    this.updateHUD();
  }

  crash(reason, reasonKey) {
    this.isCrashed = true;
    this.statusMsg = `⚠️ ${reason}`;
    this.statusClass = "text-magenta";
    window.soundEngine.playGlitch();

    // Spawn explosion debris
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.ship.x,
        y: this.ship.y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1.2,
        color: '#ef4444'
      });
    }

    // Let the explosion play, then show the "mission lost" pop-up (Try again relaunches).
    this.isLost = true;
    setTimeout(() => { if (this.onLose) this.onLose(reasonKey || 'too_fast'); }, 900);
  }

  updateHUD() {
    const vspdEl = document.getElementById('lander-vspd');
    const hspdEl = document.getElementById('lander-hspd');
    const altEl = document.getElementById('lander-alt');
    const fuelFill = document.getElementById('lander-fuel-fill');
    const fuelText = document.getElementById('lander-fuel-text');
    const statusText = document.getElementById('lander-status-text');

    if (vspdEl) {
      const v = this.ship.vy;
      vspdEl.textContent = `${v.toFixed(1)} m/s`;
      vspdEl.className = Math.abs(v) <= 1.9 ? 'mg-stat-val text-green' : 'mg-stat-val text-magenta';
    }
    if (hspdEl) {
      hspdEl.textContent = `${Math.abs(this.ship.vx).toFixed(1)} m/s`;
    }
    if (altEl) {
      const alt = Math.max(0, this.pad.y - this.ship.y - 12);
      altEl.textContent = `${alt.toFixed(0)} m`;
    }
    if (fuelFill && fuelText) {
      fuelFill.style.width = `${Math.max(0, this.ship.fuel)}%`;
      fuelText.textContent = `${Math.max(0, this.ship.fuel).toFixed(0)}%`;
    }
    if (statusText) {
      statusText.textContent = this.statusMsg;
      statusText.className = this.statusClass;
    }
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Pitch black space sky
    ctx.fillStyle = '#06020f';
    ctx.fillRect(0, 0, w, h);

    // Stars
    this.stars.forEach(s => {
      ctx.fillStyle = `rgba(216, 180, 254, ${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Lunar mountain terrain
    ctx.fillStyle = '#181226';
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.lineTo(80, 220);
    ctx.lineTo(160, 235);
    ctx.lineTo(240, 215);
    ctx.lineTo(320, 230);
    ctx.lineTo(this.pad.x, this.pad.y);
    ctx.lineTo(this.pad.x + this.pad.w, this.pad.y);
    ctx.lineTo(520, 238);
    ctx.lineTo(w, 225);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Lunar craters & craters contour
    ctx.strokeStyle = '#382b52';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Landing Pad (Glowing green & yellow)
    ctx.fillStyle = '#15803d';
    ctx.fillRect(this.pad.x, this.pad.y, this.pad.w, this.pad.h);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.pad.x, this.pad.y, this.pad.w, this.pad.h);

    // Landing Pad Beacon Lights (blinking)
    const blink = Math.sin(Date.now() * 0.008) > 0;
    ctx.fillStyle = blink ? '#facc15' : '#451a03';
    ctx.fillRect(this.pad.x - 4, this.pad.y - 6, 6, 6);
    ctx.fillRect(this.pad.x + this.pad.w - 2, this.pad.y - 6, 6, 6);

    // Landing pad text label
    ctx.fillStyle = '#4ade80';
    ctx.font = '7.5px "Press Start 2P", monospace';
    ctx.fillText('TOUCHDOWN PAD', this.pad.x + 8, this.pad.y + 9);

    // Draw Particles (exhaust & sparks)
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;

    // Draw Lunar Module Spacecraft
    if (!this.isCrashed) {
      ctx.save();
      ctx.translate(this.ship.x, this.ship.y);
      ctx.rotate(this.ship.angle);

      // Gold Foil Descent Stage (Octagon)
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(-10, -2, 20, 10);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.strokeRect(-10, -2, 20, 10);

      // Ascent Stage (Cabin)
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-8, -12, 16, 10);
      // Windows
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(-6, -10, 4, 3);
      ctx.fillRect(2, -10, 4, 3);

      // Antenna / Radar Dish
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(0, -16);
      ctx.moveTo(-4, -16);
      ctx.lineTo(4, -16);
      ctx.stroke();

      // Landing Gear Struts
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      // Left leg
      ctx.beginPath();
      ctx.moveTo(-8, 8);
      ctx.lineTo(-14, 15);
      ctx.moveTo(-16, 15);
      ctx.lineTo(-12, 15);
      // Right leg
      ctx.moveTo(8, 8);
      ctx.lineTo(14, 15);
      ctx.moveTo(12, 15);
      ctx.lineTo(16, 15);
      ctx.stroke();

      // Engine Nozzle
      ctx.fillStyle = '#475569';
      ctx.fillRect(-3, 8, 6, 4);

      // Thruster Flame
      if (this.thrusting && this.ship.fuel > 0) {
        const flameLen = 8 + Math.random() * 8;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-3, 12);
        ctx.lineTo(3, 12);
        ctx.lineTo(0, 12 + flameLen);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.moveTo(-1.5, 12);
        ctx.lineTo(1.5, 12);
        ctx.lineTo(0, 12 + flameLen * 0.6);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    window.removeEventListener('keydown', this.keyHandlerDown);
    window.removeEventListener('keyup', this.keyHandlerUp);
  }
}

/**
 * MINI-GAME 7: Asteroid & Micrometeorite Dodge (Mariner 4, Deep Space 2)
 */
class AsteroidDodgeGame {
  constructor(container, onWin, caseData) {
    this.container = container;
    this.onWin = onWin;
    this.caseData = caseData;
    this.probe = { x: 300, y: 200, speed: 6, vx: 0 };
    this.packetsCollected = 0;
    this.packetsTarget = 5;
    this.hull = 3;
    this.shieldCooldown = 0;
    this.asteroids = [];
    this.packets = [];
    this.particles = [];
    this.isWon = false;
    this.animFrame = null;
    this.movingLeft = false;
    this.movingRight = false;
    this.invulnerableTimer = 0;

    this.render();
    this.initControls();
    this.initCanvas();
    this.startLoop();
  }

  render() {
    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> DEEP SPACE TRAJECTORY</span>
          <h3 class="minigame-title">MICROMETEORITE STORM & TELEMETRY RETRIEVAL</h3>
          <p class="minigame-sub">Maneuver the deep space probe through the high-velocity debris stream. Evade tumbling meteoroids and collect 5 glowing scientific telemetry packets!</p>
        </div>

        <div class="canvas-wrap">
          <canvas id="dodge-canvas" width="600" height="260"></canvas>
          <div class="scanline-overlay"></div>
        </div>

        <div class="mg-hud-row">
          <div class="mg-stat-box">
            <span class="mg-stat-label">TELEMETRY PACKETS</span>
            <span id="dodge-packets" class="mg-stat-val text-cyan">0 / 5</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">HULL INTEGRITY</span>
            <span id="dodge-hull" class="mg-stat-val text-green">♥♥♥ [100%]</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">EM DEFLECTOR PULSE</span>
            <span id="dodge-shield" class="mg-stat-val">READY [SPACE]</span>
          </div>
        </div>

        <div class="flight-controls-grid">
          <button id="btn-dodge-left" class="arcade-btn">◀ STEER PORT<br><small>[A / ◄]</small></button>
          <button id="btn-dodge-pulse" class="arcade-btn arcade-thrust-btn">⚡ DEFLECTOR PULSE<br><small>[SPACE]</small></button>
          <button id="btn-dodge-right" class="arcade-btn">STEER STBD ▶<br><small>[D / ►]</small></button>
        </div>
      </div>
    `;
  }

  initControls() {
    this.keyHandlerDown = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.movingLeft = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.movingRight = true;
      if (e.code === 'Space') this.triggerShieldPulse();
    };
    this.keyHandlerUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.movingLeft = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.movingRight = false;
    };

    window.addEventListener('keydown', this.keyHandlerDown);
    window.addEventListener('keyup', this.keyHandlerUp);

    const leftBtn = document.getElementById('btn-dodge-left');
    const rightBtn = document.getElementById('btn-dodge-right');
    const pulseBtn = document.getElementById('btn-dodge-pulse');

    if (leftBtn) {
      leftBtn.onmousedown = () => { this.movingLeft = true; };
      leftBtn.onmouseup = () => { this.movingLeft = false; };
      leftBtn.ontouchstart = (e) => { e.preventDefault(); this.movingLeft = true; };
      leftBtn.ontouchend = () => { this.movingLeft = false; };
    }
    if (rightBtn) {
      rightBtn.onmousedown = () => { this.movingRight = true; };
      rightBtn.onmouseup = () => { this.movingRight = false; };
      rightBtn.ontouchstart = (e) => { e.preventDefault(); this.movingRight = true; };
      rightBtn.ontouchend = () => { this.movingRight = false; };
    }
    if (pulseBtn) {
      pulseBtn.onclick = () => this.triggerShieldPulse();
    }
  }

  initCanvas() {
    this.canvas = document.getElementById('dodge-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.bgStars = [];
    for (let i = 0; i < 50; i++) {
      this.bgStars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        speed: Math.random() * 2 + 1,
        size: Math.random() * 2 + 0.5
      });
    }
  }

  triggerShieldPulse() {
    if (this.shieldCooldown > 0) return;
    this.shieldCooldown = 180; // ~3 seconds
    window.soundEngine.playTone(850, 0.12);

    // Clear asteroids within 90px
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i];
      const dist = Math.hypot(a.x - this.probe.x, a.y - this.probe.y);
      if (dist < 100) {
        // Disintegrate
        for (let p = 0; p < 8; p++) {
          this.particles.push({
            x: a.x, y: a.y,
            vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
            life: 0.8, color: '#00f0ff'
          });
        }
        this.asteroids.splice(i, 1);
      }
    }

    // Shield wave particle ring
    for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
      this.particles.push({
        x: this.probe.x + Math.cos(angle) * 15,
        y: this.probe.y + Math.sin(angle) * 15,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
        life: 0.6,
        color: '#67e8f9'
      });
    }
  }

  startLoop() {
    let spawnTimer = 0;
    const loop = () => {
      spawnTimer++;
      // Spawn asteroid
      if (spawnTimer % 35 === 0) {
        this.asteroids.push({
          x: Math.random() * (this.canvas.width - 40) + 20,
          y: -20,
          vy: Math.random() * 2.5 + 2.0,
          vx: (Math.random() - 0.5) * 1.5,
          size: Math.random() * 10 + 10,
          angle: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.08
        });
      }

      // Spawn telemetry data packet
      if (spawnTimer % 95 === 0) {
        this.packets.push({
          x: Math.random() * (this.canvas.width - 60) + 30,
          y: -15,
          vy: 1.8,
          w: 16,
          h: 16
        });
      }

      this.update();
      this.draw();

      if (!this.isWon) {
        this.animFrame = requestAnimationFrame(loop);
      }
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  update() {
    if (this.isWon || this.isLost) return;

    if (this.shieldCooldown > 0) this.shieldCooldown--;
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;

    // Move probe
    if (this.movingLeft) this.probe.vx = -this.probe.speed;
    else if (this.movingRight) this.probe.vx = this.probe.speed;
    else this.probe.vx *= 0.6;

    this.probe.x += this.probe.vx;
    if (this.probe.x < 25) this.probe.x = 25;
    if (this.probe.x > this.canvas.width - 25) this.probe.x = this.canvas.width - 25;

    // Background stars
    this.bgStars.forEach(s => {
      s.y += s.speed;
      if (s.y > this.canvas.height) { s.y = 0; s.x = Math.random() * this.canvas.width; }
    });

    // Move & collide asteroids
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const a = this.asteroids[i];
      a.y += a.vy;
      a.x += a.vx;
      a.angle += a.rotSpeed;

      // Check collision with probe
      const dist = Math.hypot(a.x - this.probe.x, a.y - this.probe.y);
      if (dist < a.size + 14 && this.invulnerableTimer <= 0) {
        this.hull--;
        this.invulnerableTimer = 60; // 1s invulnerability
        window.soundEngine.playGlitch();

        for (let p = 0; p < 12; p++) {
          this.particles.push({
            x: a.x, y: a.y,
            vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
            life: 0.8, color: '#f87171'
          });
        }
        this.asteroids.splice(i, 1);

        if (this.hull <= 0) {
          // Hull destroyed → "mission lost" pop-up (Try again relaunches).
          this.hull = 0;
          this.isLost = true;
          this.updateHUD && this.updateHUD();
          if (this.onLose) this.onLose('hull');
          return;
        }
        continue;
      }

      if (a.y > this.canvas.height + 30) {
        this.asteroids.splice(i, 1);
      }
    }

    // Move & collect data packets
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const pkt = this.packets[i];
      pkt.y += pkt.vy;

      // Check pickup
      const dist = Math.hypot(pkt.x - this.probe.x, pkt.y - this.probe.y);
      if (dist < 24) {
        this.packetsCollected++;
        window.soundEngine.playTone(700 + this.packetsCollected * 100, 0.08);

        for (let p = 0; p < 10; p++) {
          this.particles.push({
            x: pkt.x, y: pkt.y,
            vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
            life: 0.7, color: '#38bdf8'
          });
        }
        this.packets.splice(i, 1);

        if (this.packetsCollected >= this.packetsTarget) {
          this.isWon = true;
          window.soundEngine.playSuccess();
          setTimeout(() => this.onWin(), 1200);
        }
        continue;
      }

      if (pkt.y > this.canvas.height + 20) {
        this.packets.splice(i, 1);
      }
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    this.updateHUD();
  }

  updateHUD() {
    const pktEl = document.getElementById('dodge-packets');
    const hullEl = document.getElementById('dodge-hull');
    const shieldEl = document.getElementById('dodge-shield');

    if (pktEl) pktEl.textContent = `${this.packetsCollected} / ${this.packetsTarget}`;
    if (hullEl) {
      const hearts = '♥'.repeat(Math.max(0, this.hull)) + '♡'.repeat(Math.max(0, 3 - this.hull));
      hullEl.textContent = `${hearts} [${this.hull * 33}%]`;
      hullEl.className = this.hull > 1 ? 'mg-stat-val text-green' : 'mg-stat-val text-magenta';
    }
    if (shieldEl) {
      shieldEl.textContent = this.shieldCooldown <= 0 ? 'READY [SPACE]' : `RECHARGING (${Math.ceil(this.shieldCooldown / 60)}s)`;
    }
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Space backdrop
    ctx.fillStyle = '#060212';
    ctx.fillRect(0, 0, w, h);

    // Fast moving stars
    ctx.fillStyle = '#c4b5fd';
    this.bgStars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size * 2.5);
    });

    // Asteroids
    this.asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Octagonal rock
      for (let pt = 0; pt < 7; pt++) {
        const rad = pt * (Math.PI * 2 / 7);
        const r = a.size * (0.8 + ((pt % 2) * 0.35));
        const px = Math.cos(rad) * r;
        const py = Math.sin(rad) * r;
        if (pt === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Data Packets (Glowing blue/cyan canisters)
    this.packets.forEach(pkt => {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(pkt.x - 7, pkt.y - 7, 14, 14);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pkt.x - 7, pkt.y - 7, 14, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText('DATA', pkt.x - 10, pkt.y + 3);
    });

    // Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;

    // Draw Space Probe (Mariner / DS2 style)
    if (this.invulnerableTimer % 6 < 3) {
      ctx.save();
      ctx.translate(this.probe.x, this.probe.y);

      // Solar Panels Left and Right
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#60a5fa';
      ctx.fillRect(-26, -5, 14, 10);
      ctx.strokeRect(-26, -5, 14, 10);
      ctx.fillRect(12, -5, 14, 10);
      ctx.strokeRect(12, -5, 14, 10);

      // Probe Body (Octagon box)
      ctx.fillStyle = '#d8b4fe';
      ctx.fillRect(-8, -10, 16, 20);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-8, -10, 16, 20);

      // High Gain Antenna Dish
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -14, 7, Math.PI, 0, false);
      ctx.stroke();

      // Ion Thruster Plume
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-3, 10, 6, 8 + Math.random() * 4);

      ctx.restore();
    }
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    window.removeEventListener('keydown', this.keyHandlerDown);
    window.removeEventListener('keyup', this.keyHandlerUp);
  }
}

/**
 * MINI-GAME 8: Orbital Slingshot & Capture (Mariner 9, Lunar Orbiter 1)
 */
class OrbitalSlingshotGame {
  constructor(container, onWin, caseData) {
    this.container = container;
    this.onWin = onWin;
    this.caseData = caseData;
    // Start off-target every time so the player has to tune both sliders
    // (winning window: angle 0–12°, Δv 1530–1770 m/s).
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    this.angle = pick([-22, -18, -14, 20, 24]); // degrees (-25 to 25)
    this.deltaV = pick([1150, 1225, 1300, 1975, 2050, 2125]); // m/s (1000 to 2300)
    this.targetDeltaV = 1650;
    this.isWon = false;
    this.isSimulating = false;
    this.shipPos = { x: 40, y: 60 };
    this.inOrbit = false;
    this.animFrame = null;

    this.render();
    this.initCanvas();
    this.draw();
    this.checkPrediction(); // show the real predicted orbit for the starting values
  }

  render() {
    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> ASTRODYNAMICS ORBITAL MECHANICS</span>
          <h3 class="minigame-title">PLANETARY GRAVITY CAPTURE & RETRO-BURN</h3>
          <p class="minigame-sub">Adjust insertion trajectory approach angle and calibrate the liquid retro-engine Delta-V to capture the spacecraft into the target science orbit corridor!</p>
        </div>

        <div class="canvas-wrap">
          <canvas id="slingshot-canvas" width="600" height="260"></canvas>
          <div class="scanline-overlay"></div>
        </div>

        <div class="mg-hud-row">
          <div class="mg-stat-box">
            <span class="mg-stat-label">APPROACH ANGLE</span>
            <span id="slingshot-angle-val" class="mg-stat-val">${this.angle > 0 ? '+' : ''}${this.angle}°</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">RETRO-BURN DELTA-V</span>
            <span id="slingshot-dv-val" class="mg-stat-val text-cyan">${this.deltaV} m/s</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">PREDICTED ORBIT</span>
            <span id="slingshot-orbit-status" class="mg-stat-val">—</span>
          </div>
        </div>

        <div class="tuner-slider-wrap">
          <div class="slider-row">
            <label class="slider-label">APPROACH ANGLE: <strong id="angle-disp">${this.angle}°</strong></label>
            <input type="range" id="slider-angle" min="-25" max="25" step="1" value="${this.angle}" class="retro-range">
          </div>
          <div class="slider-row">
            <label class="slider-label">RETRO-ROCKET DELTA-V: <strong id="dv-disp">${this.deltaV} m/s</strong> (Target: ~1650 m/s)</label>
            <input type="range" id="slider-dv" min="1000" max="2300" step="25" value="${this.deltaV}" class="retro-range">
          </div>
        </div>

        <div class="filter-action-bar">
          <button id="btn-fire-slingshot" class="retro-btn pulse-btn" onclick="window.activeSlingshotGame.executeBurn()">
            🔥 IGNITE RETRO-BURN & ATTEMPT ORBITAL INSERTION
          </button>
        </div>
      </div>
    `;

    window.activeSlingshotGame = this;

    const angleSlider = document.getElementById('slider-angle');
    const dvSlider = document.getElementById('slider-dv');

    if (angleSlider) {
      angleSlider.oninput = (e) => {
        this.angle = parseInt(e.target.value);
        document.getElementById('angle-disp').textContent = `${this.angle}°`;
        document.getElementById('slingshot-angle-val').textContent = `${this.angle > 0 ? '+' : ''}${this.angle}°`;
        window.soundEngine.playTone(320 + this.angle * 6, 0.02);
        this.checkPrediction();
        this.draw();
      };
    }

    if (dvSlider) {
      dvSlider.oninput = (e) => {
        this.deltaV = parseInt(e.target.value);
        document.getElementById('dv-disp').textContent = `${this.deltaV} m/s`;
        document.getElementById('slingshot-dv-val').textContent = `${this.deltaV} m/s`;
        window.soundEngine.playTone(400 + (this.deltaV - 1000) * 0.2, 0.02);
        this.checkPrediction();
        this.draw();
      };
    }
  }

  checkPrediction() {
    const isAngleGood = Math.abs(this.angle - 6) <= 6;
    const isDvGood = Math.abs(this.deltaV - 1650) <= 120;
    const statusEl = document.getElementById('slingshot-orbit-status');
    if (!statusEl) return;

    if (isAngleGood && isDvGood) {
      statusEl.textContent = 'STABLE SCIENCE CAPTURE';
      statusEl.className = 'mg-stat-val text-green';
    } else if (this.deltaV < 1400) {
      statusEl.textContent = 'HYPERBOLIC ESCAPE (TOO FAST)';
      statusEl.className = 'mg-stat-val text-magenta';
    } else if (this.deltaV > 1900) {
      statusEl.textContent = 'ATMOSPHERIC IMPACT (TOO SLOW)';
      statusEl.className = 'mg-stat-val text-magenta';
    } else {
      statusEl.textContent = 'SUB-OPTIMAL ORBIT (ECCENTRIC)';
      statusEl.className = 'mg-stat-val text-amber';
    }
  }

  initCanvas() {
    this.canvas = document.getElementById('slingshot-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
  }

  executeBurn() {
    const isAngleGood = Math.abs(this.angle - 6) <= 6;
    const isDvGood = Math.abs(this.deltaV - 1650) <= 120;
    const btn = document.getElementById('btn-fire-slingshot');
    if (btn) btn.disabled = true;

    window.soundEngine.playTone(180, 0.5);

    // Animate insertion
    let t = 0;
    const planetX = 380;
    const planetY = 130;

    const anim = () => {
      t += 0.025;
      if (t < 1.0) {
        // Approaching
        this.shipPos.x = 40 + (planetX - 70 - 40) * t;
        this.shipPos.y = 60 + (planetY - 20 - 60) * t;
      } else if (t < 2.5) {
        // Orbiting
        const orbitT = (t - 1.0) * 2.5;
        const rX = 75;
        const rY = 55;
        this.shipPos.x = planetX + Math.cos(orbitT + Math.PI) * rX;
        this.shipPos.y = planetY + Math.sin(orbitT + Math.PI) * rY;
      } else {
        if (isAngleGood && isDvGood) {
          this.isWon = true;
          window.soundEngine.playSuccess();
          setTimeout(() => this.onWin(), 1200);
          return;
        } else {
          // Wrong burn → "mission lost" pop-up explaining which way it went wrong.
          const key = this.deltaV < 1400 ? 'escape' : (this.deltaV > 1900 ? 'impact' : 'eccentric');
          this.isLost = true;
          if (this.onLose) this.onLose(key);
          return;
        }
      }

      this.draw();
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const planetX = 380;
    const planetY = 130;

    ctx.fillStyle = '#060212';
    ctx.fillRect(0, 0, w, h);

    // Draw Target Orbital Corridor (Glowing green ellipse)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(planetX, planetY, 75, 55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Central Planet (Mars / Moon)
    const isMars = !this.caseData || this.caseData.destination === 'mars';
    const grad = ctx.createRadialGradient(planetX - 10, planetY - 10, 5, planetX, planetY, 38);
    if (isMars) {
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(0.7, '#c2410c');
      grad.addColorStop(1, '#431407');
    } else {
      grad.addColorStop(0, '#e2e8f0');
      grad.addColorStop(0.7, '#94a3b8');
      grad.addColorStop(1, '#334155');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 36, 0, Math.PI * 2);
    ctx.fill();

    // Planet atmosphere glow
    ctx.strokeStyle = isMars ? 'rgba(249, 115, 22, 0.4)' : 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Planet label
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText(isMars ? 'MARS' : 'MOON', planetX - 16, planetY + 3);

    // Draw projected trajectory line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, 60);
    const ctrlX = 180 + this.angle * 4;
    const ctrlY = 80 + this.angle * 2;
    ctx.quadraticCurveTo(ctrlX, ctrlY, planetX - 75, planetY);
    ctx.stroke();

    // Draw Spacecraft at shipPos
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(this.shipPos.x - 5, this.shipPos.y - 5, 10, 10);
    ctx.strokeStyle = '#a855f7';
    ctx.strokeRect(this.shipPos.x - 5, this.shipPos.y - 5, 10, 10);
    // Solar wings
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(this.shipPos.x - 12, this.shipPos.y - 2, 7, 4);
    ctx.fillRect(this.shipPos.x + 5, this.shipPos.y - 2, 7, 4);
  }

  destroy() {
    window.activeSlingshotGame = null;
  }
}

/**
 * MINI-GAME 9: Martian Rover Hazard Drive (Spirit & Curiosity)
 */
class RoverDriveGame {
  constructor(container, onWin, caseData) {
    this.container = container;
    this.onWin = onWin;
    this.caseData = caseData;
    this.rover = { x: 55, y: 130, angle: 0, speed: 0, maxSpeed: 2.2 };
    this.hazards = [
      { x: 190, y: 90, r: 35, type: 'sand', name: 'TROY SULFATE SOIL' },
      { x: 260, y: 180, r: 32, type: 'sand', name: 'SOFT DUNE' },
      { x: 380, y: 100, r: 30, type: 'rock', name: 'BASALT VENTIFACTS' },
      { x: 360, y: 200, r: 28, type: 'rock', name: 'SHARP ROCKS' }
    ];
    this.destination = { x: 535, y: 130, r: 36, name: 'HOME PLATE SOLAR RIDGE' };
    this.tracks = [];
    this.isWon = false;
    this.isLost = false;
    this.sandFrames = 0;      // consecutive frames bogged down in sand (~60 per second)
    this.rockHits = 0;        // separate rock strikes
    this.wasOnRock = false;
    this.animFrame = null;
    this.statusText = "NAVIGATE ROVER TO SOLAR RECHARGE RIDGE";
    this.statusClass = "text-cyan";

    this.render();
    this.initControls();
    this.initCanvas();
    this.startLoop();
  }

  render() {
    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> SURFACE HAZARD NAVIGATION</span>
          <h3 class="minigame-title">MARTIAN SURFACE MOBILITY & RECHARGE RIDGE</h3>
          <p class="minigame-sub">Drive the rover across the rocky terrain. Avoid high-slip sulfate sand traps and sharp ventifact basalt boulders to reach the solar ridge waypoint!</p>
        </div>

        <div class="canvas-wrap">
          <canvas id="rover-canvas" width="600" height="260"></canvas>
          <div class="scanline-overlay"></div>
        </div>

        <div class="mg-hud-row">
          <div class="mg-stat-box">
            <span class="mg-stat-label">WHEEL SLIP RATIO</span>
            <span id="rover-slip" class="mg-stat-val text-green">4% [NORMAL]</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">DISTANCE TO WAYPOINT</span>
            <span id="rover-dist" class="mg-stat-val text-cyan">480 m</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">TERRAIN STATUS</span>
            <span id="rover-terrain" class="mg-stat-val">FIRM BEDROCK</span>
          </div>
        </div>

        <div class="flight-controls-grid">
          <button id="btn-rover-left" class="arcade-btn">◀ STEER LEFT<br><small>[A / ◄]</small></button>
          <button id="btn-rover-fwd" class="arcade-btn arcade-thrust-btn">▲ DRIVE FORWARD<br><small>[W / ▲]</small></button>
          <button id="btn-rover-right" class="arcade-btn">STEER RIGHT ▶<br><small>[D / ►]</small></button>
          <button id="btn-rover-rev" class="arcade-btn">▼ REVERSE<br><small>[S / ▼]</small></button>
        </div>
      </div>
    `;
  }

  initControls() {
    this.keys = { up: false, down: false, left: false, right: false };
    this.keyHandlerDown = (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = true;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = true;
    };
    this.keyHandlerUp = (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    };

    window.addEventListener('keydown', this.keyHandlerDown);
    window.addEventListener('keyup', this.keyHandlerUp);

    const fwdBtn = document.getElementById('btn-rover-fwd');
    const revBtn = document.getElementById('btn-rover-rev');
    const leftBtn = document.getElementById('btn-rover-left');
    const rightBtn = document.getElementById('btn-rover-right');

    const bind = (btn, key) => {
      if (!btn) return;
      btn.onmousedown = () => { this.keys[key] = true; };
      btn.onmouseup = () => { this.keys[key] = false; };
      btn.ontouchstart = (e) => { e.preventDefault(); this.keys[key] = true; };
      btn.ontouchend = () => { this.keys[key] = false; };
    };

    bind(fwdBtn, 'up');
    bind(revBtn, 'down');
    bind(leftBtn, 'left');
    bind(rightBtn, 'right');
  }

  initCanvas() {
    this.canvas = document.getElementById('rover-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
  }

  startLoop() {
    const loop = () => {
      this.update();
      this.draw();
      if (!this.isWon) {
        this.animFrame = requestAnimationFrame(loop);
      }
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  update() {
    if (this.isWon || this.isLost) return;

    if (this.keys.left) this.rover.angle -= 0.045;
    if (this.keys.right) this.rover.angle += 0.045;

    let targetSpeed = 0;
    if (this.keys.up) targetSpeed = this.rover.maxSpeed;
    if (this.keys.down) targetSpeed = -this.rover.maxSpeed * 0.6;

    // Check hazards
    let inSand = false;
    let hitRock = false;

    this.hazards.forEach(h => {
      const d = Math.hypot(h.x - this.rover.x, h.y - this.rover.y);
      if (d < h.r) {
        if (h.type === 'sand') inSand = true;
        if (h.type === 'rock') hitRock = true;
      }
    });

    if (inSand) {
      targetSpeed *= 0.25;
      if (Math.random() < 0.15) window.soundEngine.playTone(200, 0.03);
    }
    if (hitRock) {
      targetSpeed = -0.5;
      window.soundEngine.playGlitch();
    }

    // Losing: bogged down in sand for ~4 s, or 3 separate rock strikes.
    this.sandFrames = inSand ? this.sandFrames + 1 : 0;
    if (hitRock && !this.wasOnRock) this.rockHits++;
    this.wasOnRock = hitRock;
    if (this.sandFrames > 240 || this.rockHits >= 3) {
      this.isLost = true;
      this.statusText = this.rockHits >= 3 ? 'WHEELS DAMAGED — DRIVE HALTED' : 'EMBEDDED IN SOFT SOIL';
      this.statusClass = 'text-magenta';
      if (this.onLose) this.onLose(this.rockHits >= 3 ? 'rocks' : 'sand');
      return;
    }

    this.rover.speed += (targetSpeed - this.rover.speed) * 0.1;
    this.rover.x += Math.cos(this.rover.angle) * this.rover.speed;
    this.rover.y += Math.sin(this.rover.angle) * this.rover.speed;

    // Bounds
    if (this.rover.x < 20) this.rover.x = 20;
    if (this.rover.x > this.canvas.width - 20) this.rover.x = this.canvas.width - 20;
    if (this.rover.y < 20) this.rover.y = 20;
    if (this.rover.y > this.canvas.height - 20) this.rover.y = this.canvas.height - 20;

    // Record tracks
    if (Math.abs(this.rover.speed) > 0.3) {
      this.tracks.push({ x: this.rover.x, y: this.rover.y, alpha: 1.0 });
      if (this.tracks.length > 120) this.tracks.shift();
    }

    // Check destination
    const destDist = Math.hypot(this.destination.x - this.rover.x, this.destination.y - this.rover.y);
    if (destDist < this.destination.r) {
      this.isWon = true;
      window.soundEngine.playSuccess();
      setTimeout(() => this.onWin(), 1200);
    }

    // Update HUD
    const slipEl = document.getElementById('rover-slip');
    const distEl = document.getElementById('rover-dist');
    const terrainEl = document.getElementById('rover-terrain');

    if (slipEl) {
      slipEl.textContent = inSand ? '86% [CRITICAL SINKING]' : '4% [NORMAL]';
      slipEl.className = inSand ? 'mg-stat-val text-magenta' : 'mg-stat-val text-green';
    }
    if (distEl) distEl.textContent = `${Math.round(destDist)} m`;
    if (terrainEl) {
      terrainEl.textContent = inSand ? 'SULFATE SAND TRAP' : hitRock ? 'VENTIFACT ROCK' : 'SOLID BEDROCK';
    }
  }

  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Martian terrain background
    ctx.fillStyle = '#2d1109';
    ctx.fillRect(0, 0, w, h);

    // Hazard Zones
    this.hazards.forEach(hz => {
      ctx.beginPath();
      ctx.arc(hz.x, hz.y, hz.r, 0, Math.PI * 2);
      if (hz.type === 'sand') {
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#f59e0b';
      } else {
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
      }
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '6.5px "Press Start 2P", monospace';
      ctx.fillText(hz.type === 'sand' ? 'SULFATE' : 'ROCKS', hz.x - 18, hz.y + 2);
    });

    // Destination Ridge Waypoint
    ctx.beginPath();
    ctx.arc(this.destination.x, this.destination.y, this.destination.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#4ade80';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText('SOLAR RIDGE', this.destination.x - 26, this.destination.y - 4);
    ctx.fillText('RECHARGE ⚡', this.destination.x - 24, this.destination.y + 8);

    // Wheel tracks
    ctx.fillStyle = '#1c0a05';
    this.tracks.forEach(tr => {
      ctx.fillRect(tr.x - 2, tr.y - 2, 4, 4);
    });

    // Draw Rover Sprite
    ctx.save();
    ctx.translate(this.rover.x, this.rover.y);
    ctx.rotate(this.rover.angle);

    // Chassis body
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-12, -8, 24, 16);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-12, -8, 24, 16);

    // Solar panel deck
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-10, -6, 20, 12);

    // Mastcam camera head
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(4, -3, 6, 6);

    // 6 Wheels
    ctx.fillStyle = '#0f172a';
    [-10, 0, 10].forEach(wx => {
      ctx.fillRect(wx - 3, -11, 6, 3);
      ctx.fillRect(wx - 3, 8, 6, 3);
    });

    ctx.restore();
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    window.removeEventListener('keydown', this.keyHandlerDown);
    window.removeEventListener('keyup', this.keyHandlerUp);
  }
}

/**
 * MINI-GAME 10: Avionics Breadboard Wire Patch (Pathfinder, InSight, Apollo 12)
 */
class CircuitWirePatchGame {
  constructor(container, onWin, caseData) {
    this.container = container;
    this.onWin = onWin;
    this.caseData = caseData;
    this.terminals = [
      { id: 'T1', name: '28V ESSENTIAL POWER', color: 'wire-blue', target: 'S2' },
      { id: 'T2', name: 'WATCHDOG OSCILLATOR', color: 'wire-green', target: 'S4' },
      { id: 'T3', name: 'PRIORITY INVERSION MUTEX', color: 'wire-yellow', target: 'S1' },
      { id: 'T4', name: 'S-BAND RF AMPLIFIER', color: 'wire-purple', target: 'S3' }
    ];
    this.sockets = [
      { id: 'S1', name: 'RAD-HARD CPU RELAY', matchedBy: 'T3' },
      { id: 'S2', name: 'CRITICAL HEATER LOOP', matchedBy: 'T1' },
      { id: 'S3', name: 'COMMUNICATION TRANSCEIVER', matchedBy: 'T4' },
      { id: 'S4', name: 'TIME-SLICE CONTROLLER', matchedBy: 'T2' }
    ];
    this.selectedSource = null;
    this.connected = {};
    this.isWon = false;

    this.render();
  }

  render() {
    const isReady = Object.keys(this.connected).length === 4;

    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> AVIONICS JUMPER BREADBOARD</span>
          <h3 class="minigame-title">RELAY BREAKER & HARDWARE BYPASS JUMPERS</h3>
          <p class="minigame-sub">Connect color-coded patch jumper cables between power/clock terminals and destination avionics relays to bypass the blown fuses!</p>
        </div>

        <div class="circuit-board-container">
          <div class="circuit-columns" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <!-- Source Terminals -->
            <div class="terminals-col">
              <span class="debrief-label">POWER & LOGIC BUS TERMINALS:</span>
              ${this.terminals.map(t => {
                const isSelected = this.selectedSource === t.id;
                const isLinked = !!this.connected[t.id];
                return `
                  <div class="wire-jumper-row ${isSelected ? 'pulse-btn' : ''}" style="margin: 8px 0; cursor: pointer;" onclick="window.activeCircuitGame.selectSource('${t.id}')">
                    <span class="wire-node-badge ${t.color}">[${t.id}] ${t.name}</span>
                    <span class="retro-badge sm-badge">${isLinked ? '✓ PATCHED' : 'UNPLUGGED'}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Target Sockets -->
            <div class="sockets-col">
              <span class="debrief-label">SUBSYSTEM LOAD SOCKETS:</span>
              ${this.sockets.map(s => {
                const connectedTermId = Object.keys(this.connected).find(k => this.connected[k] === s.id);
                return `
                  <div class="wire-jumper-row" style="margin: 8px 0; cursor: pointer;" onclick="window.activeCircuitGame.connectToSocket('${s.id}')">
                    <span class="wire-node-badge ${connectedTermId ? 'wire-green' : 'wire-yellow'}">[${s.id}] ${s.name}</span>
                    <span class="retro-badge sm-badge">${connectedTermId ? 'LINKED: ' + connectedTermId : 'OPEN'}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="filter-action-bar" style="display: flex; gap: 10px; justify-content: center;">
          <button class="retro-btn sm-btn" onclick="window.activeCircuitGame.resetWires()">RESET ALL JUMPERS</button>
          <button id="commit-wires-btn" class="retro-btn ${isReady ? 'pulse-btn' : 'btn-disabled'}" onclick="window.activeCircuitGame.verify()">
            ${isReady ? 'ENGAGE HARDWARE RELAYS ✓' : 'PATCH ALL 4 CIRCUITS'}
          </button>
        </div>
      </div>
    `;

    window.activeCircuitGame = this;
  }

  selectSource(termId) {
    this.selectedSource = termId;
    window.soundEngine.playTone(500, 0.05);
    this.render();
  }

  connectToSocket(socketId) {
    if (!this.selectedSource) {
      window.soundEngine.playTone(300, 0.05);
      return;
    }

    this.connected[this.selectedSource] = socketId;
    this.selectedSource = null;
    window.soundEngine.playTone(650, 0.06);
    this.render();
  }

  resetWires() {
    this.connected = {};
    this.selectedSource = null;
    window.soundEngine.playGlitch();
    this.render();
  }

  verify() {
    let allCorrect = true;
    this.terminals.forEach(t => {
      if (this.connected[t.id] !== t.target) allCorrect = false;
    });

    if (allCorrect) {
      this.isWon = true;
      window.soundEngine.playSuccess();
      this.onWin();
    } else {
      // Miswired → "mission lost" pop-up instead of a browser alert.
      this.isLost = true;
      if (this.onLose) this.onLose('miswired');
    }
  }

  destroy() {
    window.activeCircuitGame = null;
  }
}

/**
 * MINI-GAME 11: Hex Memory Parity Unscrambler (MGS, Apollo 14, Clementine)
 */
class MemoryDecryptGame {
  constructor(container, onWin, caseData) {
    this.container = container;
    this.onWin = onWin;
    this.caseData = caseData;
    this.cells = [
      { addr: '0x03E0', val: '0x4F', correct: '0x4F', status: 'OK' },
      { addr: '0x03E2', val: '0x00', correct: '0x00', status: 'OK' },
      { addr: '0x03E4', val: '0xAA', correct: '0x55', status: 'BIT-FLIP FAULT' },
      { addr: '0x03E6', val: '0x18', correct: '0x18', status: 'OK' },
      { addr: '0x03E8', val: '0x88', correct: '0x08', status: 'CHECKSUM MISMATCH' },
      { addr: '0x03EA', val: '0x6C', correct: '0x6C', status: 'OK' },
      { addr: '0x03EC', val: '0xFF', correct: '0x7F', status: 'STUCK-AT-1 BUS' },
      { addr: '0x03EE', val: '0x31', correct: '0x31', status: 'OK' }
    ];
    this.options = {
      '0x03E4': ['0xAA', '0x55', '0x11'],
      '0x03E8': ['0x88', '0x08', '0x44'],
      '0x03EC': ['0xFF', '0x7F', '0x0F']
    };
    this.isWon = false;

    this.render();
  }

  render() {
    let correctCount = 0;
    this.cells.forEach(c => { if (c.val === c.correct) correctCount++; });
    const is100 = correctCount === this.cells.length;

    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> FLIGHT COMPUTER EEPROM FORENSICS</span>
          <h3 class="minigame-title">HEXADECIMAL MEMORY PARITY REPAIR</h3>
          <p class="minigame-sub">Radiation bit-flips and bus noise have corrupted critical flight opcodes. Cycle and align memory registers until the 16-bit CRC checksum clears!</p>
        </div>

        <div class="mg-hud-row">
          <div class="mg-stat-box">
            <span class="mg-stat-label">EEPROM CRC INTEGRITY</span>
            <div class="mg-progress-bar"><div class="mg-fill power-fill" style="width: ${(correctCount / 8) * 100}%"></div></div>
            <span class="mg-stat-val text-cyan">${Math.round((correctCount / 8) * 100)}% [${correctCount}/8 VALID]</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">WATCHDOG TIMER</span>
            <span class="mg-stat-val text-green">ARMED [RESET PENDING]</span>
          </div>
        </div>

        <div class="hex-memory-grid">
          ${this.cells.map((c, idx) => {
            const isCorrupt = c.val !== c.correct;
            return `
              <button class="hex-cell-btn ${!isCorrupt ? 'hex-fixed' : ''}" onclick="window.activeMemoryGame.cycleByte(${idx})">
                <span style="font-size: 7.5px; opacity: 0.8; display: block;">${c.addr}</span>
                <strong style="font-size: 13px; display: block; margin: 4px 0;">${c.val}</strong>
                <small style="font-size: 6.5px; color: ${isCorrupt ? '#f87171' : '#4ade80'}">${isCorrupt ? 'FAULT' : 'VERIFIED'}</small>
              </button>
            `;
          }).join('')}
        </div>

        <div class="filter-action-bar">
          <button id="commit-hex-btn" class="retro-btn ${is100 ? 'pulse-btn' : 'btn-disabled'}" onclick="window.activeMemoryGame.commit()">
            ${is100 ? 'COMMIT ROM OVERWRITE TO EEPROM ✓' : 'CYCLE FAULTY REGISTERS TO 100%'}
          </button>
        </div>
      </div>
    `;

    window.activeMemoryGame = this;
  }

  cycleByte(idx) {
    const c = this.cells[idx];
    if (!this.options[c.addr]) return; // non-corrupted cell

    const opts = this.options[c.addr];
    const currIndex = opts.indexOf(c.val);
    c.val = opts[(currIndex + 1) % opts.length];

    window.soundEngine.playTone(450 + idx * 50, 0.04);
    this.render();
  }

  commit() {
    let allValid = true;
    this.cells.forEach(c => { if (c.val !== c.correct) allValid = false; });

    if (allValid) {
      this.isWon = true;
      window.soundEngine.playSuccess();
      this.onWin();
    } else {
      window.soundEngine.playError();
    }
  }

  destroy() {
    window.activeMemoryGame = null;
  }
}

/**
 * MINI-GAME 12: CRT Oscilloscope Radio Carrier Tuner (LADEE, Clementine, Ranger 7)
 */
class RadioTunerGame {
  constructor(container, onWin, caseData) {
    this.container = container;
    this.onWin = onWin;
    this.caseData = caseData;
    this.freq = 2240; // MHz (2200 to 2300, target 2287.5)
    this.phase = 45; // deg (0 to 360, target 180)
    this.targetFreq = 2287;
    this.targetPhase = 180;
    this.isWon = false;
    this.animFrame = null;

    this.render();
    this.initCanvas();
    this.startLoop();
  }

  render() {
    this.container.innerHTML = `
      <div class="minigame-card">
        <div class="minigame-header">
          <span class="retro-badge"><i class="status-dot"></i> DEEP SPACE NETWORK RF TUNER</span>
          <h3 class="minigame-title">CRT OSCILLOSCOPE CARRIER PHASE LOCK</h3>
          <p class="minigame-sub">Tune the receiver carrier frequency and phase offset to align the noisy spacecraft downlink with the ground station reference oscillator!</p>
        </div>

        <div class="oscilloscope-box">
          <canvas id="osc-canvas" width="600" height="180" class="oscilloscope-canvas"></canvas>
          <div class="scanline-overlay"></div>
        </div>

        <div class="mg-hud-row">
          <div class="mg-stat-box">
            <span class="mg-stat-label">CARRIER FREQUENCY</span>
            <span id="radio-freq-val" class="mg-stat-val">${this.freq} MHz</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">PHASE OFFSET</span>
            <span id="radio-phase-val" class="mg-stat-val">${this.phase}°</span>
          </div>
          <div class="mg-stat-box">
            <span class="mg-stat-label">CARRIER SNR</span>
            <span id="radio-snr-val" class="mg-stat-val text-magenta">6 dB</span>
          </div>
        </div>

        <div class="tuner-slider-wrap">
          <div class="slider-row">
            <label class="slider-label">CARRIER FREQUENCY: <strong id="disp-freq">${this.freq} MHz</strong> (Target: ~2287 MHz)</label>
            <input type="range" id="slider-freq" min="2200" max="2300" step="1" value="${this.freq}" class="retro-range">
          </div>
          <div class="slider-row">
            <label class="slider-label">PHASE OFFSET: <strong id="disp-phase">${this.phase}°</strong> (Target: 180°)</label>
            <input type="range" id="slider-phase" min="0" max="360" step="5" value="${this.phase}" class="retro-range">
          </div>
        </div>

        <div class="filter-action-bar">
          <button id="lock-carrier-btn" class="retro-btn btn-disabled" onclick="window.activeRadioGame.lock()">
            LOCK RF CARRIER & DECODE TELEMETRY STREAM
          </button>
        </div>
      </div>
    `;

    window.activeRadioGame = this;

    const fSlider = document.getElementById('slider-freq');
    const pSlider = document.getElementById('slider-phase');

    if (fSlider) {
      fSlider.oninput = (e) => {
        this.freq = parseInt(e.target.value);
        document.getElementById('disp-freq').textContent = `${this.freq} MHz`;
        document.getElementById('radio-freq-val').textContent = `${this.freq} MHz`;
        window.soundEngine.playTone(200 + (this.freq - 2200) * 3, 0.02);
      };
    }

    if (pSlider) {
      pSlider.oninput = (e) => {
        this.phase = parseInt(e.target.value);
        document.getElementById('disp-phase').textContent = `${this.phase}°`;
        document.getElementById('radio-phase-val').textContent = `${this.phase}°`;
        window.soundEngine.playTone(350 + this.phase * 0.8, 0.02);
      };
    }
  }

  initCanvas() {
    this.canvas = document.getElementById('osc-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
  }

  startLoop() {
    let t = 0;
    const loop = () => {
      t += 0.08;
      this.draw(t);
      if (!this.isWon) {
        this.animFrame = requestAnimationFrame(loop);
      }
    };
    this.animFrame = requestAnimationFrame(loop);
  }

  draw(t) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const midY = h / 2;

    // Dark green phosphor CRT screen
    ctx.fillStyle = '#030a05';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Evaluate alignment
    const dF = Math.abs(this.freq - this.targetFreq);
    const dP = Math.abs(this.phase - this.targetPhase);
    const isLocked = dF <= 3 && dP <= 15;
    const snr = Math.max(3, Math.round(28 - (dF * 0.4 + dP * 0.1)));

    const snrEl = document.getElementById('radio-snr-val');
    const lockBtn = document.getElementById('lock-carrier-btn');

    if (snrEl) {
      snrEl.textContent = `${snr} dB`;
      snrEl.className = isLocked ? 'mg-stat-val text-green' : 'mg-stat-val text-magenta';
    }
    if (lockBtn) {
      if (isLocked) {
        lockBtn.className = 'retro-btn pulse-btn';
        lockBtn.textContent = 'CARRIER PHASE LOCKED ✓ CLICK TO DECODE TELEMETRY';
      } else {
        lockBtn.className = 'retro-btn btn-disabled';
        lockBtn.textContent = 'TUNE TO ~2287 MHz & 180° PHASE';
      }
    }

    // Draw Reference Wave (Gold dashed)
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let x = 0; x < w; x += 4) {
      const y = midY + Math.sin(x * 0.04 + t) * 45;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Spacecraft Signal (Neon green with noise jitter)
    ctx.strokeStyle = isLocked ? '#22c55e' : '#4ade80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const noiseAmp = isLocked ? 1.5 : Math.min(25, dF * 0.8 + dP * 0.2);
    const freqFactor = 0.04 + (this.freq - this.targetFreq) * 0.0006;
    const phaseOffset = (this.phase - this.targetPhase) * (Math.PI / 180);

    for (let x = 0; x < w; x += 3) {
      const noise = (Math.random() - 0.5) * noiseAmp;
      const y = midY + Math.sin(x * freqFactor + t + phaseOffset) * 45 + noise;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  lock() {
    const dF = Math.abs(this.freq - this.targetFreq);
    const dP = Math.abs(this.phase - this.targetPhase);
    if (dF <= 3 && dP <= 15) {
      this.isWon = true;
      window.soundEngine.playSuccess();
      this.onWin();
    } else {
      window.soundEngine.playError();
    }
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    window.activeRadioGame = null;
  }
}
