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
npx prisma migrate dev       # Apply migrations + regenerate client
npx prisma migrate deploy    # Apply migrations in production
npx prisma db push           # Push schema changes without migration file
npx prisma generate          # Regenerate client only
npm run prisma seed          # Seed admin user (requires ADMIN_PASSWORD env var)
```

The Prisma client output is non-standard: `app/generated/prisma` (configured in `prisma/schema.prisma`). Always import from `@/app/generated/prisma`, not from `@prisma/client`.

## Architecture

**Next.js 16 App Router** with Tailwind CSS 4. The UI is in French. The app is a gala event ticket management system with three roles.

### Authentication & Authorization

- Sessions are JWT tokens stored in the `gala_session` cookie (7-day expiry), signed with a key derived from `SESSION_SECRET` or `HMAC_SECRET` via HMAC-SHA256 (`lib/auth.ts`).
- Three session states: unauthenticated → `/login`, `admin` role → `/admin`, `scanner` role → `/scan`.
- Guard functions: `requireAdmin()` and `requireScanner()` in `lib/auth.ts` handle redirects server-side.
- API routes check `getSession()` manually — there is no middleware.

### Ticket Security

Each ticket carries an HMAC-SHA256 signature (`lib/crypto.ts`) computed over `${ticketId}:${ticketNumber}` using `HMAC_SECRET`. The QR code encodes `{ id, sig }` as JSON. Validation at `/api/tickets/[id]/validate` runs inside a **Prisma transaction** to prevent double-scan race conditions and verifies the signature before marking the ticket as `USED`.

### Data Model

Three Prisma models in `prisma/schema.prisma`:
- **Ticket** — `ticketNumber` (GALA-0001 format), `ticketType` (VIP/STANDARD), `status` (VALID/USED/CANCELLED), HMAC `signature`, optional `tableId`.
- **Table** — numbered tables with `capacity`; assignment is mandatory at ticket creation.
- **User** — admin or scanner role, bcrypt-hashed passwords.

### Key Libraries

| Purpose | Library |
|---|---|
| Database | `@neondatabase/serverless` + `@prisma/adapter-neon` |
| Auth tokens | `jose` (JWT) |
| Ticket HMAC | Node.js `crypto` (built-in) |
| QR generation | `qrcode` |
| QR scanning | `@zxing/library` (browser, in `components/QRScanner.tsx`) |
| PDF generation | `pdf-lib` (at `/api/tickets/[id]/pdf`) |
| Password hashing | `bcryptjs` |

### Route Structure

- `/admin/*` — admin panel (create tickets, list/filter tickets, manage tables and users)
- `/scan` — scanner view with live counter; uses camera via `@zxing/library`
- `/ticket/[id]` — public ticket view with QR code; download PDF and share buttons
- `/login` — credential login form

**API routes** (`app/api/`):
- `POST /api/auth/login` — validates credentials, sets JWT cookie
- `GET|POST /api/tickets` — list (filterable) or create tickets (admin only)
- `GET|PATCH|DELETE /api/tickets/[id]` — single ticket operations
- `POST /api/tickets/[id]/validate` — atomic ticket scan/validation
- `GET /api/tickets/[id]/pdf` — stream generated PDF
- `GET|POST /api/admin/tables` and `PATCH|DELETE /api/admin/tables/[id]`
- `GET|POST /api/admin/users` and `PATCH|DELETE /api/admin/users/[id]`

### Environment Variables

See `.env.example` for all required vars:
- `DATABASE_URL` — Neon PostgreSQL connection string
- `HMAC_SECRET` — signs QR codes and derives session key
- `ADMIN_PASSWORD` — used by seed script
- `NEXT_PUBLIC_APP_URL` — base URL (no trailing slash)

### Deployment

Configured for Vercel (`.vercel/project.json` present). Security headers (CSP, HSTS, X-Frame-Options) are applied globally in `next.config.ts`. The app is PWA-ready with `app/manifest.ts` and Apple Web App meta tags.
