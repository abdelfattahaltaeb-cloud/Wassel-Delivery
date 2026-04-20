import { Module } from '@nestjs/common';

import { CitiesZonesServiceAreasController } from './cities-zones-service-areas.controller';
import { CitiesZonesServiceAreasService } from './cities-zones-service-areas.service';

@Module({
  controllers: [CitiesZonesServiceAreasController],
  providers: [CitiesZonesServiceAreasService]
})
export class CitiesZonesServiceAreasModule {}
