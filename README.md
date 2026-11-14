# Trail of Debris — AFTERLIGHT Forensic Archive

A retro arcade investigation game built for the **NASA Space Apps Challenge 2026** (*Abandoned But Not Forgotten*). Players reopen the case files of 24 real NASA Mars and Moon missions, inspect the hardware, play a short mini-game, and commit to a hypothesis about why each spacecraft went quiet.

**▶ Play it live:** https://hemeshwar2009.github.io/TrialOfDebris-/

---

## How it works

1. **Start screen** — click **CLICK TO ENTER** (or press Enter) to go straight in as a guest, or open **OPERATOR LOGIN**.
2. **Mission Briefing** — pick a destination: **Mars** or the **Moon** (12 missions each).
3. **Clearance Depth** — choose **Starter**, **Middle** or **Advanced** (4 missions per tier). The same case is written for school students, college analysts and lead researchers.
4. **Case file** — click glowing parts on the hardware blueprint to collect clues, play the case's mini-game, then pick the hypothesis that best explains the failure.
5. **Debrief** — see what actually happened and what NASA learned. Solving a case unlocks the next one in that tier.

Other tabs: **Case Board (24)** lists every case; **Mission Tree Matrix** shows progress across all tiers.

### HELIX-7, the guide droid
An original 3D droid (three.js) floats in the corner. It tracks the mouse, reacts when you change screens, and types out hints and mission lore in its forensic log. Click it for a tip; double-click to make it follow the cursor.

### 12 mini-games
Lunar descent, debris dodge, gravity capture, rover hazard drive, avionics wire patch, memory parity repair, radio carrier tuner, solar dust harvest, metric/imperial converter, touchdown-sensor debounce, Apollo 13 power balancing, and an ice-hunting spectrometer.

### Missions
| Mars | Moon |
|---|---|
| Opportunity, Mars Climate Orbiter, Mars Polar Lander, Spirit | Apollo 13, LCROSS, Surveyor 2, Apollo 11 |
| Mars Global Surveyor, Pathfinder & Sojourner, Deep Space 2, Phoenix | Surveyor 4, Lunar Prospector, Apollo 12, Ranger 7 |
| InSight, Mariner 4, Mariner 9, Curiosity | Lunar Orbiter 1, Apollo 14, LADEE, Clementine |

---

## Cloud save (Supabase)

Progress syncs to the **TrialOfDebris** Supabase project, so it survives clearing the browser's storage.

- Each visitor is signed in **anonymously** (no account or password needed).
- Solved missions are stored in the `player_progress` table, one row per player. **Row-level security** lets a player read and write only their own row.
- The browser's `localStorage` is kept as an offline fallback — the game works the same if Supabase can't be reached.
- The header pill shows the status: `☁ CLOUD: CONNECTING`, `SAVED` or `OFFLINE`.

Files:
- [`js/cloud-sync.js`](js/cloud-sync.js) — the Supabase connection (uses the project's publishable key, which is safe in a browser because access is limited by RLS).
- [`supabase/player_progress.sql`](supabase/player_progress.sql) — creates the table and policies. Run it in the Supabase SQL Editor and turn on **Authentication → Sign In / Providers → Allow anonymous sign-ins**.

> The **Operator Login** card is a themed entry screen: the name typed there is shown in the header, but it does not create a Supabase account. Saving works the same for guests and operators.

---

## Run it locally

No build step and no install. Serve the folder with any static web server, for example:

```bash
npx http-server . -p 8080
```

then open http://localhost:8080. An internet connection is needed for the fonts, three.js, the Supabase library and cloud save.

## Project structure

```
index.html              Screens, header and script tags
css/retro-theme.css     CRT / pixel-art theme
js/app.js               Screen flow, progress, case logic
js/cases-data.js        The 24 mission case files
js/minigames.js         The 12 mini-games
js/hardware-renderer.js Clickable hardware blueprints
js/helix7-mascot.js     HELIX-7 3D droid (three.js r128)
js/audio.js             8-bit sound effects
js/cloud-sync.js        Supabase cloud save
supabase/               Database setup SQL
```

## Deploying

GitHub Pages serves the `gh-pages` branch. After changing the site, push to both `main` and `gh-pages`.

## Built with
Vanilla HTML, CSS and JavaScript · three.js r128 · Supabase (auth + Postgres) · Press Start 2P, Silkscreen and Share Tech Mono fonts

Mission facts come from NASA mission records. The game wraps real history in an investigator story and never invents causes.
