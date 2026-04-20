import { Injectable } from '@nestjs/common';

import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { PrismaService } from '../../core/prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import type { ManualAssignDriverDto } from '../orders/dto/manual-assign-driver.dto';

@Injectable()
export class DispatchService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly ordersService: OrdersService
  ) {}

  async getOpenJobs() {
    const orders = await this.prismaService.order.findMany({
      where: {
        status: {
          in: ['CREATED', 'ASSIGNED']
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        merchant: true,
        city: true,
        zone: true,
        serviceArea: true,
        assignedDriver: {
          include: {
            user: true
          }
        }
      }
    });

    return {
      jobs: orders
    };
  }

  manualAssign(orderId: string, body: ManualAssignDriverDto, user: AuthenticatedUser) {
    return this.ordersService.manualAssignDriver(orderId, body, user);
  }
}
