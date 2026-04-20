import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class SettlementsService {
  getFoundationStatus() {
    return createFeatureStatus('settlements', [
      'Settlement entities are reserved for financial reconciliation and payout flows.',
      'Settlement calculation rules remain for Phase 2.'
    ]);
  }
}
