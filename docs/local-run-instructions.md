# Local Run Instructions

## 1. Start infrastructure

```bash
docker compose -f infra/docker/compose.local.yml up -d
```

## 2. Install JavaScript dependencies

```bash
pnpm install
```

## 3. Backend API

```bash
cp apps/backend-api/.env.example apps/backend-api/.env
pnpm backend:dev
```

## 4. Admin web

```bash
cp apps/admin-web/.env.example apps/admin-web/.env.local
pnpm admin:dev
```

## 5. Flutter apps

```bash
cd apps/customer-app && flutter run
cd apps/driver-app && flutter run
cd apps/admin-mobile && flutter run
```

## 6. Build commands

```bash
pnpm backend:build
pnpm admin:build
```
