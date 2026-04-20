import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  serviceName: 'backend-api',
  environment: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? 'v1',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  appVersion: process.env.APP_VERSION ?? '0.1.0',
  commitSha: process.env.COMMIT_SHA ?? 'local-dev',
  builtAt: process.env.BUILT_AT ?? new Date().toISOString(),
  redis: {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? undefined
  }
}));
