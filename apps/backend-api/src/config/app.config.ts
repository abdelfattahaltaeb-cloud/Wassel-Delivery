import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  serviceName: 'backend-api',
  environment: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? '<JWT_ACCESS_SECRET>',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? '<JWT_REFRESH_SECRET>',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    issuer: process.env.JWT_ISSUER ?? 'wassel-delivery-api',
    audience: process.env.JWT_AUDIENCE ?? 'wassel-delivery-platform'
  },
  appVersion: process.env.APP_VERSION ?? '0.1.0',
  commitSha: process.env.COMMIT_SHA ?? 'local-dev',
  builtAt: process.env.BUILT_AT ?? new Date().toISOString(),
  redis: {
    host: process.env.REDIS_HOST ?? 'redis',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? undefined
  }
}));
