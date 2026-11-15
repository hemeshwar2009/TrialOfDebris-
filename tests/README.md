# Tests

End-to-end browser tests (Puppeteer + Chrome). They run against the live site or a local copy.

```bash
npm i puppeteer-core@23.11.1
node tests/loss-test.js https://hemeshwar2009.github.io/TrialOfDebris-/
```

Pass the site URL as the first argument (default `http://localhost:5180/`). Set `CHROME_PATH` if Chrome isn't installed at the default Windows location.

| File | What it checks | Last result (live site) |
|---|---|---|
| `auth-test.js` | Accounts: sign-up validation, password login, passkeys (Chrome virtual authenticator), session bridge, logout, username/password change, data isolation, admin lock, replay protection. Needs `TD_TEST_EMAIL` / `TD_TEST_PASSWORD` for a verified test account with username `td_test_alpha`. | 43/43 |
| `loss-test.js` | All 12 mini-games reach their losing condition and show the "Mission lost" pop-up (science + real mission + tip); Try again, Review evidence, countdowns, winning a timed game, leaving a case stops the timer. | 35/35 |
| `ux-test.js` | HELIX-7 doesn't block buttons, smaller droid on narrow screens, chat box auto-hide/close behaviour, drag, no sideways scroll, all 24 cases open. | 16/16 |
| `verdict-test.js` | Wrong verdicts are rejected without solving or unlocking; correct verdicts solve — across all 24 cases. | 9/9 |
| `orbit-test.js` | Orbit capture starts off-target, firing untouched loses, tuning wins. | 8/8 |

Note: these tests create anonymous guest players in Supabase (harmless; they hold only test progress).
