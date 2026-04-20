import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class ProofOfDeliveryService {
  getFoundationStatus() {
    return createFeatureStatus('proof-of-delivery', [
      'Proof-of-delivery is reserved as its own operational boundary.',
      'Media capture, signatures, and audit rules remain for Phase 2.'
    ]);
  }
}
