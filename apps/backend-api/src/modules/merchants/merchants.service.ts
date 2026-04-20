import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class MerchantsService {
  getFoundationStatus() {
    return createFeatureStatus('merchants', [
      'Merchant registry and contact fields are available in Prisma.',
      'Merchant onboarding workflows remain for Phase 2.'
    ]);
  }
}
