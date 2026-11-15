/**
 * NASA SPACE LEGACY - Main Game Application Controller
 * Handles the branching matrix:
 * TOTAL 24 LEVELS: 12 LEVELS MARS + 12 LEVELS MOONS
 * MARS (12 Levels) -> [starter: 4][middle: 4][advanced: 4]
 * MOONS (12 Levels) -> [starter: 4][middle: 4][advanced: 4]
 */

/**
 * NASA SPACE LEGACY - ARGUS Companion Probe Controller
 * Interactive plaything recon bot with flashlight projector & typewriter hologram speech
 */
class BB8CompanionController {
  constructor() {
    this.widget = null;
    this.holoBox = null;
    this.textEl = null;
    this.beamCone = null;
    this.droidEl = null;
    this.headEl = null;
    this.bodyEl = null;
    this.eyeEl = null;
    this.mascot3D = null;

    this.typeInterval = null;
    this.isTyping = false;
    this.isHoloVisible = true;
    this.isBusyAction = false;
    // Chat box behaviour: auto-hide after speaking; stay closed if the player closed it.
    this.userClosedHolo = false;
    this.holoHideTimer = null;

    this.cursorHistory = [];
    this.trackingTimer = null;
    this.lastProximityCommandTime = 0;
    this.lastHoverZone = null;
    this.hoverZoneTimer = null;

    this.tips = [
      "BEEP-BOOP! Did you know? Opportunity drove over 28 miles across Mars, surviving 55 times longer than its 90-day design warranty!",
      "WHEEE-CHIRP! Apollo 13 utilized the Lunar Module 'Aquarius' as a cryogenic lifeboat to keep 3 astronauts alive on just 15 Amps!",
      "CHIRP-TRIILL! Mars Climate Orbiter was lost because trajectory software exchanged pound-seconds instead of metric Newton-seconds!",
      "BOOP-BEEP! Spirit's locked right front wheel dug a trench in the sand that uncovered pure white silica, proving ancient volcanic hot springs!",
      "TRIILL-WHISTLE! Surveyor 4 abruptly fell silent at T-2.5 seconds before lunar landing due to a retro-rocket rupture or severed cable!",
      "BEEP-WHIRR! Mariner 4 sent back humanity's first 22 close-up photos of Mars in 1965, revealing a heavily cratered lunar-like world!",
      "CHIRP-BOOP! LCROSS slammed its Centaur booster into Cabeus crater at 5,600 mph, proving billions of gallons of water ice exist at the lunar poles!",
      "BEEP-BEEP! MIT's Apollo Guidance Computer used core rope memory hand-woven by female textile workers, famously nicknamed 'LOL memory'!",
      "WHEEE-BEEP! Clementine mapped the Moon with Star Wars SDI sensors and discovered the first modern evidence of polar ice in 1994!"
    ];
    this.tipIndex = 0;
  }

  init() {
    this.widget = document.getElementById('helix7-widget') || document.getElementById('bb8-companion-widget');
    this.holoBox = document.getElementById('bb8-holo-box');
    this.textEl = document.getElementById('bb8-message-text');
    this.beamCone = document.getElementById('bb8-beam-cone');
    this.droidEl = document.getElementById('helix7-droid-container') || document.getElementById('bb8-droid');
    this.headEl = document.getElementById('bb8-head');
    this.bodyEl = document.getElementById('bb8-body');
    this.eyeEl = document.getElementById('bb8-eye-pupil');

    // Initialize Three.js 3D Mascot HELIX-7
    this.init3DMascot();

    // Attach smooth mouse cursor movement tracking
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
    window.addEventListener('mouseleave', () => this.handleMouseLeave());
  }

  init3DMascot() {
    if (this.mascot3D) return;
    const canvas = document.getElementById('helix7-canvas');
    if (canvas && typeof Helix7Mascot !== 'undefined') {
      try {
        this.mascot3D = new Helix7Mascot('helix7-canvas');
        window.helix7Mascot = this.mascot3D;
      } catch (err) {
        console.warn('HELIX-7 3D initialization:', err);
      }
    }
  }

  handleMouseMove(e) {
    if (!this.headEl || !this.droidEl || this.isBusyAction) return;

    const now = Date.now();
    const rect = this.headEl.getBoundingClientRect();
    const headX = rect.left + rect.width / 2;
    const headY = rect.top + rect.height / 2;
    const dx = e.clientX - headX;
    const dy = e.clientY - headY;
    const dist = Math.hypot(dx, dy);

    // Record cursor trajectory for funny gesture detection
    this.cursorHistory.push({ x: e.clientX, y: e.clientY, time: now, dx, dy, dist });
    if (this.cursorHistory.length > 16) this.cursorHistory.shift();
    this.cursorHistory = this.cursorHistory.filter(pt => now - pt.time < 800);

    // Check funny gestures (tickle, startle, dizzy spin)
    if (this.checkFunnyGestures(e, dist, now)) {
      return;
    }

    // Active cursor tracking mode
    this.droidEl.classList.add('bb8-tracking');
    clearTimeout(this.trackingTimer);
    this.trackingTimer = setTimeout(() => {
      if (this.droidEl && !this.isBusyAction) {
        this.droidEl.classList.remove('bb8-tracking');
        this.headEl.style.transform = '';
        if (this.eyeEl) this.eyeEl.style.transform = '';
      }
    }, 2800);

    // Natural head tilt and pitch angle clamp toward cursor
    const screenW = Math.max(window.innerWidth, 800);
    const screenH = Math.max(window.innerHeight, 600);
    const tilt = Math.max(-28, Math.min(28, (dx / (screenW * 0.7)) * 36));
    const pitch = Math.max(-4, Math.min(3, (dy / (screenH * 0.7)) * 7));

    this.headEl.style.transform = `rotate(${tilt.toFixed(1)}deg) translateY(${pitch.toFixed(1)}px)`;

    // Shift eye pupil toward cursor
    if (this.eyeEl && dist > 8) {
      const pupilX = Math.max(-1.8, Math.min(1.8, (dx / dist) * 1.8));
      const pupilY = Math.max(-1.3, Math.min(1.3, (dy / dist) * 1.3));
      this.eyeEl.style.transform = `translate(${pupilX.toFixed(2)}px, ${pupilY.toFixed(2)}px)`;
    }

    // Check proximity to nearby menus and give tactical commands
    this.checkNearbyMenuProximity(e, now);
  }

  handleMouseLeave() {
    if (this.droidEl && !this.isBusyAction) {
      this.droidEl.classList.remove('bb8-tracking');
      if (this.headEl) this.headEl.style.transform = '';
      if (this.eyeEl) this.eyeEl.style.transform = '';
    }
  }

