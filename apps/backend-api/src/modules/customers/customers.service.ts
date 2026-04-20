import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class CustomersService {
  getFoundationStatus() {
    return createFeatureStatus('customers', [
      'Customer profile linkage is reserved on top of the user aggregate.',
      'Customer-facing lifecycle logic remains for later phases.'
    ]);
  }
}
