import type { BuildInfo, FeatureStatus } from '@wassel-delivery/shared-types';

export const apiRoutes = {
  health: '/v1/health',
  buildInfo: '/v1/build-info'
} as const;

export type HealthResponse = {
  status: 'ok';
  timestamp: string;
  service: string;
};

export type BuildInfoResponse = BuildInfo;

export type FeatureStatusResponse = FeatureStatus;
