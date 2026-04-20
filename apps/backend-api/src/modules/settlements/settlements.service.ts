import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class SettlementsService {
  constructor(private readonly prismaService: PrismaService) {}

  async listSettlements() {
    const settlements = await this.prismaService.settlement.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        order: {
          include: {
            merchant: true
          }
        }
      }
    });

    return {
      settlements
    };
  }
}
