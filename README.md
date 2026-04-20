# Wassel Delivery

Wassel Delivery is a brand-new, fully independent delivery platform foundation for Libya. This repository is intentionally separated from any existing Wassel system and is prepared for the domains `wassel.net.ly`, `api.wassel.net.ly`, `admin.wassel.net.ly`, and `track.wassel.net.ly`.

## Scope

This Phase 1 repository establishes:

- a clean monorepo
- a NestJS backend foundation with Prisma, PostgreSQL, Redis, BullMQ, and WebSocket bootstrap
- a Next.js admin web foundation
- three Flutter mobile foundations for customer, driver, and admin operations
- shared packages for types, config, and API contracts
- infrastructure, documentation, and CI starter files

## Repository layout

```text
apps/
  backend-api/
  admin-web/
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
5. Run the backend with `pnpm backend:dev`.
6. Run the admin web with `pnpm admin:dev`.
7. Run any Flutter app from its app folder using `flutter run`.

See the docs folder for architecture, environment setup, domain planning, and detailed local run instructions.
