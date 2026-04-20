import { Controller, Get } from '@nestjs/common';

import { RequirePermissions } from '../../common/auth/permissions.decorator';
import { RolesPermissionsService } from './roles-permissions.service';

@Controller('roles-permissions')
export class RolesPermissionsController {
  constructor(private readonly rolesPermissionsService: RolesPermissionsService) {}

  @RequirePermissions('roles.read')
  @Get()
  listRolesAndPermissions() {
    return this.rolesPermissionsService.listRolesAndPermissions();
  }
}
