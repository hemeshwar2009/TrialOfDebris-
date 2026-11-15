# AFTERLIGHT: NASA Space Legacy Forensic Archive

A declassified spacecraft forensic investigation platform designed in the retro CRT aesthetic of **AFTERLIGHT (NASA Space Apps Challenge 2026: Abandoned But Not Forgotten)**.

**▶ Play it live:** https://hemeshwar2009.github.io/TrialOfDebris-/

---

## 🎨 Visual Theme & Typography (Afterlight Aesthetic)

Matches the retro cybernetic pixel interface from the mission briefing specification:

* **Typography**:
  * **Pixel Display Font**: `'Press Start 2P', monospace` — Headers, status badges, buttons, active tabs, and mission codenames.
  * **Pixel Monospace Accents**: `'Silkscreen', monospace` — Subtitles, badges, and hardware status indicators.
  * **Tabular Terminal Monospace**: `'Share Tech Mono', monospace` — Narrative prose, telemetry records, investigative clues, debrief logs, and instrument readouts with `font-variant-numeric: tabular-nums lining-nums;` ensuring zero mismatch between letters and numerals.
* **Palette**:
  * **Void Cosmic Black**: `#030108` and `#070314`
  * **Cyber Indigo/Purple Borders**: `#582cd1`, `#3b2c85`, and glowing `#7c3aed`
  * **Active Tab Indigo**: `#2d2482` with crisp white/cyan pixel borders
  * **Electric Cyan Accents**: `#00f0ff` / `#22d3ee` (challenge badges and mystery text)
  * **Amber & Green Statuses**: `#facc15` (`▲ OFFLINE`), `#22c55e` (`★ LVL: CADET`)
* **Signature Design Elements**:
  * Glowing double-line container frames with dashed internal guidelines
  * Retro CRT horizontal scanlines and high-contrast toggle support
  * Animated background canvas with 260+ parallax stars, pulsing 4-point glowing cross stars (`✦`), and animated shooting meteors with multi-particle fading trails
  * Authentic 80s block tabs: `[ MISSION BRIEFING ]`, `[ CASE BOARD (24) ]`, `[ MISSION TREE ]`, `[ CLEARANCE DEPTH ]`
  * 3 Foundation Principle Cards: `1. REAL FACTS, GAME WRAPPER`, `2. ONE CASE, THREE DEPTHS`, `3. CONFIRMED VS. SUSPECTED`

---

## 🌟 24 Completely Unique Missions (12 Mars + 12 Moon)

```
                            🏆 24 TOTAL UNIQUE MISSIONS
              ┌───────────────────────────┴───────────────────────────┐
              ▼                                                       ▼
    🔴 MARS (12 Unique Levels)                              🌕 MOONS (12 Unique Levels)
 ├── [STARTER] (Levels 01 - 04)                          ├── [STARTER] (Levels 01 - 04 // Global #13-16)
 │   01. Opportunity (Dust Storm Silence)                │   01. Apollo 13 (Cryo O2 Tank Detonation)
 │   02. Mars Climate Orbiter (Imperial/Metric Math)     │   02. LCROSS (Centaur Cabeus Kinetic Plume)
 │   03. Mars Polar Lander (Leg Sensor Bounce)           │   03. Surveyor 2 (Vernier Valve Death Spin)
 │   04. Spirit Rover (Troy Sand Trap & Jammed Wheel)    │   04. Apollo 11 (1202 AGC Alarm & Boulder Field)
 │                                                       │
 ├── [MIDDLE] (Levels 05 - 08)                           ├── [MIDDLE] (Levels 05 - 08 // Global #17-20)
 │   05. Mars Global Surveyor (Radiator Solar Bake)      │   05. Surveyor 4 (Instant Dropout at T-2.5s)
 │   06. Pathfinder & Sojourner (Mutex Priority Bug)     │   06. Lunar Prospector (Polar Crater Crash)
 │   07. Deep Space 2 (30,000-G Penetrator Silence)      │   07. Apollo 12 (Lightning Strike & SCE to AUX)
 │   08. Phoenix Lander (Crushed by CO2 Winter Ice)      │   08. Ranger 7 (First Photos Before Impact)
 │                                                       │
 └── [ADVANCED] (Levels 09 - 12)                         └── [ADVANCED] (Levels 09 - 12 // Global #21-24)
     09. InSight Lander (Dust Starvation & Jammed Mole)      09. Lunar Orbiter 1 (Earthrise & Far Side Deorbit)
     10. Mariner 4 (6-mb Atmosphere & Meteor Shower)         10. Apollo 14 (Phantom Abort Bit Solder Hack)
     11. Mariner 9 (Global Dust Storm & Giant Calderas)      11. LADEE (Levitating Dust Exosphere)
     12. Curiosity (Ventifact Wheel Gashes & Drill Short)    12. Clementine (Polar Ice & Thruster Runaway)
```

