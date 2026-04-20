import { Controller, Get } from '@nestjs/common';

import { SystemService } from './system.service';

@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  async health() {
    return this.systemService.getHealth();
  }

  @Get('build-info')
  getBuildInfo() {
    return this.systemService.getBuildInfo();
  }
}
