import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class RolesPermissionsService {
  getFoundationStatus() {
    return createFeatureStatus('roles-permissions', [
      'RBAC tables exist in Prisma with user-role and role-permission links.',
      'Permission enforcement policies remain for Phase 2.'
    ]);
  }
}