---

## 🕹️ Interactive Features
1. **Interactive Hardware Blueprint Canvas**: Clickable glowing vector schematics of rovers, orbiters, and landers to inspect damaged hardware.
2. **12 Engaging Retro Action Spacecraft & Space Mystery Games**:
   * *Lunar Module 2D Powered Descent* (`lunar_lander`): 2D physics lander with gravity, main thruster flame plume, RCS attitude tilt, and touchdown pad velocity meters (Apollo 11, Surveyor 2).
   * *Micrometeorite Storm & Debris Dodge* (`asteroid_dodge`): Steer deep space probe through tumbling asteroids and collect 5 science telemetry data packets with EM deflector shield pulse (Mariner 4, Deep Space 2).
   * *Planetary Gravity Capture & Slingshot* (`orbital_slingshot`): Astrodynamics simulator: adjust approach angle and liquid retro-burn $\Delta V$ to achieve orbital capture into target science corridor (Mariner 9, Lunar Orbiter 1).
   * *Martian Surface Hazard Drive* (`rover_drive`): Top-down rover driving with wheel tracks, avoiding soft sulfate sinking sand traps and sharp ventifact basalt boulders to reach the solar ridge (Spirit, Curiosity).
   * *Avionics Jumper Breadboard Wire Patch* (`circuit_patch`): Connect color-coded jumper patch cables between essential power buses, watchdog clocks, and mutex bypass relays to stop reboot loops (Pathfinder & Sojourner, InSight, Apollo 12).
   * *Hexadecimal Memory Parity Unscrambler* (`memory_decrypt`): Cyber forensic EEPROM editor: cycle and align corrupted hex registers to fix radiation bit-flips and pass 16-bit CRC checksum verification (Mars Global Surveyor, Apollo 14, Clementine).
   * *CRT Oscilloscope RF Carrier Tuner* (`radio_tuner`): Dual-trace green phosphor CRT oscilloscope: tune frequency and phase offset sliders to lock onto faint deep space telemetry carrier waveforms (Ranger 7, LADEE).
   * *Martian Dust Storm & Solar Harvest* (`sun_hunter`): Tilt solar panels toward sporadic sunbeams while clearing dust buildup before battery power hits zero (Opportunity).
   * *Metric vs. Imperial Units Calibrator* (`unit_converter`): Spot and convert mismatched imperial ($lbf \cdot s$) values into SI metric ($N \cdot s$) before high atmospheric burnup (Mars Climate Orbiter).
   * *Descent Radar False Jolt Debounce* (`touchdown_sensor`): Filter out false landing leg deployment microswitch noise spikes before the computer shuts down engines prematurely (Mars Polar Lander, Surveyor 4).
   * *Command Module Lifeboat Power Balancer* (`lifeboat_power`): Route essential systems and manage the critical 15.0-Amp emergency power budget without overloading silver-zinc batteries (Apollo 13).
   * *Near-Infrared Plume Spectrometer Ice Hunter* (`spectrometer_hunter`): Tune spectrometer wavelength to lock onto water ice ($1.45\,\mu m$ and $1.95\,\mu m$) molecular absorption troughs in impact plumes and polar craters (Phoenix, LCROSS, Lunar Prospector).
3. **Opening Title Screen & Authentication Portal**:
   * *Centered Hero "TrailOfDebris" Opening Page*: Bold animated typography in retro pixel font with an orbital corner trajectory where broken space hardware (solar array shards, severed antenna masts, silicon wafers, hex bolts) tumble along a glowing gradient comet tail.
   * *Connected Entry Points*:
     - Primary `⬡ CLICK TO ENTER ▶` button, pressing the `[ENTER]` key, or clicking directly on the hero logo card connects immediately to the main project page (`screen-destination`).
     - `🔑 OPERATOR LOGIN` button opens the authentication card.
   * *Interactive Login Card*: Security clearance authentication portal with email/passphrase entry, "Continue as Guest Account" option, and "Click to Enter Main Page Directly" button. Submitting credentials, continuing as guest, or clicking direct entry routes straight to the main mission briefing console.
   * *(Note: Mascot avatar is hidden on the Opening Page and Login Page, only appearing once authorized into the main archive).*

