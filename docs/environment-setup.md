# Environment Setup Guide

## Principles

- Commit only placeholder environment files.
- Keep local `.env` files untracked.
- Use a separate PostgreSQL database and separate Redis instance for this project.
- Never reuse secrets from any existing Wassel repository or environment.

## Required tools

- Node.js 20+
- pnpm 10+
- Flutter 3.38+
- Docker and Docker Compose

## Files to prepare locally

- root `.env` from `.env.example`
- `apps/backend-api/.env` from `apps/backend-api/.env.example`
- `apps/admin-web/.env.local` from `apps/admin-web/.env.example`

## Local infrastructure

Use the Docker Compose starter under `infra/docker/compose.local.yml` to provide PostgreSQL and Redis for development.

## Placeholder policy

Keep values in committed examples in the form `<PLACEHOLDER_VALUE>`.
