import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { CreateDriverLocationDto } from './dto/create-driver-location.dto';
import { TrackingGateway } from './tracking.gateway';

@Injectable()
export class TrackingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly trackingGateway: TrackingGateway
  ) {}

  async recordDriverLocation(body: CreateDriverLocationDto, user: AuthenticatedUser) {
    const driverId = await this.resolveDriverId(body.driverId, user);

    const location = await this.prismaService.driverLocationUpdate.create({
      data: {
        driverId,
        orderId: body.orderId,
        latitude: body.latitude,
        longitude: body.longitude,
        accuracyMeters: body.accuracyMeters
      },
      include: {
        driver: {
          include: {
            user: true
          }
        },
        order: true
      }
    });

    this.trackingGateway.emitLocationUpdate(location.orderId ?? null, location);

    return {
      location
    };
  }

  async getOrderTimeline(orderId: string, user: AuthenticatedUser) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          include: {
            actorUser: true,
            actorDriver: {
              include: {
                user: true
              }
            }
          }
        },
        driverLocations: {
          orderBy: { capturedAt: 'desc' },
          take: 20
        },
        proofOfDelivery: true,
        assignedDriver: {
          include: {
            user: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order was not found.');
    }

    await this.assertTrackingAccess(order, user);

    return {
      tracking: {
        orderId: order.id,
        referenceCode: order.referenceCode,
        publicTrackingCode: order.publicTrackingCode,
        currentStatus: order.status,
        assignedDriver: order.assignedDriver,
        timeline: order.statusHistory,
        locations: order.driverLocations,
        proofOfDelivery: order.proofOfDelivery
      }
    };
  }

  async getPublicTrackingTimeline(trackingCode: string) {
    const order = await this.prismaService.order.findUnique({
      where: { publicTrackingCode: trackingCode },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'asc' }
        },
        driverLocations: {
          orderBy: { capturedAt: 'desc' },
          take: 10
        },
        proofOfDelivery: true
      }
    });

    if (!order) {
      throw new NotFoundException('Public tracking code was not found.');
    }

    return {
      tracking: {
        referenceCode: order.referenceCode,
        publicTrackingCode: order.publicTrackingCode,
        currentStatus: order.status,
        timeline: order.statusHistory,
        latestLocations: order.driverLocations,
        proofOfDelivery: order.proofOfDelivery
      }
    };
  }

  async getTrackingFoundationSummary() {
    const [locations, activeTrackedOrders] = await Promise.all([
      this.prismaService.driverLocationUpdate.count(),
      this.prismaService.order.count({
        where: {
          status: {
            in: ['ASSIGNED', 'DRIVER_ACCEPTED', 'PICKED_UP', 'IN_TRANSIT']
          }
        }
      })
    ]);

    return {
      locations,
      activeTrackedOrders,
      websocketNamespace: 'tracking'
    };
  }

  private async resolveDriverId(candidateDriverId: string | undefined, user: AuthenticatedUser) {
    if (user.roles.includes('driver')) {
      const driver = await this.prismaService.driver.findUnique({
        where: {
          userId: user.id
        }
      });

      if (!driver) {
        throw new ForbiddenException('Authenticated driver identity was not found.');
      }

      return driver.id;
    }

    if (!candidateDriverId) {
      throw new ForbiddenException('A driverId is required for administrative location updates.');
    }

    return candidateDriverId;
  }

  private async assertTrackingAccess(
    order: {
      assignedDriverId: string | null;
      customerId: string | null;
    },
    user: AuthenticatedUser
  ) {
    if (user.roles.includes('driver')) {
      const driver = await this.prismaService.driver.findUnique({
        where: { userId: user.id }
      });

      if (!driver || order.assignedDriverId != driver.id) {
        throw new ForbiddenException('This driver cannot access the requested tracking timeline.');
      }

      return;
    }

    if (user.roles.includes('customer')) {
      const customer = await this.prismaService.customer.findUnique({
        where: { userId: user.id }
      });

      if (!customer || order.customerId != customer.id) {
        throw new ForbiddenException('This customer cannot access the requested tracking timeline.');
      }
    }
  }
}
