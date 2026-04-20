# Architecture Overview

## Platform goal

Wassel Delivery is being built as an Arabic-first internal delivery platform for Libya with independent operational ownership, infrastructure, and deployment paths.

## Monorepo structure

- `apps/backend-api`: NestJS backend API and realtime services
- `apps/admin-web`: Next.js internal operations console
- `apps/customer-app`: Flutter customer experience
- `apps/driver-app`: Flutter driver operations app
- `apps/admin-mobile`: Flutter mobile operations app
- `packages/shared-types`: shared domain types
- `packages/shared-config`: shared domain constants and environment conventions
- `packages/api-contracts`: shared API route and payload contracts
- `infra`: local and deployment infrastructure starter files
- `docs`: architecture and operational documentation

## Backend foundation

- Framework: NestJS
- Data access: Prisma
- Primary database: PostgreSQL
- Cache and queue broker: Redis
- Background jobs: BullMQ
- Realtime: WebSocket gateway with Socket.IO transport
- API style: REST foundation with versioned prefix

## Frontend foundation

- Admin web: Next.js App Router and TypeScript
- Mobile apps: Flutter with app-specific routing, theme, and localization-ready structure

## Domain boundaries

- `auth`: login, session issuance, identity coordination
- `users`: platform identities and staff records
- `roles-permissions`: RBAC foundation
- `cities-zones-service-areas`: operational geography
- `merchants`: partner entities and settings
- `customers`: customer profile foundation
- `drivers`: driver profile foundation
- `orders`: delivery order lifecycle
- `dispatch`: assignment and operational control
- `tracking`: live status and realtime updates
- `proof-of-delivery`: handoff evidence and confirmation
- `settlements`: payout and financial settlement foundation
- `notifications`: outbound operational messaging

## Environment tiers

- `local`: developer machines and local Docker services
- `staging`: pre-production integration environment
- `production`: live deployment environment

## Domains

- Public domain: `wassel.net.ly`
- API domain: `api.wassel.net.ly`
- Admin domain: `admin.wassel.net.ly`
- Tracking domain: `track.wassel.net.ly`
