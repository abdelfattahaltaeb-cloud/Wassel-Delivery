import { Controller, Get } from '@nestjs/common';

import { ProofOfDeliveryService } from './proof-of-delivery.service';

@Controller('proof-of-delivery')
export class ProofOfDeliveryController {
  constructor(private readonly proofOfDeliveryService: ProofOfDeliveryService) {}

  @Get()
  getFoundationStatus() {
    return this.proofOfDeliveryService.getFoundationStatus();
  }
}
