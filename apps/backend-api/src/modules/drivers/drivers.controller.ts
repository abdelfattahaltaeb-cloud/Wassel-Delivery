import { Controller, Get } from '@nestjs/common';

import { RequirePermissions } from '../../common/auth/permissions.decorator';
import { DriversService } from './drivers.service';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @RequirePermissions('drivers.read')
  @Get()
  listDrivers() {
    return this.driversService.listDrivers();
  }
}
