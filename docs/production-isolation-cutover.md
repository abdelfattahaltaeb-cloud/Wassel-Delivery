# Production Isolation Cutover

## Target surfaces

- `https://wassel.net.ly`: official website
- `https://admin.wassel.net.ly`: admin dashboard
- `https://api.wassel.net.ly`: backend API host

## Required backend contract

- backend global prefix: `/api`
- auth routes: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`
- health route: `/api/health`
- build info route: `/api/build-info`

## Delivery project prerequisites

- GCP project: `wassel-delivery-27d8c`
- Billing must be attached before enabling Cloud Run, Artifact Registry, Secret Manager, Redis, and DNS APIs.
- Recommended region: `europe-west1`

## Deploy script

Use `infra/deploy/cloud-run-delivery.sh` after setting production values for:

- `DATABASE_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- optional `COMMIT_SHA`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`

## Domain cutover notes

- Remove any existing `wassel.net.ly` or `www.wassel.net.ly` Cloud Run mappings from non-delivery projects before attaching them here.
- `admin.wassel.net.ly` and `api.wassel.net.ly` require DNS records at the authoritative provider before SSL can become active.
- Runtime clients in this repo must use only `https://api.wassel.net.ly/api` for production.