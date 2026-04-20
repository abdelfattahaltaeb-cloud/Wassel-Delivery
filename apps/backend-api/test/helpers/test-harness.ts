import { existsSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';

import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import {
  developmentSeedPassword,
  developmentSeedTracking,
  developmentSeedUsers,
  seedDatabase
} from '../../prisma/seed';

configureE2eEnvironment();

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
};

export type SeedResult = Awaited<ReturnType<typeof seedDatabase>>;

export type E2eHarness = {
  app: INestApplication;
  http: ReturnType<typeof request>;
  prisma: PrismaClient;
  seed: SeedResult;
};

export { developmentSeedPassword, developmentSeedTracking, developmentSeedUsers };

export async function createE2eHarness(): Promise<E2eHarness> {
  const prisma = new PrismaClient();
  const seed = await seedDatabase(prisma, {
    password: process.env.SEED_DEV_PASSWORD ?? developmentSeedPassword
  });
  const { createApp } = await import('../../src/app.factory');
  const app = await createApp();

  await app.init();

  return {
    app,
    http: request(app.getHttpServer()),
    prisma,
    seed
  };
}

export async function destroyE2eHarness(harness: E2eHarness) {
  await harness.app.close();
  await harness.prisma.$disconnect();
}

export async function loginAs(
  http: ReturnType<typeof request>,
  email: string,
  password = process.env.SEED_DEV_PASSWORD ?? developmentSeedPassword
) {
  const response = await http.post('/v1/auth/login').send({ email, password });

  assert.equal(response.status, 200);

  return response.body as AuthSessionResponse;
}

export async function refreshWith(http: ReturnType<typeof request>, refreshToken: string) {
  const response = await http.post('/v1/auth/refresh').send({ refreshToken });

  return response;
}

export function getAuthHeader(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`
  };
}

export function buildCreateOrderPayload(seed: SeedResult, suffix: string) {
  return {
    merchantId: seed.merchantId,
    customerId: seed.customerId,
    cityId: seed.cityId,
    zoneId: seed.zoneId,
    serviceAreaId: seed.serviceAreaId,
    totalAmount: 42,
    codAmount: 42,
    paymentCollectionType: 'COD',
    notes: `E2E order ${suffix}`,
    stops: [
      {
        sequence: 1,
        type: 'PICKUP',
        label: `Pickup ${suffix}`,
        addressLine: 'Souq Aljumaa, Tripoli',
        contactName: 'Ops Desk',
        contactPhone: '+218910000101'
      },
      {
        sequence: 2,
        type: 'DROPOFF',
        label: `Dropoff ${suffix}`,
        addressLine: 'Hay Al Andalus, Tripoli',
        contactName: 'Lina Customer',
        contactPhone: '+218910000004'
      }
    ]
  };
}

function configureE2eEnvironment() {
  loadEnvironmentFile(resolve(__dirname, '../../.env'));

  process.env.NODE_ENV ??= 'test';
  process.env.API_PREFIX ??= 'v1';
  process.env.CORS_ORIGIN ??= 'http://127.0.0.1:3000';
  process.env.REDIS_HOST ??= '127.0.0.1';
  process.env.REDIS_PORT ??= '6380';
  process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
  process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
  process.env.JWT_ACCESS_TTL ??= '15m';
  process.env.JWT_REFRESH_TTL ??= '7d';
  process.env.JWT_ISSUER ??= 'wassel-delivery-api';
  process.env.JWT_AUDIENCE ??= 'wassel-delivery-platform';
  process.env.SEED_DEV_PASSWORD ??= developmentSeedPassword;

  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL must be set for backend e2e tests.');
}

function loadEnvironmentFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');

  for (const line of content.split(/\r?\n/u)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    let value = trimmedLine.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}