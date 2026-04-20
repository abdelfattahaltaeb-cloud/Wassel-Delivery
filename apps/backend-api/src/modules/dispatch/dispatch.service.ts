import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class DispatchService {
  getFoundationStatus() {
    return createFeatureStatus('dispatch', [
      'Dispatch is reserved as a separate operational boundary from orders.',
      'Assignment strategies and optimization logic remain for Phase 2.'
    ]);
  }
}
