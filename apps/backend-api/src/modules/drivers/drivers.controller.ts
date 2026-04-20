import { Controller, Get } from '@nestjs/common';

import { DriversService } from './drivers.service';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  getFoundationStatus() {
    return this.driversService.getFoundationStatus();
  }
}