  checkFunnyGestures(e, dist, now) {
    if (this.isBusyAction || this.cursorHistory.length < 5) return false;

    // 1. Tickle Action: fast back-and-forth scrubbing directly over the bot (dist < 65px)
    if (dist < 65) {
      let directionChanges = 0;
      for (let i = 2; i < this.cursorHistory.length; i++) {
        const d1 = this.cursorHistory[i-1].x - this.cursorHistory[i-2].x;
        const d2 = this.cursorHistory[i].x - this.cursorHistory[i-1].x;
        if ((d1 > 4 && d2 < -4) || (d1 < -4 && d2 > 4)) {
          directionChanges++;
        }
      }
      if (directionChanges >= 4) {
        this.playFunnyAction('tickle');
        return true;
      }
    }

    // 2. Startled Action: cursor was far (> 280px) and suddenly darted into < 45px!
    const oldSample = this.cursorHistory[0];
    if (oldSample && oldSample.dist > 280 && dist < 45 && (now - oldSample.time) < 250) {
      this.playFunnyAction('startle');
      return true;
    }

    // 3. Dizzy Action: rapid circular mouse movement near bot (within 150px, speed > 1350px/s)
    if (dist < 150) {
      let totalDist = 0;
      for (let i = 1; i < this.cursorHistory.length; i++) {
        totalDist += Math.hypot(
          this.cursorHistory[i].x - this.cursorHistory[i-1].x,
          this.cursorHistory[i].y - this.cursorHistory[i-1].y
        );
      }
      const timeDelta = (now - this.cursorHistory[0].time) / 1000;
      const speed = timeDelta > 0 ? totalDist / timeDelta : 0;
      if (speed > 1350 && totalDist > 320) {
        this.playFunnyAction('dizzy');
        return true;
      }
    }

    return false;
  }

  playFunnyAction(type) {
    if (this.isBusyAction || !this.droidEl) return;
    this.isBusyAction = true;
    this.cursorHistory = [];
    this.droidEl.classList.remove('bb8-tracking', 'bb8-dizzy', 'bb8-startled', 'bb8-tickle', 'bb8-peek');
    void this.droidEl.offsetWidth; // force reflow

    if (type === 'tickle') {
      this.droidEl.classList.add('bb8-tickle');
      if (window.soundEngine?.playDroidTickle) window.soundEngine.playDroidTickle();
      const tickleLines = [
        "HEHE-BZZT-CHIRP! Stop that! That tickles my anti-gravity exhaust ports!",
        "GIGGLE-CHIRP! Warning: Forensic detective is tickling my chassis sensors!",
        "BOOP-HEHEHE! That is an unauthorized tactile diagnostic test!"
      ];
      this.say(tickleLines[Math.floor(Math.random() * tickleLines.length)], "happy");
      setTimeout(() => {
        if (this.droidEl) this.droidEl.classList.remove('bb8-tickle');
        this.isBusyAction = false;
      }, 1300);
    } else if (type === 'dizzy') {
      this.droidEl.classList.add('bb8-dizzy');
      if (window.soundEngine?.playDroidDizzy) window.soundEngine.playDroidDizzy();
      const dizzyLines = [
        "WHOA-BZZT! Rapid cursor orbit detected! Gyroscopic compass overload! I'm getting dizzy!",
        "GYRO MALFUNCTION! *WHEEEE* Too fast! My orbital telemetry is spinning 720 degrees!",
        "BZZZT-WHOAAA! Are you trying to hypnotize my navigation matrix?!"
      ];
      this.say(dizzyLines[Math.floor(Math.random() * dizzyLines.length)], "curious");
      setTimeout(() => {
        if (this.droidEl) this.droidEl.classList.remove('bb8-dizzy');
        this.isBusyAction = false;
      }, 1700);
    } else if (type === 'startle') {
      this.droidEl.classList.add('bb8-startled');
      if (window.soundEngine?.playDroidStartle) window.soundEngine.playDroidStartle();
      const startleLines = [
        "BEEP-EEK! Don't sneak up on an autonomous recon probe! My collision radar almost panicked!",
        "WHOA-JUMP! High-velocity pointer dive! Keep a safe 10-centimeter clearance!",
        "BOOP-GASP! Incoming cursor projectile! Defensive shielding nearly deployed!"
      ];
      this.say(startleLines[Math.floor(Math.random() * startleLines.length)], "curious");
      setTimeout(() => {
        if (this.droidEl) this.droidEl.classList.remove('bb8-startled');
        this.isBusyAction = false;
      }, 900);
    }
  }

  checkNearbyMenuProximity(e, now) {
    // 8-second cooldown between proactive menu commands
    if (this.isTyping || now - this.lastProximityCommandTime < 8000) return;

    const zones = [
      {
        id: 'holo-controls',
        el: this.holoBox,
        pad: 40,
        cmd: "COMMAND DIRECTIVE: Forensic Holo-Deck in range! Click [💬] for declassified intel or [×] to toggle telemetry log!"
      },
      {
        id: 'top-controls',
        el: document.querySelector('.header-controls-group'),
        pad: 35,
        cmd: "SYSTEMS COMMAND: Hardware monitor controls detected! Adjust CRT scanlines, toggle sound synth, or open Mission Tree!"
      },
      {
        id: 'nav-tabs',
        el: document.getElementById('main-nav-tabs'),
        pad: 30,
        cmd: "NAVIGATION COMMAND: Sector routing matrix nearby! Select Destination, Case Board, or Mission Tree to chart course!"
      },
      {
        id: 'workbench-tabs',
        el: document.querySelector('.workbench-tabs-row'),
        pad: 35,
        cmd: "DIAGNOSTIC PROTOCOL: Hardware workbench active! Switch tabs to inspect Schematics, run Simulators, or submit your Verdict!"
      },
      {
        id: 'destination-cards',
        el: document.querySelector('.destinations-grid'),
        pad: 40,
        cmd: "SECTOR DIRECTIVE: Mission dossiers in telemetry lock! Select Mars or Moon sector to examine abandoned explorers!"
      }
    ];

    let matchedZone = null;
    for (const zone of zones) {
      if (!zone.el || zone.el.offsetParent === null) continue;
      const r = zone.el.getBoundingClientRect();
      if (
        e.clientX >= r.left - zone.pad &&
        e.clientX <= r.right + zone.pad &&
        e.clientY >= r.top - zone.pad &&
        e.clientY <= r.bottom + zone.pad
      ) {
        matchedZone = zone;
        break;
      }
    }

    if (matchedZone && matchedZone.id !== this.lastHoverZone) {
      clearTimeout(this.hoverZoneTimer);
      this.hoverZoneTimer = setTimeout(() => {
        if (!this.isTyping && Date.now() - this.lastProximityCommandTime >= 7000) {
          this.lastHoverZone = matchedZone.id;
          this.lastProximityCommandTime = Date.now();
          this.say(matchedZone.cmd, "curious");
        }
      }, 350);
    } else if (!matchedZone) {
      clearTimeout(this.hoverZoneTimer);
    }
  }

  toggleHolo() {
    if (!this.holoBox) return;
    clearTimeout(this.holoHideTimer);
    this.isHoloVisible = !this.isHoloVisible;
    // Closing with ✕ is a choice: keep it closed until the player clicks HELIX-7.
    this.userClosedHolo = !this.isHoloVisible;
    if (this.isHoloVisible) {
      this.holoBox.classList.remove('minimized');
      if (this.widget) this.widget.classList.add('bb8-beam-active');
      window.soundEngine.playDroidBeam();
    } else {
      this.holoBox.classList.add('minimized');
      if (this.widget) this.widget.classList.remove('bb8-beam-active');
      window.soundEngine.playTone(320, 0.05);
    }
  }

  interact() {
    if (this.mascot3D) {
      this.mascot3D.jumpAndSpin();
    } else if (this.droidEl) {
      this.droidEl.classList.remove('bb8-happy-spin');
      void this.droidEl.offsetWidth; // trigger reflow
      this.droidEl.classList.add('bb8-happy-spin');
    }

    const tip = this.tips[this.tipIndex % this.tips.length];
    this.tipIndex++;
    this.userClosedHolo = false; // clicking the droid always opens the chat again
    this.say(tip, "happy");
  }

