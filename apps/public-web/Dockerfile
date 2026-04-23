FROM node:20-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

WORKDIR /workspace

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/public-web/package.json apps/public-web/package.json

RUN pnpm install --frozen-lockfile=false

COPY . .

RUN pnpm --filter public-web build

WORKDIR /workspace/apps/public-web

EXPOSE 8080

CMD ["sh", "-c", "pnpm start -- --hostname 0.0.0.0 --port ${PORT:-8080}"]