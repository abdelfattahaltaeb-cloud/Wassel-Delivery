type EnvironmentInput = Record<string, unknown>;

function getRequiredString(input: EnvironmentInput, key: string): string {
  const value = input[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function getNumber(input: EnvironmentInput, key: string, fallback: number): number {
  const value = input[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric environment variable: ${key}`);
  }

  return parsed;
}

export function validateEnv(config: EnvironmentInput) {
  return {
    ...config,
    NODE_ENV: typeof config.NODE_ENV === 'string' ? config.NODE_ENV : 'development',
    PORT: getNumber(config, 'PORT', 4000),
    API_PREFIX: typeof config.API_PREFIX === 'string' ? config.API_PREFIX : 'v1',
    CORS_ORIGIN: typeof config.CORS_ORIGIN === 'string' ? config.CORS_ORIGIN : '*',
    DATABASE_URL: getRequiredString(config, 'DATABASE_URL'),
    REDIS_HOST: typeof config.REDIS_HOST === 'string' ? config.REDIS_HOST : '127.0.0.1',
    REDIS_PORT: getNumber(config, 'REDIS_PORT', 6379),
    REDIS_PASSWORD: typeof config.REDIS_PASSWORD === 'string' ? config.REDIS_PASSWORD : undefined,
    APP_VERSION: typeof config.APP_VERSION === 'string' ? config.APP_VERSION : '0.1.0',
    COMMIT_SHA: typeof config.COMMIT_SHA === 'string' ? config.COMMIT_SHA : 'local-dev',
    BUILT_AT: typeof config.BUILT_AT === 'string' ? config.BUILT_AT : new Date().toISOString()
  };
}
