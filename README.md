# Voxlud

**Words into play.** Turn text prompts into playable browser games — similar to [Instaplay](https://www.instaplay.ai/).

Production-ready stack: **Next.js 16**, **Supabase Auth** (Google OAuth + email), **PostgreSQL** with Row Level Security.

## Features

- **Google sign-in** — One-click OAuth via Supabase
- **Email auth** — Sign up / sign in with email and password
- **Prompt-to-game** — Describe a game, get a playable result in seconds
- **My games** — Create, view, share, and delete your games
- **Explore gallery** — Browse community and demo games
- **17 game types** — Pong, Snake, Breakout, Runner, Clicker, Flappy, Shooter, Tetris, Memory, Whack, Dodge, 2048 Slide, Catch, Cross, Stack, Simon, Reaction
- **Share links** — Every game gets a unique URL

## Quick start

### 1. Clone and install

```bash
npm install
cp .env.example .env.local          # dev
cp .env.example .env.production.local  # prod (optional, for local prod builds)
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project
2. Open **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Run the database migration

Open **SQL Editor** in Supabase and run the contents of:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_seed_new_games.sql
supabase/migrations/003_seed_more_games.sql
supabase/migrations/004_seed_extra_games.sql
```

This creates `profiles`, `games`, RLS policies, and seeds demo games (run all four migrations for the full gallery).

### 4. Configure Google OAuth

1. In Supabase: **Authentication → Providers → Google** → Enable
2. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Application type: **Web application**
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Paste Client ID and Client Secret into Supabase Google provider settings

### 5. Configure redirect URLs

In Supabase: **Authentication → URL Configuration**

| Setting | Value |
|---------|-------|
| Site URL | `http://localhost:3000` (dev) or your production domain |
| Redirect URLs | `http://localhost:3000/auth/callback`, `https://yourdomain.com/auth/callback` |

**Dev** — set in `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Prod** — set in `.env.production.local` (and Vercel env vars):

```bash
NEXT_PUBLIC_SITE_URL=https://voxlud.vercel.app
```

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to production (Vercel)

1. Push to GitHub and import in [Vercel](https://vercel.com)
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g. `https://voxlud.vercel.app`)
3. Update Supabase redirect URLs with your production domain
4. Deploy

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Your app URL for OAuth redirects |

## Project structure

```
src/
├── app/                  # Pages and API routes
│   ├── auth/callback/    # OAuth callback handler
│   ├── api/              # REST API
│   └── ...
├── components/           # UI, game canvas, auth
├── lib/
│   ├── games.ts          # Game CRUD (Supabase)
│   └── supabase/         # Supabase clients & auth
└── types/                # TypeScript types
supabase/
└── migrations/           # SQL schema + seed data
```

## Auth flow

1. User clicks **Continue with Google** or signs up with email
2. Supabase handles OAuth / credentials
3. `/auth/callback` exchanges the code for a session
4. Profile is auto-created via database trigger
5. Protected routes (`/create`, `/my-games`) require a valid session

## Security

- Row Level Security on all tables
- Users can only create/delete their own games
- Play/like counters use security-definer RPC functions
- Passwords hashed by Supabase Auth (never stored in app)

## License

MIT
