import { Controller, Get } from '@nestjs/common';

import { CitiesZonesServiceAreasService } from './cities-zones-service-areas.service';

@Controller('cities-zones-service-areas')
export class CitiesZonesServiceAreasController {
  constructor(private readonly service: CitiesZonesServiceAreasService) {}

  @Get()
  getFoundationStatus() {
    return this.service.getFoundationStatus();
  }
}
