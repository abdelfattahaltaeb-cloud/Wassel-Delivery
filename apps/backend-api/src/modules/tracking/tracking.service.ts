import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class TrackingService {
  getFoundationStatus() {
    return createFeatureStatus('tracking', [
      'Realtime tracking foundation is bootstrapped with a dedicated WebSocket gateway.',
      'Live route telemetry and ETA models remain for Phase 2.'
    ]);
  }
}
