# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint check
```

**Database (Prisma with Neon adapter):**
```bash
npx prisma db push           # Push schema changes without migration file (preferred)
npx prisma generate          # Regenerate client only
npm run prisma seed          # Seed admin user (requires ADMIN_PASSWORD env var)
```

> **WARNING — Prisma client cannot be regenerated via CLI** (TLS error downloading query engine binaries in this environment). Any schema change requires **manually patching** the 4 generated files in `app/generated/prisma/`: `index.js`, `edge.js`, `index-browser.js`, `index.d.ts`. Also run the matching `ALTER TABLE` SQL directly in the Neon console. See "Prisma Patching" section below.

The Prisma client output is non-standard: `app/generated/prisma` (configured in `prisma/schema.prisma`). Always import from `@/app/generated/prisma`, not from `@prisma/client`.

## Architecture

**Next.js 16 App Router** with Tailwind CSS 4. The UI is in French. The app is a gala event ticket management system with three roles.

### Authentication & Authorization

- Sessions are JWT tokens stored in the `gala_session` cookie (7-day expiry), signed with a key derived from `SESSION_SECRET` or `HMAC_SECRET` via HMAC-SHA256 (`lib/auth.ts`).
- Three session states: unauthenticated → `/login`, `admin` role → `/admin`, `scanner` role → `/scan`.
- Guard functions: `requireAdmin()` and `requireScanner()` in `lib/auth.ts` handle redirects server-side.
- API routes check `getSession()` manually — there is no middleware.

### Ticket Security

Each ticket carries an HMAC-SHA256 signature (`lib/crypto.ts`) computed over `${ticketId}:${ticketNumber}` using `HMAC_SECRET`. The QR code encodes `{ id, sig }` as JSON. Validation at `/api/tickets/[id]/validate` uses `updateMany WHERE status='VALID'` inside a Prisma transaction — atomic at PostgreSQL row level, prevents double-scan race conditions. Signature comparison uses `crypto.timingSafeEqual()` (constant-time, no timing attack).

### Data Model

Two Prisma models in `prisma/schema.prisma` (Table model was removed):
- **Ticket** — `ticketNumber` (GALA-0001 format), `ticketType` (INDIVIDUEL/GBONHI), `holderName` (optional guest/group name), `status` (VALID/USED/CANCELLED), HMAC `signature`, optional `note`.
- **User** — admin or scanner role, bcrypt-hashed passwords.

**GalaSettings** — NOT in Prisma schema. Accessed via `prisma.$queryRaw` / `prisma.$executeRaw`. Key/value table in Neon:
```sql
CREATE TABLE IF NOT EXISTS "GalaSettings" (
  key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT ''
);
INSERT INTO "GalaSettings" (key, value)
VALUES ('lieu','À définir'),('date','À définir'),('heure','À définir')
ON CONFLICT (key) DO NOTHING;
```
Managed via `app/api/admin/settings/route.ts` and `lib/gala-pdf.ts`.

### Prisma Patching

When adding a field (e.g. `holderName String?`) to the Ticket model:

1. Update `prisma/schema.prisma` and `app/generated/prisma/schema.prisma`
2. Run `ALTER TABLE "Ticket" ADD COLUMN "holderName" TEXT;` in Neon console
3. In `app/generated/prisma/index.js` and `edge.js`, patch three places:
   - `TicketScalarFieldEnum` object — add `holderName: 'holderName'`
   - `inlineSchema` string — add `holderName   String?\n` in the Ticket model block
   - `runtimeDataModel` JSON string — add `{"name":"holderName","kind":"scalar","type":"String"}` in Ticket fields array
4. In `app/generated/prisma/index-browser.js` — patch `TicketScalarFieldEnum` only
5. In `app/generated/prisma/index.d.ts` — add the field to all relevant TypeScript types: `$TicketPayload` scalars, `TicketSelectScalar`, `TicketOmit`, aggregate output types, where/orderBy/create/update input types, and `TicketScalarFieldEnum`

### Ticket Offers

- **INDIVIDUEL** — 1 ticket, 10 000 FCFA
- **GBONHI** — 6 tickets created at once, 50 000 FCFA per offer. Batch PDF available at `GET /api/tickets/batch-pdf?ids=...`

Revenue is computed in real-time: `(INDIVIDUEL non-cancelled × 10 000) + (GBONHI non-cancelled ÷ 6 × 50 000)`.

### PDF Generation

`lib/gala-pdf.ts` — shared PDF logic used by both single (`/api/tickets/[id]/pdf`) and batch (`/api/tickets/batch-pdf`) routes. Portrait format, dark/gold theme. Settings (lieu/date/heure) are read from `GalaSettings` at generation time.

### Key Libraries

| Purpose | Library |
|---|---|
| Database | `@neondatabase/serverless` + `@prisma/adapter-neon` |
| Auth tokens | `jose` (JWT) |
| Ticket HMAC | Node.js `crypto` (built-in) |
| QR generation | `qrcode` |
| QR scanning | `@zxing/library` (browser, in `components/QRScanner.tsx`) |
| PDF generation | `pdf-lib` |
| Password hashing | `bcryptjs` |

### Route Structure

- `/admin` — dashboard with live stats and revenue (SSE via `/api/events`)
- `/admin/create` — create INDIVIDUEL or GBONHI tickets; share buttons appear immediately after creation
- `/admin/tickets` — list all tickets with copy-link and WhatsApp share buttons per row
- `/admin/tickets/[id]` — ticket detail with share section
- `/admin/users` — manage admin/scanner accounts
- `/admin/settings` — configure gala lieu/date/heure (stored in GalaSettings)
- `/scan` — scanner view with live counter
- `/ticket/[id]` — public ticket view with QR code, PDF download, share
- `/login` — credential login form

**API routes** (`app/api/`):
- `POST /api/auth/login` — validates credentials, sets JWT cookie
- `DELETE /api/auth` — logout (clears cookie)
- `GET|POST /api/tickets` — list (filterable by status/search) or create tickets (admin only)
- `GET|PATCH|DELETE /api/tickets/[id]` — single ticket operations
- `POST /api/tickets/[id]/validate` — atomic ticket scan/validation
- `GET /api/tickets/[id]/pdf` — stream generated PDF
- `GET /api/tickets/batch-pdf?ids=...` — multi-ticket PDF (GBONHI, max 20)
- `GET /api/events` — SSE stream for live dashboard stats (55s max, auto-reconnect client-side)
- `GET|PUT /api/admin/settings` — read/write GalaSettings
- `GET|POST /api/admin/users` and `PATCH|DELETE /api/admin/users/[id]`

### Environment Variables

See `.env.example` for all required vars:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `HMAC_SECRET` — signs QR codes and derives session key (critical secret — if leaked, all QR codes can be forged)
- `ADMIN_PASSWORD` — used by seed script
- `NEXT_PUBLIC_APP_URL` — base URL (no trailing slash), e.g. `https://e-ticket-ruby.vercel.app`

### Deployment

Configured for Vercel (`.vercel/project.json` present). Deploy with `vercel --prod`. Security headers (CSP, HSTS, X-Frame-Options) are applied globally in `next.config.ts`.

### Backup automatique

Un workflow GitHub Actions (`.github/workflows/backup.yml`) exporte la table `Ticket` en CSV chaque nuit à 2h UTC et commit le fichier dans `backups/`. Pour l'activer :
1. Aller dans le repo GitHub → **Settings → Secrets and variables → Actions**
2. Créer un secret `DATABASE_URL` avec la valeur de l'URL Neon (connection string complète)
3. Le workflow se déclenche automatiquement, ou manuellement via l'onglet **Actions → Run workflow**
