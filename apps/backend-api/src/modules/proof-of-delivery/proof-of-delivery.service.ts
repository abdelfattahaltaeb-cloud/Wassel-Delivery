import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class ProofOfDeliveryService {
  constructor(private readonly prismaService: PrismaService) {}

  getFoundationStatus() {
    return {
      feature: 'proof-of-delivery',
      supports: ['delivered-photo', 'otp-placeholder', 'failure-reason']
    };
  }

  async getOrderProof(orderId: string) {
    const proof = await this.prismaService.proofOfDelivery.findUnique({
      where: { orderId }
    });

    if (!proof) {
      throw new NotFoundException('Proof of delivery was not found for this order.');
    }

    return {
      proof
    };
  }
}
