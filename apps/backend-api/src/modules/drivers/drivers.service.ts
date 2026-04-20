import { Injectable } from '@nestjs/common';

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
        user: true,
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
        vehicle: driver.vehicle,
        latestAvailability: driver.availabilitySnapshots[0] ?? null,
        activeAssignments: driver.assignments.length
      }))
    };
  }
}
