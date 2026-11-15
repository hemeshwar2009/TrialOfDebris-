# Accounts: email/password + passkeys (Face ID · Windows Hello · fingerprint · PIN)

Trail of Debris supports three kinds of players:

| Player | How they get in | Progress |
|---|---|---|
| **Guest** | "Click to Enter" / "Continue as guest" — anonymous Supabase session, no sign-up | Saved to the cloud for this browser |
| **Member (password)** | Create account → verify email → log in with email + password | Saved to their account, on any device |
| **Member (passkey)** | After logging in once, "Set up passkey" → next time "Login with Face ID / Passkey" | Same account |

A guest who creates an account and logs in on the same browser keeps their guest progress — it is merged into the account.

**No biometric data is ever collected or stored.** Face ID / Windows Hello / fingerprint checks happen on the player's device. The site only stores the passkey's *public key* and a signature counter.

---

## How it fits together

```
Browser (js/auth.js)                         Supabase
─────────────────────                        ───────────────────────────────────────────
Email + password  ───────────────────────►   Supabase Auth (sign-up, verify email, login,
                                             reset password, sessions)

Passkey login:                               Edge Function  td-auth  (Deno)
 1. login-options  ─────────────────────►     generate challenge (single-use, 5 min) → DB
 2. navigator.credentials.get()  (device does Face ID / PIN)
 3. login-verify  ──────────────────────►     verify signature, origin, RP ID, challenge,
                                              counter; then mint one-time magic-link token
 4. supabase.auth.verifyOtp(token) ─────►   Supabase Auth → real session (JWT)

Passkey setup / account / admin ────────►   td-auth checks the caller's JWT on every call
Progress, profile, passkey list ────────►   PostgreSQL with Row Level Security
```

The passkey → session bridge never trusts the browser: a session is only issued after the server verifies the WebAuthn assertion. The browser never sees the service-role key.

## Files

| File | What it does |
|---|---|
| `js/auth.js` | Login, register, verify-email, forgot/reset password, passkey setup + login, account panel, admin console |
| `js/cloud-sync.js` | Shared Supabase client ("remember me" storage), guest sessions, progress sync |
| `css/auth.css` | Styles for the auth screens and panels |
| `supabase/player_progress.sql` | Original progress table (run first) |
| `supabase/002_accounts_passkeys_admin.sql` | Profiles, passkeys, challenges, progress columns, admin RPCs, RLS, triggers |
| `supabase/functions/td-auth/index.ts` | Edge Function: passkey ceremonies, session bridge, account deletion, admin actions |

Libraries (loaded from CDNs, pinned): `@supabase/supabase-js@2.45.4`, `@simplewebauthn/browser@13.3.0`; server: `@simplewebauthn/server@13.3.2`, `@supabase/supabase-js@2.52.1` (npm specifiers in the Edge Function). No build step or `npm install` is needed for the site.

## Database (summary)

- **`profiles`** — one row per user (guests too). `username` is unique (case-insensitive) and 3–20 letters/numbers/underscores. Created automatically by a trigger on `auth.users`. Players can update only `username` and `avatar_url`; `role` can only be changed with SQL by the project owner.
- **`passkey_credentials`** — `credential_id`, `public_key`, `counter`, `transports`, device type, nickname, `created_at`, `last_used_at`. Players can list and delete their own; only the Edge Function can add them.
- **`webauthn_challenges`** — short-lived, single-use challenges. Server only.
- **`player_progress`** — existing table, extended with `achievements`, `scores`, `preferences`.
- **RLS** is on for every table. Admins read everything through `SECURITY DEFINER` functions (`admin_stats`, `admin_list_users`) that check `is_admin()` first.

---

## Setup / redeploy from scratch

1. **Database** — Supabase → SQL Editor, run in order:
   1. `supabase/player_progress.sql`
   2. `supabase/002_accounts_passkeys_admin.sql`
2. **Auth settings** — Authentication →
   - *Sign In / Providers*: **Allow new users to sign up** ON, **Confirm email** ON, **Allow anonymous sign-ins** ON (guests).
   - *URL Configuration*: **Site URL** = `https://hemeshwar2009.github.io/TrialOfDebris-/`; **Redirect URLs**: `https://hemeshwar2009.github.io/TrialOfDebris-/**` (+ `http://localhost:5180/**` for local testing).
   - *Emails → SMTP Settings*: **set up custom SMTP** (see below — required for real players).
   - *Attack Protection*: consider enabling CAPTCHA for sign-ups and anonymous sign-ins.
