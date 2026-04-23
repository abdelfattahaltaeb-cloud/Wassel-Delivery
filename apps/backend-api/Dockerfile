FROM node:20-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production
ENV PORT=8080

RUN corepack enable

WORKDIR /workspace

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/backend-api/package.json apps/backend-api/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json
COPY packages/shared-config/package.json packages/shared-config/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json

RUN pnpm install --frozen-lockfile=false

COPY . .

RUN pnpm --filter backend-api build

WORKDIR /workspace/apps/backend-api

EXPOSE 8080

CMD ["sh", "-c", "pnpm db:deploy && pnpm start"]