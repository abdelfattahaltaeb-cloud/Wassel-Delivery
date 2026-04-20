import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class MerchantsService {
  constructor(private readonly prismaService: PrismaService) {}

  async listMerchants() {
    const merchants = await this.prismaService.merchant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        city: true,
        serviceArea: true,
        orders: true
      }
    });

    return {
      merchants: merchants.map((merchant) => ({
        id: merchant.id,
        code: merchant.code,
        name: merchant.name,
        contactName: merchant.contactName,
        contactPhone: merchant.contactPhone,
        city: merchant.city.name,
        serviceArea: merchant.serviceArea?.name ?? null,
        ordersCount: merchant.orders.length
      }))
    };
  }
}
