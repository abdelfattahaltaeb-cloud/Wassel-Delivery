import { Controller, Get, Param } from '@nestjs/common';

import { RequirePermissions } from '../../common/auth/permissions.decorator';
import { ProofOfDeliveryService } from './proof-of-delivery.service';

@Controller('proof-of-delivery')
export class ProofOfDeliveryController {
  constructor(private readonly proofOfDeliveryService: ProofOfDeliveryService) {}

  @RequirePermissions('orders.read')
  @Get()
  getFoundationStatus() {
    return this.proofOfDeliveryService.getFoundationStatus();
  }

  @RequirePermissions('orders.read')
  @Get('orders/:orderId')
  getOrderProof(@Param('orderId') orderId: string) {
    return this.proofOfDeliveryService.getOrderProof(orderId);
  }
}
