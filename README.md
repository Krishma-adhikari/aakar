# Aakar (आकार)

Aakar connects Nepal with the Nepali diaspora on one verified platform. Investors back startups, professionals mentor students, and organizations post tech challenges that engineers can answer.

## Features

- **Five roles:** investor, startup, student, professional and organization, each with its own home page.
- **Admin verification:** every member is reviewed before they can use the app. A rejected member can apply again with the same email.
- **Invest in Nepal:** startup listings, pitches, a watchlist and direct chat.
- **Mentorship:** mentorship requests, group sessions, registration and optional paid sessions.
- **Tech Help Desk:** challenges, suggested solutions delivered as chat messages, and optional prizes.
- **Real-time chat:** delivery and seen ticks, online status, block and delete chat.
- **Notifications:** saved in the database by triggers, plus message notifications calculated in the app.
- **Time zones:** session times are entered in Nepal time (NPT) and shown in each viewer's own time.

## Tech stack

React, Vite, React Router, Supabase (Postgres, Auth, Realtime, Storage) and Vitest.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173/aakar/

Create a `.env` file in the project root. Never commit it:

```
VITE_SUPABASE_URL=https://mzkosavjbasvrjplgkxg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Zh4eHFAwH5-36TcPYQI63w_RDdFjQQ1
```

- Use only the **publishable** key in the frontend. Never put a `sb_secret_` (service role) key in this project.
- If an old `VITE_SUPABASE_ANON_KEY` line exists, delete it. `src/lib/supabase.js` reads it first, so an old value would override the new key.
- Restart `npm run dev` after changing `.env`.

## Demo mode and real mode

Demo mode is controlled by `src/lib/flags.js`:

```js
export const DEMO_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO === 'true'
```

| Where | Demo mode |
|---|---|
| `npm run dev` | On, always |
| `npm run build` / production | Off, unless `VITE_ENABLE_DEMO=true` is set |

Demo mode gives sample accounts and made-up data kept in the browser. Open `?as=investor`, `?as=startup`, `?as=student`, `?as=professional`, `?as=organization` or `?as=admin` to sign in as a sample account.

With demo off, the app starts empty, `?as=` does nothing, sample logins are disabled, made-up stats and testimonials are hidden, and nothing about members is stored in the browser.

To see the real app locally:

```bash
npm run build
npm run preview
```

## Database

SQL files are in `supabase/`:

| File | What it does |
|---|---|
| `001_phase2.sql` | Adds `resubmit_application` (a rejected member can apply again), `public_startups()` (approved startups for the landing page) and `public_stats()` (member counts). Safe to run more than once. |
| `002_check_policies.sql` | Read-only checks: row-level security, policies, functions, triggers and profile columns. Changes nothing. Run it to review your setup. |

`001` builds on the base schema: the tables, security rules and functions such as `set_profile_status`, `start_conversation` and `respond_mentorship`. Create that first. If a trigger stops members from changing `profiles.status`, it must still allow `resubmit_application`.

Keep row-level security on for every table. Logged-out visitors can read only what `public_startups()` and `public_stats()` return.

### Create the first admin

1. In Supabase, turn **Confirm email** off (Authentication, Sign In / Providers, Email).
2. Register normally in the app with your email.
3. Run in the SQL editor:

```sql
update profiles set is_admin = true, status = 'approved' where email = 'you@example.com';
```

4. Log in on the Login page with that email.

## Tests

```bash
npm test
```

Runs the unit tests for `src/lib/validation.js`: meeting links, prizes and password strength.

<!-- ## Deploy

The project is set up for Vercel (`vercel.json`).

- **Real site:** set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Do not set `VITE_ENABLE_DEMO`.
- **Demo site (optional):** a second Vercel project from the same repo with `VITE_ENABLE_DEMO=true`, ideally with its own Supabase project.
- Redeploy after changing any variable, because Vite bakes them in at build time.
- In Supabase, set **Authentication, URL Configuration** to your Vercel link so password reset emails point to the right place. -->