4. **Interactive 3D Three.js Droid Mascot: "HELIX-7"**:
   * *Original Retro-Futuristic Character*: Rendered into a 150×180 px transparent WebGL canvas fixed in the bottom-right corner.
   * *Body & Thruster*: Glossy white capsule (`MeshStandardMaterial`), violet waist ring torus (`#8b5cf6`), front pink glowing chest light (`#f472b6`), dual dark vent slots, and an amber cone thruster (`#fbbf24`) that flickers by randomly scaling its height.
   * *Head & Visor*: White sphere with violet equator band, dark glossy visor (`#0f172a`), disc ears, antenna with pulsing pink tip, and ONE big glowing cyan eye (`#22d3ee`) with violet ring and highlight pupil dot.
   * *Orbiting Blinking Stars*: A dynamic system of 20 3D four-pointed sparkle stars (diamond white, electric cyan, hot pink, golden yellow, and mystic violet) revolving around the droid at various orbital radii and inclinations, continuously blinking and twinkling in luminescence and scale.
   * *Dynamic Animations & Behaviors*:
     - Smooth idle floating bob and side-to-side sway.
     - Smooth head yaw/pitch mouse pointer tracking across the screen.
     - Periodic organic eye blinks every 3-5 seconds.
     - Talking mode: eye pulses brightly and orbiting stars accelerate their orbits and sparkle with heightened luminescence.
     - Click interaction: happy jump-and-spin celebration triggering synthesized audio chirps and the holographic chat terminal.
     - **Click & Drag Anywhere Across Screen**: Click and hold the mouse on the bot avatar or chatbox to drag it anywhere across the entire viewport. Releasing the mouse button drops and anchors the chatbot at that exact spot!
     - **Adaptive Hologram Orientation**: When placed near the left edge or top of the screen, the holographic speech box automatically adapts its orientation (`dock-left`, `dock-top`) so dialogs never clip outside the viewport.
     - **Cursor Follow Companion Mode (Double-Click)**: Double-clicking the bot mascot activates autonomous cursor-following float mode! Double-clicking again gently docks it back to base.
     - Full disposal lifecycle, capped DPR at 2, and `prefers-reduced-motion` compliance.

5. **Live Progress Tracking**:
   * Status pill displays: `★ 24 LEVELS: X / 24 SOLVED`.
   * Sequential unlock: clearing each mission unlocks the next throughout the 24-level campaign.

---

## ☁️ Cloud Save (Supabase)

Mission progress syncs to the **TrialOfDebris** Supabase project, so it survives clearing the browser's storage.

* Visitors can play straight away as a **guest** (anonymous session — no account needed), or **create an account** to keep progress across devices.
* Solved missions are stored in the `player_progress` table, one row per player. **Row-level security** lets each player read and write only their own row.
* The browser's `localStorage` stays as an offline fallback — the game plays the same if Supabase can't be reached.
* The header pill shows the status: `☁ CLOUD: CONNECTING`, `☁ CLOUD: SAVED` or `☁ CLOUD: OFFLINE`.

Files:
* [`js/cloud-sync.js`](js/cloud-sync.js) — the Supabase connection. It uses the project's **publishable** key, which is safe in a browser because access is limited by row-level security.
* [`supabase/player_progress.sql`](supabase/player_progress.sql) — creates the table and policies. To set up a fresh project, run it in the Supabase SQL Editor and turn on **Authentication → Sign In / Providers → Allow anonymous sign-ins**.

### 🔐 Accounts & Passkeys

**Operator Login** is a real account system built on Supabase Auth:

* **Create an account** with a username, email and password (verified by email). Usernames and emails are unique.
* **Log in** with email + password ("remember me", forgot/reset password), or with a **passkey** — Face ID, Windows Hello, fingerprint or device PIN. Passkeys are verified on the server by the `td-auth` Edge Function; **no face or fingerprint data ever leaves the player's device**.
* A guest's progress carries into their new account the first time they log in on that browser.
* The **👤 account panel** lets players change their username and password, add or remove passkeys, log out, or delete their account.
* **Administrators** get a 🛡 admin console with player stats and can suspend, restore or delete accounts. Admin rights are granted only by the project owner in SQL.

Full setup, security design, test results and browser support: **[docs/ACCOUNTS.md](docs/ACCOUNTS.md)**.

---

## 🚀 How to Run

**Easiest:** open the live site — https://hemeshwar2009.github.io/TrialOfDebris-/

**Locally:** no build step or installation. Serve the folder with any static web server, for example:

```bash
npx http-server . -p 8080
```

then open http://localhost:8080. (Double-clicking `index.html` also works in most browsers.)

An internet connection is needed for the pixel fonts, three.js (HELIX-7) and Supabase cloud save. If Supabase can't be reached, progress is still saved in the browser and the pill shows `☁ CLOUD: OFFLINE`.

## 🌐 Deploying

GitHub Pages serves the `gh-pages` branch. After updating the site, push to both `main` and `gh-pages`.
