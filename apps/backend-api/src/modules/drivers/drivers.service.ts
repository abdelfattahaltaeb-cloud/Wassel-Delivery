import { Injectable } from '@nestjs/common';

import { safeUserSelect } from '../../common/data/safe-user-select';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class DriversService {
  constructor(private readonly prismaService: PrismaService) {}

  async listDrivers() {
    const drivers = await this.prismaService.driver.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: safeUserSelect
        },
        vehicle: true,
        availabilitySnapshots: {
          orderBy: {
            recordedAt: 'desc'
          },
          take: 1,
          include: {
            serviceArea: true
          }
        },
        assignments: {
          where: {
            status: {
              in: ['PENDING', 'ACCEPTED']
            }
          }
        },
        currentOrders: {
          select: {
            codAmount: true,
            paymentCollectionType: true,
            status: true
          }
        },
        ordersStatusHistory: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    return {
      drivers: drivers.map((driver) => ({
        id: driver.id,
        status: driver.status,
        name: `${driver.user.firstName} ${driver.user.lastName}`,
        email: driver.user.email,
        phoneNumber: driver.user.phoneNumber,
        createdAt: driver.createdAt,
        courierCode: `DR-${driver.id.slice(-6).toUpperCase()}`,
        vehicle: driver.vehicle,
        latestAvailability: driver.availabilitySnapshots[0] ?? null,
        activeAssignments: driver.assignments.length,
        lastReceivedOrderDate: driver.ordersStatusHistory[0]?.createdAt ?? null,
        codHeldAmount: driver.currentOrders
          .filter((order) => order.paymentCollectionType === 'COD' && order.status !== 'CANCELLED')
          .reduce((sum, order) => sum + Number(order.codAmount), 0)
      }))
    };
  }
}
