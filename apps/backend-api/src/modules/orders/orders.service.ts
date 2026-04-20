import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class OrdersService {
  getFoundationStatus() {
    return createFeatureStatus('orders', [
      'Core order entities and status lifecycle placeholders are defined.',
      'Operational workflow and business rules remain for Phase 2.'
    ]);
  }
}