  // Hide the chat box once the player has had time to read it, so it doesn't sit
  // on top of clues and buttons. Waits while the pointer is over the box.
  scheduleHoloHide(message) {
    clearTimeout(this.holoHideTimer);
    const small = window.innerWidth < 1100;
    const delay = Math.max(small ? 4500 : 7000, message.length * (small ? 45 : 60));
    const hide = () => {
      if (!this.holoBox || this.holoBox.classList.contains('minimized')) return;
      if (this.holoBox.matches(':hover') || this.isTyping) { this.holoHideTimer = setTimeout(hide, 1500); return; }
      this.holoBox.classList.add('minimized');
      this.isHoloVisible = false;
      if (this.widget) this.widget.classList.remove('bb8-beam-active');
    };
    this.holoHideTimer = setTimeout(hide, delay);
  }

  say(message, mood = "chirp") {
    if (!this.textEl) return;

    // Trigger 3D Mascot talking mode
    if (this.mascot3D) {
      this.mascot3D.setTalking(true);
      if (mood === 'happy') this.mascot3D.jumpAndSpin();
    }

    // Show the holo box — unless the player closed it (then HELIX-7 just animates).
    clearTimeout(this.holoHideTimer);
    if (this.holoBox && this.holoBox.classList.contains('minimized') && !this.userClosedHolo) {
      this.holoBox.classList.remove('minimized');
      this.isHoloVisible = true;
    }

    // Trigger flashlight switch-on flick
    if (this.widget && !this.userClosedHolo) {
      this.widget.classList.remove('bb8-beam-active');
      void this.widget.offsetWidth; // force reflow
      this.widget.classList.add('bb8-beam-active');
    }

    // Sound effect: beam switch
    window.soundEngine.playDroidBeam();

    // Cute physical reaction animations
    if (this.droidEl) {
      this.droidEl.classList.remove('bb8-tilt-left', 'bb8-tilt-right', 'bb8-roll-body');
      void this.droidEl.offsetWidth;

      if (mood === 'curious') {
        this.droidEl.classList.add('bb8-tilt-left');
        window.soundEngine.playDroidCurious();
      } else if (mood === 'happy') {
        this.droidEl.classList.add('bb8-happy-spin');
        window.soundEngine.playDroidHappy();
      } else {
        this.droidEl.classList.add(Math.random() > 0.5 ? 'bb8-tilt-right' : 'bb8-tilt-left');
        window.soundEngine.playDroidChirp();
      }

      this.droidEl.classList.add('bb8-roll-body');
      setTimeout(() => {
        if (this.droidEl) {
          this.droidEl.classList.remove('bb8-roll-body', 'bb8-tilt-left', 'bb8-tilt-right');
        }
      }, 950);
    }

    // Typewriter effect
    if (this.typeInterval) {
      clearInterval(this.typeInterval);
      this.typeInterval = null;
    }
    this.textEl.textContent = "";
    this.isTyping = true;
    let charIdx = 0;

    this.typeInterval = setInterval(() => {
      if (charIdx < message.length) {
        this.textEl.textContent += message[charIdx];
        if (charIdx % 4 === 0) {
          window.soundEngine.playDroidType();
        }
        charIdx++;
      } else {
        clearInterval(this.typeInterval);
        this.typeInterval = null;
        this.isTyping = false;
        if (this.mascot3D) {
          this.mascot3D.setTalking(false);
        }
        this.scheduleHoloHide(message);
      }
    }, 22);
  }
}

class SpaceLegacyApp {
  constructor() {
    this.destination = 'mars'; // 'mars' or 'moon'
    this.depth = 'starter';    // 'starter', 'middle', 'advanced'
    this.currentCase = null;
    this.selectedHypoId = null;

    // Load progress from localStorage
    this.savedProgress = this.loadProgress();

    this.blueprintRenderer = null;
    this.miniGameManager = null;

    this.init();
  }

  loadProgress() {
    try {
      const data = localStorage.getItem('nasa_space_legacy_progress_v2');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Storage read failed:', e);
    }
    return {
      mars: {
        starter: { unlocked: 1, solved: [] },
        middle: { unlocked: 1, solved: [] },
        advanced: { unlocked: 1, solved: [] }
      },
      moon: {
        starter: { unlocked: 1, solved: [] },
        middle: { unlocked: 1, solved: [] },
        advanced: { unlocked: 1, solved: [] }
      }
    };
  }

  saveProgress() {
    try {
      localStorage.setItem('nasa_space_legacy_progress_v2', JSON.stringify(this.savedProgress));
    } catch (e) {
      console.warn('Storage write failed:', e);
    }
    if (window.CloudSync) window.CloudSync.save(this.savedProgress);
    this.updateOverallProgressStats();
  }

  updateOverallProgressStats() {
    const countSolved = (destKey) => {
      const d = this.savedProgress[destKey] || {};
      const s = (d.starter?.solved || []).length;
      const m = (d.middle?.solved || []).length;
      const a = (d.advanced?.solved || []).length;
      return s + m + a;
    };

    const marsSolved = countSolved('mars');
    const moonSolved = countSolved('moon');
    const totalSolved = marsSolved + moonSolved;

    const badge = document.getElementById('solved-count-badge');
    const marsCount = document.getElementById('mars-solved-count');
    const moonCount = document.getElementById('moon-solved-count');

    if (badge) badge.textContent = `${totalSolved} / 24 SOLVED`;
    if (marsCount) marsCount.textContent = marsSolved;
    if (moonCount) moonCount.textContent = moonSolved;
  }