3. **Edge Function** — Edge Functions → Deploy a new function → name `td-auth` → paste `supabase/functions/td-auth/index.ts` → Deploy. Then open its **Settings** and turn **Verify JWT OFF** (passkey login runs before the user has a session; the function verifies tokens itself for everything else). Or with the CLI:
   ```bash
   supabase functions deploy td-auth --no-verify-jwt --project-ref qlocjvakgyngzilvveap
   ```
   Environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge Functions automatically — **never** put the service-role key in the site.
4. **Allowed sites for passkeys** — edit `ALLOWED_ORIGINS` at the top of `index.ts` if the site moves to a new domain. Passkeys are bound to the domain: ones created on `localhost` only work on `localhost`.
5. **Site config** — `js/cloud-sync.js` holds the project URL and the **publishable** key (safe in a browser).
6. **Deploy the site** — push to `main` **and** `gh-pages` (GitHub Pages serves `gh-pages`).

### Make yourself an administrator

Admins can see platform stats and suspend/restore/delete user accounts. Roles can only be granted by the project owner, in the SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

Log out and back in; a **🛡 ADMIN** button appears in the header. Admins can't suspend or delete other admins or themselves from the UI. To remove admin: `set role = 'user'`.

### Email (important)

Supabase's built-in email sender is for testing only: it is **rate-limited to a few emails per hour** for the whole project. During testing it delivered one verification email and then returned "email rate limit exceeded". Before real players sign up, connect an email provider (e.g. Resend, Postmark, SendGrid, Brevo, Amazon SES) under **Authentication → Emails → SMTP Settings**, then raise the limit under **Authentication → Rate Limits**. Until then, sign-up, verification and password-reset emails may not arrive.

---

## Testing

An automated end-to-end suite ([`tests/auth-test.js`](../tests/auth-test.js), Puppeteer + Chrome's virtual WebAuthn authenticator) was run against the real Supabase project. Result: **43/43 passed**, covering:

- guest session + cloud save; login screen; password show/hide
- registration validation: invalid email, weak password, mismatched passwords, duplicate username (live and on submit)
- wrong password rejected; correct password → passkey setup offered
- passkey registration (device 1) → game; logout → fresh guest with no member data
- **passkey login → real Supabase session**; progress restored; session remembered after reload
- second passkey on device 2; both listed; same-device duplicate refused; removing one; removed passkey can't log in
- username change / invalid username; password change requires current password; old password stops working, new works
- forgot password shows a neutral message (no account discovery)
- data isolation: another user sees only their own profile/progress, no passkeys; can't insert passkeys, can't self-promote to admin, can't call admin RPCs or admin actions; challenges table is server-only
- simultaneous players don't share progress
- passkey button disabled with a fallback hint on browsers without WebAuthn
- replayed challenge refused

The same 43 checks also passed against the **live GitHub Pages site** (passkeys bound to `hemeshwar2009.github.io`), plus: all 24 cases and mini-games still open; a guest's progress carries into their account on login; account deletion requires typing DELETE, removes the account and its data, and the deleted account can no longer log in; no JavaScript errors.

Also verified by hand: real verification email arrives and its link activates the account; the trigger creates the profile with the chosen username.

**Not yet tested** (needs the owner's action): the admin console end-to-end (grant yourself admin first), and email flows at volume (needs custom SMTP).

### Manual test checklist

1. Open the site → **Click to Enter** → play a case (guest).
2. **🔑 LOG IN / SIGN UP** → **Create account** → verify via the email link → you land back on the site logged in → **Set up passkey** (Face ID / Windows Hello / fingerprint / PIN).
3. Your guest progress is now in your account. **👤 your name → Log out**.
4. **Login with Face ID / Passkey** → you're back with your progress.
5. Try **Forgot password?**, change username and password in the account panel, add/remove passkeys, delete a test account.
6. Grant yourself admin (SQL above) → **🛡 ADMIN** → stats, user list, suspend/restore.

## Browser and device support

- Passkeys need a modern browser: Chrome/Edge 108+, Safari 16+, Firefox 122+ (Windows Hello, Touch ID / Face ID, Android fingerprint, or a phone via QR code).
- The site must be served over **HTTPS** (GitHub Pages is) — or `localhost` for development.
- Passkeys belong to the domain they were created on. If the game moves to a new domain, players must set up a new passkey there (password login still works).
- In-app browsers (e.g. inside some social apps) and older browsers may not offer passkeys; the button is disabled with a hint and email/password still works.
- Synced passkeys (iCloud Keychain, Google Password Manager) work across a player's devices automatically.
- "Remember me" off keeps the session only until the tab closes.
