# AFTERLIGHT: NASA Space Legacy Forensic Archive

A declassified spacecraft forensic investigation platform designed in the retro CRT aesthetic of **AFTERLIGHT (NASA Space Apps Challenge 2026: Abandoned But Not Forgotten)**.

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
3. **Interactive Corner BB-8 Astromech Bot with Flashlight Holo-Projector**:
   * *Authentic Spherical Droid*: Rendered with dual-layer SVG (independent rotating dome head with antennas & glowing optical photoreceptor eyes, and rollable orange/silver circular tool-bay spherical chassis).
   * *Cute Animations on Block Shifts*: When screens, tabs, destinations, or clearance depths change, BB-8 playfully bobs, rolls its chassis, tilts its head with curiosity, and blinks its status LEDs.
   * *Flashlight Beam Hologram Projector*: Flickers on with an authentic optical switch beam cone illuminating the dialogue terminal.
   * *Retro Typewriter Terminal Dialog*: Types out contextual detective observations, mission mysteries, and forensic clues character-by-character accompanied by synthesized astromech chirps and keyboard blips.
   * *Playable Interaction*: Clicking BB-8 makes it jump and do a happy celebration spin while sharing declassified NASA lore and easter eggs!
4. **Live Progress Tracking**:
   * Status pill displays: `★ 24 LEVELS: X / 24 SOLVED`.
   * Sequential unlock: clearing each mission unlocks the next throughout the 24-level campaign.

---

## 🚀 How to Run

Double-click `index.html` to open in any web browser. Completely offline, zero dependencies, no installation required.
