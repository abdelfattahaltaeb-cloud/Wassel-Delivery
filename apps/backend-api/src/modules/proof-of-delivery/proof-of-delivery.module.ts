import { Module } from '@nestjs/common';

import { ProofOfDeliveryController } from './proof-of-delivery.controller';
import { ProofOfDeliveryService } from './proof-of-delivery.service';

@Module({
  controllers: [ProofOfDeliveryController],
  providers: [ProofOfDeliveryService]
})
export class ProofOfDeliveryModule {}
