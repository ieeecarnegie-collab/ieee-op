# IEEE CMU Chapter Website

Internal operations hub for the IEEE student chapter at Carnegie Mellon University (Phase 1 MVP).

## Features

- Public landing page
- Exec-only login (Google SSO or dev mode)
- Dashboard with 8 committee status cards
- Event calendar with planning checklists (T-14 / T-7 / T-3 / day-of)
- PR poster deliverable tracking
- Committee pages, meeting notes, admin roster view
- **Phase 2:** Custom goals, search, meeting PDF export, semester signature tracking, admin planning template editor, email digest (Resend)

## Quick start

```bash
cp .env.example .env.local
# Paste your Neon DATABASE_URL from Vercel → Settings → Environment Variables
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Exec Login** with demo users when `AUTH_DEV_MODE=true`:

| User | Email |
|------|-------|
| President | president@andrew.cmu.edu |
| Social chair | social@andrew.cmu.edu |
| PR chair | pr@andrew.cmu.edu |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Migrate schema, seed if empty, start dev server |
| `npm run db:migrate` | Apply SQL migrations to Postgres (Neon) |
| `npm run db:push` | Push schema changes directly (dev iteration) |
| `npm run db:seed` | Seed committees, checklist template, demo users |
| `npm run build` | Production build |

## Production setup

1. Connect [Neon](https://neon.com) via Vercel Marketplace (Storage → Neon)
2. Set `DATABASE_URL` (auto-injected by Neon integration)
3. Set `AUTH_SECRET` (32+ char random string)
4. Set `AUTH_DEV_MODE=false` in production
5. Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (CMU Google OAuth)
6. Deploy — `npm run build` runs migrations and seeds on first deploy

## Design documentation

Full spec: [docs/DESIGN.md](docs/DESIGN.md)
