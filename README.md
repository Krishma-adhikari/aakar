# Aakar (आकार)

A platform that connects Nepal with the Nepali diaspora. Investors back verified startups, professionals mentor students, and organizations post tech challenges that engineers can answer.

## Features

- **Five roles:** investor, startup, student, professional and organization. Each has its own home page.
- **Admin verification:** every member is reviewed before they can use the app.
- **Invest in Nepal:** startup listings, pitches, a watchlist and direct chat.
- **Mentorship:** mentorship requests, group sessions, registration and optional paid sessions.
- **Tech Help Desk:** challenges, suggested solutions delivered as chat messages, and optional prizes.
- **Real-time chat:** delivery and seen ticks, online status, block and delete.
- **Notifications:** saved in the database by triggers, plus calculated message notifications.
- **Time zones:** session times are entered in Nepal time (NPT) and shown in each viewer's own time.

## Tech stack

React, Vite, React Router, Supabase (Postgres, Auth, Realtime, Storage), Vitest.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173/aakar/

Create a `.env` file in the project root. Never commit it, and never put a `sb_secret_` / service_role key in frontend code:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The variable names must match what `src/lib/supabase.js` reads.

## Demo mode

Demo mode uses sample accounts and fictional data stored in the browser. It is controlled by `src/lib/flags.js`. Open `?as=investor`, `?as=startup`, `?as=student`, `?as=professional`, `?as=organization` or `?as=admin` to sign in as a sample account. In a production build, demo mode is off and nothing about members is stored in the browser.

## Database

SQL files are in `supabase/`. Run them in the Supabase SQL editor in order. Row-level security protects the data, so keep it on for every table.

## Tests

```bash
npm test
```

This runs the unit tests for `src/lib/validation.js` (meeting links, prizes and password strength).

## Deploy

The project is