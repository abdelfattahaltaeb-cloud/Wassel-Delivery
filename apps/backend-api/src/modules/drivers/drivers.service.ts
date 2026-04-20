import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class DriversService {
  getFoundationStatus() {
    return createFeatureStatus('drivers', [
      'Driver profiles and availability states are defined in Prisma.',
      'Assignment, compliance, and performance policies remain for Phase 2.'
    ]);
  }
}