  init() {
    this.initStarfield();
    this.initAudioAndCRTControls();

    this.miniGameManager = new MiniGameManager('minigame-container', (caseData) => {
      this.onMiniGameSolved(caseData);
    });

    this.bb8Bot = new BB8CompanionController();
    window.bb8Bot = this.bb8Bot;
    window.helix7Bot = this.bb8Bot;
    this.bb8Bot.init();

    this.updateOverallProgressStats();

    // Render Tree Matrix
    this.renderTreeMatrix();

    // Start on Screen 0: Opening Page ("landing")
    this.goToScreen('landing');

    // Allow pressing Enter key on landing page to direct straight to main page
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const landingEl = document.getElementById('screen-landing');
        if (landingEl && !landingEl.classList.contains('hidden')) {
          this.enterMainPage();
        }
      }
    });

    // Cloud save first (signs in the guest or the remembered member), then accounts UI.
    this.initCloudSync().then(() => {
      if (window.TDAuth) window.TDAuth.boot();
    });
  }

  getSolvedTotal() {
    const countSolved = (destKey) => {
      const d = (this.savedProgress && this.savedProgress[destKey]) || {};
      const s = (d.starter?.solved || []).length;
      const m = (d.middle?.solved || []).length;
      const a = (d.advanced?.solved || []).length;
      return s + m + a;
    };
    return countSolved('mars') + countSolved('moon');
  }

  enterMainPage() {
    this.authenticateUser('Guest Investigator', true);
  }

  // Real sign-in lives in js/auth.js (Supabase Auth + passkeys).
  handleAuthSubmit(e) {
    if (e) e.preventDefault();
    if (window.TDAuth) window.TDAuth.showAuth('login');
  }

  handleGuestLogin() {
    this.authenticateUser('Guest Investigator', true);
  }

  authenticateUser(identifier, isGuest = false) {
    if (window.soundEngine && window.soundEngine.playSuccess) {
      window.soundEngine.playSuccess();
    }

    // A logged-in member always plays under their own account name.
    const member = window.TDAuth && window.TDAuth.isMember() ? window.TDAuth.displayName() : null;
    if (member) { identifier = member; isGuest = false; }

    const rankBadge = document.getElementById('player-rank-pill');
    if (rankBadge) {
      const userDisplay = isGuest ? 'GUEST RECON' : identifier.split('@')[0].toUpperCase();
      const solvedCount = typeof this.getSolvedTotal === 'function' ? this.getSolvedTotal() : 0;
      rankBadge.innerHTML = `👤 ${userDisplay} | <span id="solved-count-badge">${solvedCount}/24 SOLVED</span>`;
    }

    const rankLabel = document.getElementById('player-rank');
    if (rankLabel) {
      rankLabel.textContent = isGuest ? 'RANK: GUEST CADET' : `RANK: ${identifier.split('@')[0].toUpperCase()}`;
    }

    // Direct into the main mission briefing screen of the project
    this.goToScreen('destination');

    // HELIX-7 Mascot Welcome Greeting
    if (this.bb8Bot) {
      setTimeout(() => {
        const msg = isGuest
          ? "BEEP-CHIRP! 3D Droid mascot HELIX-7 online! Guest clearance recognized! Reopening abandoned explorer dossiers!"
          : `WHEEE-CHIRP! 3D Droid mascot HELIX-7 online! Welcome back, Investigator ${identifier.split('@')[0]}! Tactical forensic systems armed!`;
        this.bb8Bot.say(msg, "happy");
      }, 700);
    }
  }

  // Pull cloud-saved progress from Supabase and merge it with this browser's copy.
  async initCloudSync() {
    if (!window.CloudSync) return;
    const merged = await window.CloudSync.init(this.savedProgress);
    if (!merged) return;
    this.savedProgress = merged;
    try {
      localStorage.setItem('nasa_space_legacy_progress_v2', JSON.stringify(this.savedProgress));
    } catch (e) { /* offline storage unavailable */ }
    this.updateOverallProgressStats();
    this.renderTreeMatrix();
    const levelsEl = document.getElementById('screen-levels');
    if (levelsEl && !levelsEl.classList.contains('hidden')) {
      this.renderLevelsTimeline();
    }
  }

  initAudioAndCRTControls() {
    const audioBtn = document.getElementById('toggle-audio-btn');
    if (audioBtn) {
      audioBtn.onclick = () => {
        const isMuted = window.soundEngine.toggleMute();
        audioBtn.textContent = isMuted ? '🔇 SOUND: OFF' : '🔊 SOUND: ON';
        if (!isMuted) window.soundEngine.playSelect();
      };
    }

    const crtBtn = document.getElementById('toggle-crt-btn');
    const crtOverlay = document.getElementById('crt-overlay');
    if (crtBtn && crtOverlay) {
      crtBtn.onclick = () => {
        crtOverlay.classList.toggle('hidden');
        const isOn = !crtOverlay.classList.contains('hidden');
        crtBtn.textContent = isOn ? '📺 CRT: ON' : '📺 CRT: OFF';
        window.soundEngine.playTone(600, 0.05);
      };
    }

    const contrastBtn = document.getElementById('toggle-contrast-btn');
    if (contrastBtn) {
      contrastBtn.onclick = () => {
        document.body.classList.toggle('high-contrast');
        const isHi = document.body.classList.contains('high-contrast');
        contrastBtn.textContent = isHi ? '◉ CONTRAST: HIGH' : '◉ CONTRAST: NORM';
        window.soundEngine.playTone(750, 0.05);
      };
    }
  }

  // ==========================================
  // NAVIGATION & SCREEN SWITCHING
  // ==========================================
  goToScreen(screenId) {
    window.soundEngine.playClick();

    const screens = ['landing', 'login', 'tree', 'destination', 'depth', 'levels', 'game'];
    screens.forEach(s => {
      const el = document.getElementById(`screen-${s}`);
      if (el) el.classList.add('hidden');
    });

    const targetEl = document.getElementById(`screen-${screenId}`);
    if (targetEl) targetEl.classList.remove('hidden');

    // Header, Nav tabs, and Mascot Widget visibility control
    const headerEl = document.querySelector('.retro-header-frame');
    const navBarEl = document.getElementById('main-nav-tabs');
    const mascotWidget = document.getElementById('helix7-widget') || document.getElementById('bb8-companion-widget');

    if (screenId === 'landing' || screenId === 'login') {
      if (headerEl) headerEl.classList.add('hidden');
      if (navBarEl) navBarEl.classList.add('hidden');
      if (mascotWidget) mascotWidget.style.display = 'none';
      if (this.bb8Bot && this.bb8Bot.mascot3D && typeof this.bb8Bot.mascot3D.dockToCorner === 'function') {
        this.bb8Bot.mascot3D.dockToCorner();
      }
      return;
    } else {
      if (headerEl) headerEl.classList.remove('hidden');
      if (navBarEl) navBarEl.classList.remove('hidden');
      if (mascotWidget) mascotWidget.style.display = 'flex';

      // Ensure 3D mascot initialized
      if (this.bb8Bot && !this.bb8Bot.mascot3D) {
        this.bb8Bot.init3DMascot();
      }
    }

    // Update main nav tab styling
    const navTabs = [
      { id: 'tab-briefing', screen: 'destination' },
      { id: 'tab-caseboard', screen: 'levels' },
      { id: 'tab-missiontree', screen: 'tree' },
      { id: 'tab-depth', screen: 'depth' }
    ];
    navTabs.forEach(t => {
      const btn = document.getElementById(t.id);
      if (btn) {
        if (t.screen === screenId) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    this.updateBreadcrumbs(screenId);

    if (screenId === 'levels') {
      this.renderLevelsTimeline();
    } else if (screenId === 'tree') {
      this.renderTreeMatrix();
    }

    // ARGUS Probe Reactive Commentary on Block Shift
    if (this.bb8Bot && screenId !== 'game') {
      const messages = {
        destination: "BEEP-BOOP! Welcome to the forensic archive! Select Mars or Moon to begin investigating abandoned explorers!",
        levels: "WHEEE-CHIRP! Case Board online! 24 unique missions mapped in chronological order! Select a case to examine its hardware!",
        tree: "BEEP-WHISTLE! Full forensic matrix online! 12 Mars + 12 Moon nodes across Cadet, Analyst, and Lead tiers!",
        depth: "BOOP-BEEP! Select clearance depth: Starter teaches fundamentals, Middle tests sensor debounce, Advanced unlocks full mission telemetry!"
      };
      if (messages[screenId]) {
        this.bb8Bot.say(messages[screenId], screenId === 'tree' ? 'happy' : 'curious');
      }
    }
  }

  toggleTreeView() {
    const treeScreen = document.getElementById('screen-tree');
    if (treeScreen && !treeScreen.classList.contains('hidden')) {
      this.goToScreen('destination');
    } else {
      this.goToScreen('tree');
    }
  }

  updateBreadcrumbs(currentScreen) {
    const steps = ['dest', 'depth', 'levels', 'game'];
    const screenMap = { destination: 0, depth: 1, levels: 2, game: 3 };
    const currentIndex = screenMap[currentScreen] !== undefined ? screenMap[currentScreen] : -1;

    steps.forEach((step, idx) => {
      const el = document.getElementById(`crumb-${step}`);
      if (el) {
        if (currentIndex !== -1 && idx <= currentIndex) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });
  }

  // ==========================================
  // TREE MATRIX RENDERING (24 TOTAL LEVELS: 12 MARS + 12 MOONS)
  // ==========================================
  renderTreeMatrix() {
    const container = document.getElementById('tree-matrix-container');
    if (!container) return;

    const destinations = [
      { key: 'mars', title: '🚀 MARS OPERATIONS (12 LEVELS TOTAL)', cssClass: 'mars-tree', offset: 0 },
      { key: 'moon', title: '🌕 MOONS OPERATIONS (12 LEVELS TOTAL)', cssClass: 'moon-tree', offset: 12 }
    ];
    const tiers = [
      { key: 'starter', label: '[ STARTER ]', sub: 'Cadet (Levels 1-4 of 12)', tierOffset: 0 },
      { key: 'middle', label: '[ MIDDLE ]', sub: 'Analyst (Levels 5-8 of 12)', tierOffset: 4 },
      { key: 'advanced', label: '[ ADVANCED ]', sub: 'Lead (Levels 9-12 of 12)', tierOffset: 8 }
    ];

    container.innerHTML = destinations.map(dest => {
      const destProgress = this.savedProgress[dest.key] || {
        starter: { unlocked: 1, solved: [] },
        middle: { unlocked: 1, solved: [] },
        advanced: { unlocked: 1, solved: [] }
      };

      return `
        <div class="tree-destination-card ${dest.cssClass}">
          <div class="tree-dest-header">
            <div class="tree-dest-title" onclick="window.gameApp.selectDestination('${dest.key}')" style="cursor: pointer;">
              <span>${dest.title}</span>
            </div>
          </div>

          <!-- Vertical Conduits (||) -->
          <div class="tree-conduit-row">
            <span class="neon-pipe">||<br>||</span>
            <span class="neon-pipe">||<br>||</span>
            <span class="neon-pipe">||<br>||</span>
          </div>

          <!-- 3 Branches: [starter] [middle] [advanced] -->
          <div class="tree-tiers-grid">
            ${tiers.map(tier => {
              const tierCases = (window.MISSION_DATABASE[dest.key] && window.MISSION_DATABASE[dest.key][tier.key]) || [];
              const tierProgress = destProgress[tier.key] || { unlocked: 1, solved: [] };

              return `
                <div class="tree-tier-column">
                  <div class="tree-tier-pill" onclick="window.gameApp.selectTreeTier('${dest.key}', '${tier.key}')">
                    <span class="tier-pill-name">${tier.label}</span>
                    <span class="tier-pill-sub">${tier.sub}</span>
                  </div>

                  <!-- Conduit Pipe (||) -->
                  <div class="tree-conduit-row" style="margin: 8px 0;">
                    <span class="neon-pipe">||</span>
                  </div>

                  <!-- [4 Levels] Container -->
                  <div class="tree-levels-box">
                    <span class="tree-levels-label">[ 4 LEVELS IN ORDER ]</span>
                    ${tierCases.map((c, idx) => {
                      const destLevelNum = tier.tierOffset + idx + 1;
                      const globalLevelNum = dest.offset + destLevelNum;
                      const isUnlocked = c.level <= tierProgress.unlocked;
                      const isSolved = tierProgress.solved.includes(c.id);

                      return `
                        <div class="tree-level-item ${isUnlocked ? '' : 'locked'}" 
                             onclick="${isUnlocked ? `window.gameApp.startLevelDirect('${dest.key}', '${tier.key}', '${c.id}')` : ''}">
                          <span class="tree-level-badge">L${destLevelNum < 10 ? '0' + destLevelNum : destLevelNum}</span>
                          <div class="tree-level-meta">
                            <span class="tree-level-title">${c.codename} (Mission ${destLevelNum}/12)</span>
                            <span class="tree-level-sub">Global #${globalLevelNum}/24 • ${c.endingType}</span>
                          </div>
                          ${isSolved ? `<span class="tree-level-solved">✓ ${c.badgeIcon}</span>` : (isUnlocked ? `<span style="font-size: 11px; color: var(--purple-glow);">▶</span>` : `<span style="font-size: 10px; color: #64748b;">🔒</span>`)}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  selectTreeTier(dest, tier) {
    this.destination = dest;
    this.depth = tier;
    window.soundEngine.playSelect();
    this.goToScreen('levels');
  }

  startLevelDirect(dest, tier, caseId) {
    this.destination = dest;
    this.depth = tier;
    const tierCases = window.MISSION_DATABASE[dest][tier] || [];
    const c = tierCases.find(item => item.id === caseId);
    if (c) {
      this.currentCase = c;
      this.launchCaseInvestigation();
    }
  }

  // ==========================================
  // STEP 1: DESTINATION SELECTION
  // ==========================================
  selectDestination(dest) {
    this.destination = dest;
    window.soundEngine.playSelect();

    const label = document.getElementById('depth-dest-label');
    if (label) {
      label.textContent = dest === 'mars' ? 'MARS (12 LEVELS TOTAL)' : 'MOONS (12 LEVELS TOTAL)';
    }

    if (this.bb8Bot) {
      if (dest === 'mars') {
        this.bb8Bot.say("CHIRP-TRIILL! Destination MARS locked! Red sands, solar dust storms, and rovers waiting to tell their silent stories!", "happy");
      } else {
        this.bb8Bot.say("BEEP-BOOP-WHISTLE! Destination MOONS locked! Apollo landings, vacuum impacts, and permanently shadowed craters!", "happy");
      }
    }

    this.goToScreen('depth');
  }

  // ==========================================
  // STEP 2: DEPTH SELECTION (STARTER, MIDDLE, ADVANCED)
  // ==========================================
  selectDepth(depth) {
    this.depth = depth;
    window.soundEngine.playSelect();

    const rankLabel = document.getElementById('player-rank');
    if (rankLabel) {
      if (depth === 'starter') rankLabel.textContent = 'RANK: CADET (TIER 1/3)';
      else if (depth === 'middle') rankLabel.textContent = 'RANK: ANALYST (TIER 2/3)';
      else rankLabel.textContent = 'RANK: LEAD INVESTIGATOR (TIER 3/3)';
    }

    const lvlPill = document.getElementById('player-lvl-pill');
    if (lvlPill) {
      if (depth === 'starter') lvlPill.textContent = '★ LVL: CADET';
      else if (depth === 'middle') lvlPill.textContent = '★★ LVL: ANALYST';
      else lvlPill.textContent = '★★★ LVL: LEAD';
    }

    if (this.bb8Bot) {
      if (depth === 'starter') {
        this.bb8Bot.say("BEEP-BEEP! Cadet clearance authorized! 4 foundational missions unlocked on the Case Board!", "chirp");
      } else if (depth === 'middle') {
        this.bb8Bot.say("CHIRP-BOOP! Analyst depth activated! Preparing signal debounce and telemetry decoders!", "curious");
      } else {
        this.bb8Bot.say("TRIILL-WHISTLE! Senior Investigator depth engaged! Master orbital slingshots and memory hex repairs!", "happy");
      }
    }

    this.goToScreen('levels');
  }

  // ==========================================
  // STEP 3: LEVEL TIMELINE (4 LEVELS IN ORDER)
  // ==========================================
  renderLevelsTimeline() {
    const container = document.getElementById('levels-timeline-container');
    const tag = document.getElementById('level-destination-tag');
    const title = document.getElementById('levels-view-title');
    if (!container) return;

    const cases = (window.MISSION_DATABASE[this.destination] && window.MISSION_DATABASE[this.destination][this.depth]) || [];
    const destName = this.destination === 'mars' ? 'MARS' : 'MOONS';
    const depthName = this.depth.toUpperCase();
    const tierOffset = this.depth === 'starter' ? 0 : (this.depth === 'middle' ? 4 : 8);
    const destOffset = this.destination === 'mars' ? 0 : 12;

    if (tag) tag.textContent = `[ ${destName} // [${depthName}] // LEVELS ${tierOffset + 1} TO ${tierOffset + 4} OF 12 ]`;
    if (title) title.textContent = `${destName} [${depthName}]: LEVELS 0${tierOffset + 1} TO ${tierOffset + 4 < 10 ? '0' + (tierOffset + 4) : tierOffset + 4} (OF 12)`;

    const destProgress = this.savedProgress[this.destination] || {};
    const tierProgress = destProgress[this.depth] || { unlocked: 1, solved: [] };

    container.innerHTML = cases.map((c, idx) => {
      const destLevelNum = tierOffset + idx + 1;
      const globalLevelNum = destOffset + destLevelNum;
      const isUnlocked = c.level <= tierProgress.unlocked;
      const isSolved = tierProgress.solved.includes(c.id);

      return `
        <div class="level-row-card ${isUnlocked ? '' : 'locked'}" onclick="${isUnlocked ? `window.gameApp.startLevel('${c.id}')` : ''}">
          <div class="level-num-box">
            <span class="level-num-label">${destName}</span>
            <span class="level-num-digit">${destLevelNum < 10 ? '0' + destLevelNum : destLevelNum}</span>
          </div>

          <div class="level-info">
            <span class="level-codename">${c.codename} // ${destName} MISSION ${destLevelNum}/12 (GLOBAL #${globalLevelNum}/24) // [${depthName}]</span>
            <h3 class="level-title">${c.title}</h3>
            <p class="level-mystery-snippet">"${c.mystery}"</p>
          </div>

          <div class="level-status-col">
            ${isSolved 
              ? `<span class="solved-badge">✓ SOLVED ${c.badgeIcon}</span>` 
              : (isUnlocked 
                ? `<button class="retro-btn sm-btn pulse-btn">OPEN INVESTIGATION ▶</button>` 
                : `<span style="font-family: var(--font-mono); font-size: 11px; color: #64748b;">🔒 CLEAR MISSION 0${destLevelNum - 1}</span>`)}
          </div>
        </div>
      `;
    }).join('');
  }

  // ==========================================
  // STEP 4 & 5: DETECTIVE GAME PAGE
  // ==========================================
  startLevel(caseId) {
    const cases = (window.MISSION_DATABASE[this.destination] && window.MISSION_DATABASE[this.destination][this.depth]) || [];
    this.currentCase = cases.find(c => c.id === caseId);
    if (!this.currentCase) return;

    this.launchCaseInvestigation();
  }

  launchCaseInvestigation() {
    window.soundEngine.playSelect();
    this.selectedHypoId = null;

    const destName = this.destination === 'mars' ? 'MARS' : 'MOONS';
    const tierOffset = this.depth === 'starter' ? 0 : (this.depth === 'middle' ? 4 : 8);
    const destOffset = this.destination === 'mars' ? 0 : 12;
    const destLevelNum = tierOffset + this.currentCase.level;
    const globalLevelNum = destOffset + destLevelNum;

    // Populate briefing
    document.getElementById('game-case-id').textContent = `${this.currentCase.codename} [${destName} L${destLevelNum}/12 • GLOBAL #${globalLevelNum}/24]`;
    document.getElementById('game-target').textContent = this.currentCase.target.toUpperCase();
    document.getElementById('game-date').textContent = this.currentCase.dateRange;
    document.getElementById('game-ending-type').textContent = this.currentCase.endingType.toUpperCase();
    document.getElementById('game-mystery-text').textContent = `"${this.currentCase.mystery}"`;

    // Reset Debrief view
    document.getElementById('game-debrief-view').classList.add('hidden');

    // Init Blueprint Renderer
    if (!this.blueprintRenderer) {
      this.blueprintRenderer = new HardwareBlueprintRenderer('blueprint-canvas', (component) => {
        this.displayComponentDetails(component);
      });
    }
    this.blueprintRenderer.loadCase(this.currentCase);

    // Initial component display
    if (this.currentCase.interactiveComponents.length > 0) {
      this.displayComponentDetails(this.currentCase.interactiveComponents[0]);
    }

    // Populate Clues
    this.populateClues();

    // Populate Hypotheses
    this.populateHypotheses();

    // Switch to first tab (Blueprint)
    this.switchGameTab('blueprint');

    // Go to game screen
    this.goToScreen('game');

    if (this.bb8Bot) {
      this.bb8Bot.say(`CHIRP! Case #${globalLevelNum}: ${this.currentCase.title}! Mystery: ${this.currentCase.mystery}`, "curious");
    }
  }

  displayComponentDetails(comp) {
    if (!comp) return;
    document.getElementById('comp-name').textContent = comp.name.toUpperCase();
    
    const statusEl = document.getElementById('comp-status');
    statusEl.textContent = comp.status;
    statusEl.className = comp.statusType === 'confirmed' ? 'tag-confirmed' : 'tag-suspected';

    document.getElementById('comp-desc').textContent = comp.description;
    document.getElementById('comp-story').textContent = comp.silentStory;

    if (this.bb8Bot) {
      this.bb8Bot.say(`BEEP! Hardware Scan: ${comp.name} [${comp.status}]. ${comp.silentStory}`, "chirp");
    }
  }

  populateClues() {
    const cluesList = this.currentCase.clues || [];
    const countTag = document.getElementById('clues-count-tag');
    if (countTag) countTag.textContent = cluesList.length;

    const grid = document.getElementById('clues-grid');
    if (!grid) return;

    grid.innerHTML = cluesList.map((clue, idx) => `
      <div class="clue-card">
        <div class="clue-header">
          <span class="clue-title">CLUE #${idx + 1}: ${clue.title}</span>
          <span class="${clue.type === 'confirmed' ? 'tag-confirmed' : 'tag-suspected'}">
            ${clue.type.toUpperCase()}
          </span>
        </div>
        <p class="clue-body">${clue.text}</p>
      </div>
    `).join('');
  }

  populateHypotheses() {
    const list = document.getElementById('hypotheses-list');
    if (!list) return;
    this.showHypoFeedback('', 'info');

    list.innerHTML = this.currentCase.hypotheses.map(h => `
      <div class="hypo-card" id="hypo-card-${h.id}" onclick="window.gameApp.selectHypothesis('${h.id}')">
        <span class="hypo-radio" id="hypo-radio-${h.id}">○</span>
        <span class="hypo-text">${h.text}</span>
      </div>
    `).join('');
  }

  selectHypothesis(hypoId) {
    // Options already ruled out by a rejected verdict can't be picked again.
    const picked = document.getElementById(`hypo-card-${hypoId}`);
    if (picked && picked.classList.contains('rejected')) return;
    this.selectedHypoId = hypoId;
    window.soundEngine.playTone(650, 0.04);

    this.currentCase.hypotheses.forEach(h => {
      const card = document.getElementById(`hypo-card-${h.id}`);
      const radio = document.getElementById(`hypo-radio-${h.id}`);
      if (card && radio) {
        if (h.id === hypoId) {
          card.classList.add('selected');
          radio.textContent = '●';
        } else {
          card.classList.remove('selected');
          radio.textContent = '○';
        }
      }
    });
  }

  switchGameTab(tabName) {
    window.soundEngine.playClick();

    const tabs = ['blueprint', 'action', 'clues', 'hypothesis'];
    tabs.forEach(t => {
      const panel = document.getElementById(`game-tab-${t}`);
      const btn = document.getElementById(`tab-btn-${t}`);
      if (panel) panel.classList.add('hidden');
      if (btn) btn.classList.remove('active');
    });

    const activePanel = document.getElementById(`game-tab-${tabName}`);
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);
    if (activePanel) activePanel.classList.remove('hidden');
    if (activeBtn) activeBtn.classList.add('active');

    // Launch Mini-Game if switching to action tab
    if (tabName === 'action' && this.currentCase?.miniGame) {
      this.miniGameManager.launch(this.currentCase.miniGame.type, this.currentCase);
      if (this.bb8Bot) {
        this.bb8Bot.say(`WHEEE! Action Simulator: ${this.currentCase.miniGame.instruction}`, "happy");
      }
    } else {
      this.miniGameManager.stop();
      if (this.bb8Bot) {
        if (tabName === 'clues') {
          this.bb8Bot.say(`CHIRP! Clues Matrix: Review confirmed facts against suspected anomalies!`, "curious");
        } else if (tabName === 'hypothesis') {
          this.bb8Bot.say(`BEEP-WHISTLE! Forensic Verdict: Select the hypothesis supported by telemetry!`, "curious");
        } else if (tabName === 'blueprint') {
          this.bb8Bot.say(`BEEP-BOOP! Hardware Schematic: Tap any glowing subsystem to inspect damage!`, "chirp");
        }
      }
    }

    // Re-render blueprint canvas if switching to blueprint
    if (tabName === 'blueprint' && this.blueprintRenderer) {
      setTimeout(() => this.blueprintRenderer.render(), 50);
    }
  }

  onMiniGameSolved(caseData) {
    if (this.bb8Bot) {
      this.bb8Bot.say(`BEEP-BEEP-HOORAY! Mini-game successfully resolved! Hardware diagnostic green! Now commit your hypothesis!`, "happy");
    }
    setTimeout(() => {
      this.switchGameTab('clues');
    }, 1200);
  }

  // Inline message under the hypothesis list (replaces alert pop-ups).
  showHypoFeedback(html, kind) {
    let box = document.getElementById('hypo-feedback');
    if (!box) {
      box = document.createElement('div');
      box.id = 'hypo-feedback';
      box.className = 'hypo-feedback';
      box.setAttribute('role', 'alert');
      const list = document.getElementById('hypotheses-list');
      if (list) list.insertAdjacentElement('afterend', box);
    }
    box.dataset.kind = kind || 'info';
    box.innerHTML = html;
    box.hidden = !html;
  }

  submitHypothesis() {
    if (!this.selectedHypoId) {
      this.showHypoFeedback('Select a hypothesis first, then submit your verdict.', 'info');
      return;
    }

    const hypo = this.currentCase.hypotheses.find(h => h.id === this.selectedHypoId);
    if (!hypo) return;

    // A wrong verdict doesn't solve the case: explain why, rule that option out,
    // and let the investigator try again. Nothing is unlocked or saved.
    if (!hypo.correct) {
      window.soundEngine.playTone(180, 0.18);
      if (this.bb8Bot) {
        this.bb8Bot.say("BOOP-BZZT! Inconsistent telemetry! Review the hardware clues and re-evaluate your hypothesis!", "curious");
      }
      const card = document.getElementById(`hypo-card-${hypo.id}`);
      if (card) {
        card.classList.remove('selected');
        card.classList.add('rejected');
        card.setAttribute('aria-disabled', 'true');
        const radio = document.getElementById(`hypo-radio-${hypo.id}`);
        if (radio) radio.textContent = '✕';
      }
      this.selectedHypoId = null;
      const why = String(hypo.explanation || '').replace(/^INCORRECT:\s*/i, '');
      const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      this.showHypoFeedback(`<strong>⚠ VERDICT REJECTED.</strong> ${esc(why)} Review the blueprint and evidence, then try another hypothesis.`, 'error');
      return;
    }

    window.soundEngine.playSuccess();
    this.showHypoFeedback('', 'info');
    if (this.bb8Bot) {
      this.bb8Bot.say("WHEEE-CHIRP! Case closed! Hypothesis confirmed! Declassified NASA engineering debrief unlocked!", "happy");
    }

    // Mark as solved in progress for this destination & tier
    const destProgress = this.savedProgress[this.destination] || {};
    const tierProgress = destProgress[this.depth] || { unlocked: 1, solved: [] };

    if (!tierProgress.solved.includes(this.currentCase.id)) {
      tierProgress.solved.push(this.currentCase.id);
    }
    // Unlock next level in this tier
    if (this.currentCase.level >= tierProgress.unlocked) {
      tierProgress.unlocked = Math.min(4, this.currentCase.level + 1);
    }
    this.saveProgress();

    // Re-render tree matrix with updated state
    this.renderTreeMatrix();

    // Populate Historical Debrief
    const debrief = this.currentCase.historicalDebrief;
    const destName = this.destination === 'mars' ? 'MARS' : 'MOONS';
    const tierOffset = this.depth === 'starter' ? 0 : (this.depth === 'middle' ? 4 : 8);
    const destLevelNum = tierOffset + this.currentCase.level;

    document.getElementById('debrief-case-title').textContent = `${destName} MISSION ${destLevelNum}/12 SOLVED: ${this.currentCase.title.toUpperCase()}`;
    document.getElementById('debrief-verdict-tag').textContent = '✓ HISTORICAL VERDICT CONFIRMED';
    document.getElementById('debrief-score-text').textContent = `VERDICT EXPLANATION: ${hypo.explanation}`;

    document.getElementById('debrief-proven').textContent = debrief.whatInvestigatorsProved;
    document.getElementById('debrief-suspected').textContent = debrief.whatRemainsSuspected;
    document.getElementById('debrief-legacy').textContent = debrief.engineeringLegacy;
    document.getElementById('debrief-open').textContent = debrief.openQuestion;

    // Check next mission progression across the 12 levels of this destination and 24 overall
    const cases = (window.MISSION_DATABASE[this.destination] && window.MISSION_DATABASE[this.destination][this.depth]) || [];
    const nextCase = cases.find(c => c.level === this.currentCase.level + 1);
    const nextBtn = document.getElementById('next-level-btn');

    if (nextBtn) {
      if (nextCase) {
        nextBtn.textContent = `PROCEED TO MISSION ${destLevelNum + 1}/12: ${nextCase.codename} ▶`;
        nextBtn.onclick = () => this.startLevel(nextCase.id);
      } else if (this.depth === 'starter') {
        // Jump to Middle Tier Level 1 (Mission 5/12)
        nextBtn.textContent = `PROCEED TO [MIDDLE] MISSION 05/12 (MER-B) ▶`;
        nextBtn.onclick = () => {
          this.depth = 'middle';
          this.startLevel('mars_middle_1');
        };
      } else if (this.depth === 'middle') {
        // Jump to Advanced Tier Level 1 (Mission 9/12)
        nextBtn.textContent = `PROCEED TO [ADVANCED] MISSION 09/12 (MER-B) ▶`;
        nextBtn.onclick = () => {
          this.depth = 'advanced';
          this.startLevel('mars_advanced_1');
        };
      } else if (this.depth === 'advanced' && this.destination === 'mars') {
        // Completed all 12 Mars levels! Transition to Moon
        nextBtn.textContent = `ALL 12 MARS MISSIONS COMPLETED! PROCEED TO MOONS (MISSION 13/24) ▶`;
        nextBtn.onclick = () => {
          this.destination = 'moon';
          this.depth = 'starter';
          this.startLevel('moon_starter_1');
        };
      } else {
        nextBtn.textContent = `ALL 24 FORENSIC SPACE MISSIONS SOLVED! 🏆 CHIEF FLIGHT DIRECTOR`;
        nextBtn.onclick = () => this.goToScreen('tree');
      }
    }

    // Show debrief modal
    const debriefEl = document.getElementById('game-debrief-view');
    debriefEl.classList.remove('hidden');
    debriefEl.scrollIntoView({ behavior: 'smooth' });
  }

  nextLevel() {
    // Handled dynamically in submitHypothesis nextBtn.onclick
  }

  // ==========================================
  // BACKGROUND RETRO STARFIELD (EXPANDED 260+ STARS, GLOWING CROSS STARS & METEORS)
  // ==========================================
  initStarfield() {
    const canvas = document.getElementById('starfield-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // 1. Layered Background Stars (240 micro and mid stars)
    const stars = [];
    for (let i = 0; i < 240; i++) {
      const layer = Math.random();
      let size, speed, color;
      if (layer < 0.6) {
        // Distant micro-stars
        size = 1;
        speed = Math.random() * 0.25 + 0.08;
        color = 'rgba(196, 181, 253, '; // soft lavender
      } else if (layer < 0.9) {
        // Mid-field stars
        size = 2;
        speed = Math.random() * 0.5 + 0.25;
        color = 'rgba(147, 197, 253, '; // light blue
      } else {
        // Near bright stars
        size = 2.5;
        speed = Math.random() * 0.8 + 0.5;
        color = 'rgba(255, 255, 255, '; // white
      }
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size,
        speed,
        color,
        alpha: Math.random() * 0.7 + 0.2,
        dAlpha: (Math.random() - 0.5) * 0.02
      });
    }

    // 2. Pixel Glowing Cross Stars (✦ style in cyan, magenta, gold, purple)
    const crossStars = [];
    const crossColors = ['#00f0ff', '#d946ef', '#facc15', '#c084fc', '#ffffff'];
    for (let i = 0; i < 28; i++) {
      crossStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: Math.random() * 0.2 + 0.05,
        color: crossColors[Math.floor(Math.random() * crossColors.length)],
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.03 + 0.015,
        armLen: Math.random() > 0.5 ? 3 : 2
      });
    }

    // 3. Dynamic Meteors / Shooting Stars
    const meteors = [];
    let meteorCooldown = 80;

    const spawnMeteor = () => {
      const startFromTop = Math.random() > 0.4;
      const startX = startFromTop ? Math.random() * canvas.width : -40;
      const startY = startFromTop ? -20 : Math.random() * (canvas.height * 0.45);
      const angle = (Math.PI / 6) + (Math.random() * 0.3); // 30° to 48° downward angle
      const speed = Math.random() * 7 + 9; // fast streak

      meteors.push({
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        trail: [],
        maxTrail: Math.floor(Math.random() * 10 + 16),
        headColor: Math.random() > 0.3 ? '#ffffff' : '#67e8f9',
        bodyColor: Math.random() > 0.5 ? '#00f0ff' : '#d946ef',
        life: 1.0,
        decay: Math.random() * 0.015 + 0.012
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep space space backdrop
      ctx.fillStyle = '#05020d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Render standard stars
      stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
        s.alpha += s.dAlpha;
        if (s.alpha > 0.95 || s.alpha < 0.2) s.dAlpha = -s.dAlpha;

        ctx.fillStyle = `${s.color}${Math.max(0.15, s.alpha)})`;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Render pixel glowing cross stars
      crossStars.forEach(cs => {
        cs.y += cs.speed;
        if (cs.y > canvas.height) {
          cs.y = 0;
          cs.x = Math.random() * canvas.width;
        }
        cs.phase += cs.phaseSpeed;
        const pulse = (Math.sin(cs.phase) + 1) * 0.5; // 0 to 1
        const alpha = 0.35 + pulse * 0.65;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = cs.color;

        // Center pixel
        ctx.fillRect(cs.x, cs.y, 2, 2);

        // Cardinal arms (✦)
        const arm = cs.armLen;
        ctx.fillRect(cs.x - arm, cs.y, arm, 2); // left
        ctx.fillRect(cs.x + 2, cs.y, arm, 2);   // right
        ctx.fillRect(cs.x, cs.y - arm, 2, arm); // top
        ctx.fillRect(cs.x, cs.y + 2, 2, arm);   // bottom

        // Extra twinkle diagonal pixels when at peak brightness
        if (pulse > 0.75) {
          ctx.fillRect(cs.x - 1, cs.y - 1, 1, 1);
          ctx.fillRect(cs.x + 2, cs.y - 1, 1, 1);
          ctx.fillRect(cs.x - 1, cs.y + 2, 1, 1);
          ctx.fillRect(cs.x + 2, cs.y + 2, 1, 1);
        }

        ctx.restore();
      });

      // Spawn meteors periodically
      meteorCooldown--;
      if (meteorCooldown <= 0) {
        spawnMeteor();
        meteorCooldown = Math.floor(Math.random() * 110 + 60); // every 1.0 to 3.0 seconds
      }

      // Update & render meteors
      for (let mIdx = meteors.length - 1; mIdx >= 0; mIdx--) {
        const m = meteors[mIdx];

        // Store trail point
        m.trail.unshift({ x: m.x, y: m.y });
        if (m.trail.length > m.maxTrail) m.trail.pop();

        m.x += m.vx;
        m.y += m.vy;
        m.life -= m.decay;

        // Draw meteor trail
        for (let t = 0; t < m.trail.length; t++) {
          const pt = m.trail[t];
          const trailProgress = t / m.trail.length; // 0 at head, 1 at tail
          const trailAlpha = (1 - trailProgress) * m.life;
          const trailSize = Math.max(1, 3.5 * (1 - trailProgress * 0.7));

          ctx.save();
          ctx.globalAlpha = trailAlpha;
          ctx.fillStyle = t < 2 ? m.headColor : m.bodyColor;
          ctx.fillRect(pt.x, pt.y, trailSize, trailSize);
          ctx.restore();
        }

        // Draw glowing meteor head
        ctx.save();
        ctx.globalAlpha = m.life;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(m.x - 1, m.y - 1, 4, 4);
        ctx.fillStyle = m.headColor;
        ctx.fillRect(m.x - 2, m.y - 2, 6, 6);
        ctx.restore();

        // Check if meteor expired or offscreen
        if (m.life <= 0 || m.x > canvas.width + 100 || m.y > canvas.height + 100) {
          meteors.splice(mIdx, 1);
        }
      }

      requestAnimationFrame(draw);
    };

    draw();
  }
}

// Start application when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new SpaceLegacyApp();
});
