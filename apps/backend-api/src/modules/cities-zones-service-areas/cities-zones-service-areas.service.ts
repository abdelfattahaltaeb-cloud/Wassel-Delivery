import { Injectable } from '@nestjs/common';

import { createFeatureStatus } from '../../common/feature-status';

@Injectable()
export class CitiesZonesServiceAreasService {
  getFoundationStatus() {
    return createFeatureStatus('cities-zones-service-areas', [
      'Geography models are defined for cities, zones, and service areas.',
      'Operational boundaries and pricing logic remain for later phases.'
    ]);
  }
}
