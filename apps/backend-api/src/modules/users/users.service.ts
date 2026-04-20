import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class UsersService {
  getFoundationStatus() {
    return createFeatureStatus('users', [
      'User aggregates are reserved in Prisma for internal staff and operational identities.',
      'Detailed user workflows remain for Phase 2.'
    ]);
  }
}
