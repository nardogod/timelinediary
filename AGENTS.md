# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Timeline Diary is a Next.js 16 (App Router) web application with React 19, TypeScript, and Tailwind CSS v4. It uses Neon PostgreSQL (serverless, remote) for the database and custom cookie-based session auth.

### Running the app

- `npm run dev` starts the Next.js dev server on port 3000
- `npm run build` builds for production
- `npm run lint` runs ESLint (pre-existing warnings/errors in the repo; 38 errors, 89 warnings as of initial setup)
- `npm test` runs Vitest unit tests (83/84 pass; 1 pre-existing failure in `lib/__tests__/utils.test.ts`)

### Environment variables

A `.env.local` file is required with at minimum:
- `DATABASE_URL` — Neon PostgreSQL connection string (uses `@neondatabase/serverless` HTTP driver; local PostgreSQL will NOT work)
- `AUTH_SECRET` — session cookie signing key (minimum 16 characters)
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000`

Optional: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `CRON_SECRET`

### Key caveats

- The Neon serverless driver (`@neondatabase/serverless`) communicates over HTTP, not the standard PostgreSQL wire protocol. A local PostgreSQL instance cannot substitute for a real Neon `DATABASE_URL`.
- Without a valid `DATABASE_URL`, the dev server starts and renders all UI pages, but API routes that query the database will return errors. The `/api/health` endpoint works without a database.
- Unit tests in `lib/__tests__/` do not require a database connection.
- Database migrations are in `scripts/run-neon-migration*.mjs` and run via `npm run db:migrate` (requires valid `DATABASE_URL`).
- Node.js v22+ is required (Next.js 16 dependency).
