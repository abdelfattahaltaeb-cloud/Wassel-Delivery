# Wassel Delivery

Wassel Delivery is a brand-new, fully independent delivery platform foundation for Libya. This repository is intentionally separated from any existing Wassel system and is prepared for the domains `wassel.net.ly`, `api.wassel.net.ly`, `admin.wassel.net.ly`, and `track.wassel.net.ly`.

## Scope

The repository now includes:

- a clean pnpm monorepo for the independent Wassel Delivery platform
- a NestJS backend with JWT auth, RBAC, Prisma, PostgreSQL, Redis, BullMQ, live tracking, dispatch, proof of delivery, and settlement foundations
- a Next.js admin web with server-side auth, middleware-based route protection, and production-safe session cookie controls
- a dedicated Next.js public website for `wassel.net.ly`
- backend end-to-end coverage for auth rotation, protected routes, orders, dispatch transitions, public tracking, and dashboard summary flows
- three Flutter mobile foundations for customer, driver, and admin operations
- shared packages for types, config, and API contracts
- infrastructure, documentation, and CI starter files

## Repository layout

```text
apps/
  backend-api/
  admin-web/
  public-web/
  customer-app/
  driver-app/
  admin-mobile/
packages/
  shared-types/
  shared-config/
  api-contracts/
infra/
docs/
```

## Independence guarantees

- No existing Wassel database, auth provider, storage bucket, secret, or domain is referenced here.
- All committed environment files use placeholders only.
- Deployment and runtime structure are prepared as a new standalone project path.

## Quick start

1. Install Node.js 20+, pnpm 10+, Flutter 3.38+, and Docker.
2. Copy placeholder environment files and replace values in your local, uncommitted `.env` files.
3. Start local infrastructure from `infra/docker/compose.local.yml`.
4. Install JavaScript dependencies with `pnpm install`.
5. Run backend migrations with `pnpm --filter backend-api db:migrate`.
6. Seed only local or disposable environments with `pnpm --filter backend-api db:seed`.
7. Run the backend with `pnpm backend:dev`.
8. Run the admin web with `pnpm admin:dev`.
9. Run backend e2e coverage with `pnpm backend:e2e`.
10. Run any Flutter app from its app folder using `flutter run`.

## Security notes

- Seeded credentials are development-only. Set `SEED_DEV_PASSWORD` explicitly in local or disposable environments and never reuse it in staging or production.
- Backend JWT settings should always define issuer, audience, access secret, refresh secret, and explicit expiries.
- Admin session cookies are controlled through `SESSION_COOKIE_DOMAIN`, `SESSION_COOKIE_SECURE`, and `SESSION_COOKIE_SAME_SITE`.
- Production and staging environment examples use placeholders only and must be replaced with environment-specific secrets outside git.

See the docs folder for architecture, environment setup, domain planning, and detailed local run instructions.

## Distribution docs

- Android real-device distribution through Firebase App Distribution is documented in `docs/android-firebase-app-distribution.md`.
