import { Controller, Get } from '@nestjs/common';

import { RequirePermissions } from '../../common/auth/permissions.decorator';
import { Public } from '../../common/auth/public.decorator';
import { SystemService } from './system.service';

@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Public()
  @Get('health')
  async health() {
    return this.systemService.getHealth();
  }

  @Public()
  @Get('build-info')
  getBuildInfo() {
    return this.systemService.getBuildInfo();
  }

  @RequirePermissions('dashboard.summary.read')
  @Get('dashboard-summary')
  getDashboardSummary() {
    return this.systemService.getDashboardSummary();
  }
}
