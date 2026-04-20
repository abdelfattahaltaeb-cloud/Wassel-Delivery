import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';

import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { CancelOrderDto } from './dto/cancel-order.dto';
import type { CreateOrderDto } from './dto/create-order.dto';
import type { DeliverOrderDto } from './dto/deliver-order.dto';
import type { FailDeliveryDto } from './dto/fail-delivery.dto';
import type { ManualAssignDriverDto } from './dto/manual-assign-driver.dto';
import type { TransitionNoteDto } from './dto/transition-note.dto';

type OrderStatusValue =
  | 'CREATED'
  | 'ASSIGNED'
  | 'DRIVER_ACCEPTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED_DELIVERY'
  | 'CANCELLED';

const orderDetailInclude = {
  merchant: true,
  customer: {
    include: {
      user: true
    }
  },
  assignedDriver: {
    include: {
      user: true,
      vehicle: true
    }
  },
  city: true,
  zone: true,
  serviceArea: true,
  stops: {
    orderBy: {
      sequence: 'asc'
    }
  },
  assignments: {
    orderBy: {
      assignedAt: 'desc'
    },
    include: {
      assignedByUser: true,
      driver: {
        include: {
          user: true,
          vehicle: true
        }
      }
    }
  },
  statusHistory: {
    orderBy: {
      createdAt: 'asc'
    },
    include: {
      actorUser: true,
      actorDriver: {
        include: {
          user: true
        }
      }
    }
  },
  proofOfDelivery: true,
  settlements: {
    orderBy: {
      createdAt: 'desc'
    }
  }
} as const;

type OrderRecord = Prisma.OrderGetPayload<{ include: typeof orderDetailInclude }>;

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async listOrders(status: string | undefined, user: AuthenticatedUser) {
    const accessWhere = await this.resolveOrderAccessWhere(user);
    const orders = await this.prismaService.order.findMany({
      where: {
        ...accessWhere,
        ...(status
          ? {
              status: status as Prisma.OrderScalarWhereInput['status']
            }
          : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        merchant: true,
        assignedDriver: {
          include: {
            user: true
          }
        },
        stops: {
          orderBy: {
            sequence: 'asc'
          }
        },
        proofOfDelivery: true
      }
    });

    return {
      orders
    };
  }

  async getOrderById(orderId: string, user: AuthenticatedUser) {
    const order = await this.findOrderOrThrow(orderId);
    await this.assertOrderAccessible(order, user);

    return {
      order
    };
  }

  async createOrder(body: CreateOrderDto, user: AuthenticatedUser) {
    this.assertCanCreateOrders(user);
    const customerId = await this.resolveCustomerIdForCreate(user, body.customerId);

    const createdOrder = await this.prismaService.order.create({
      data: {
        referenceCode: this.generateReferenceCode(),
        publicTrackingCode: this.generatePublicTrackingCode(),
        merchantId: body.merchantId,
        customerId,
        cityId: body.cityId,
        zoneId: body.zoneId,
        serviceAreaId: body.serviceAreaId,
        status: 'CREATED',
        paymentCollectionType: body.paymentCollectionType ?? 'COD',
        totalAmount: body.totalAmount,
        codAmount: body.codAmount,
        notes: body.notes,
        stops: {
          create: body.stops.map((stop) => ({
            sequence: stop.sequence,
            type: stop.type,
            label: stop.label,
            addressLine: stop.addressLine,
            contactName: stop.contactName,
            contactPhone: stop.contactPhone,
            latitude: stop.latitude,
            longitude: stop.longitude,
            notes: stop.notes
          }))
        },
        statusHistory: {
          create: {
            status: 'CREATED',
            actorType: 'ADMIN',
            actorUserId: user.id,
            note: body.notes ?? 'Order created.'
          }
        },
        notifications: {
          create: {
            channel: 'INTERNAL',
            template: 'order.created',
            message: 'A new order has been created.',
            status: 'PENDING'
          }
        }
      },
      include: orderDetailInclude
    });

    return {
      order: createdOrder
    };
  }

  async manualAssignDriver(orderId: string, body: ManualAssignDriverDto, user: AuthenticatedUser) {
    this.assertOperationsUser(user, 'Only operations users can manually assign drivers.');
    const order = await this.findOrderOrThrow(orderId);
    await this.ensureMutableOrder(order.status);
    await this.ensureDriverExists(body.driverId);

    const updatedOrder = await this.prismaService.order.update({
      where: { id: orderId },
      data: {
        assignedDriverId: body.driverId,
        status: 'ASSIGNED',
        assignments: {
          create: {
            driverId: body.driverId,
            assignedByUserId: user.id,
            status: 'PENDING',
            note: body.note
          }
        },
        statusHistory: {
          create: {
            status: 'ASSIGNED',
            actorType: 'ADMIN',
            actorUserId: user.id,
            note: body.note ?? 'Driver assigned manually.'
          }
        },
        notifications: {
          create: {
            channel: 'INTERNAL',
            template: 'dispatch.manual_assign',
            message: 'Driver assigned to order.',
            status: 'PENDING'
          }
        }
      },
      include: orderDetailInclude
    });

    return {
      order: updatedOrder
    };
  }

  async driverAccept(orderId: string, body: TransitionNoteDto, user: AuthenticatedUser) {
    this.assertDriverLifecycleUser(user);
    const order = await this.findOrderOrThrow(orderId);
    this.assertStatus(order.status, ['ASSIGNED']);

    const driver = await this.resolveDriverActor(order, user);
    const pendingAssignment = order.assignments.find(
      (assignment) => assignment.driverId === driver.id && assignment.status === 'PENDING'
    );

    if (!pendingAssignment) {
      throw new BadRequestException('No pending assignment exists for this driver.');
    }

    const updatedOrder = await this.prismaService.order.update({
      where: { id: orderId },
      data: {
        status: 'DRIVER_ACCEPTED',
        acceptedAt: new Date(),
        assignments: {
          update: {
            where: { id: pendingAssignment.id },
            data: {
              status: 'ACCEPTED',
              respondedAt: new Date()
            }
          }
        },
        statusHistory: {
          create: {
            status: 'DRIVER_ACCEPTED',
            actorType: 'DRIVER',
            actorDriverId: driver.id,
            note: body.note ?? 'Driver accepted the job.'
          }
        }
      },
      include: orderDetailInclude
    });

    await this.prismaService.driver.update({
      where: { id: driver.id },
      data: { status: 'BUSY' }
    });

    return {
      order: updatedOrder
    };
  }

  async pickupOrder(orderId: string, body: TransitionNoteDto, user: AuthenticatedUser) {
    this.assertDriverLifecycleUser(user);
    const order = await this.findOrderOrThrow(orderId);
    this.assertStatus(order.status, ['DRIVER_ACCEPTED']);
    const actor = await this.resolveActor(order, user);

    return this.transitionOrder(orderId, {
      status: 'PICKED_UP',
      pickedUpAt: new Date(),
      note: body.note ?? 'Order picked up.',
      actor
    });
  }

  async markInTransit(orderId: string, body: TransitionNoteDto, user: AuthenticatedUser) {
    this.assertDriverLifecycleUser(user);
    const order = await this.findOrderOrThrow(orderId);
    this.assertStatus(order.status, ['PICKED_UP']);
    const actor = await this.resolveActor(order, user);

    return this.transitionOrder(orderId, {
      status: 'IN_TRANSIT',
      note: body.note ?? 'Order is in transit.',
      actor
    });
  }

  async deliverOrder(orderId: string, body: DeliverOrderDto, user: AuthenticatedUser) {
    this.assertDriverLifecycleUser(user);
    const order = await this.findOrderOrThrow(orderId);
    this.assertStatus(order.status, ['PICKED_UP', 'IN_TRANSIT']);
    const actor = await this.resolveActor(order, user);

    const updatedOrder = await this.prismaService.order.update({
      where: { id: orderId },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        failureReason: null,
        cancellationReason: null,
        proofOfDelivery: {
          upsert: {
            update: {
              status: 'DELIVERED',
              deliveredPhotoUrl: body.deliveredPhotoUrl,
              otpCode: body.otpCode,
              otpVerifiedAt: body.otpCode ? new Date() : null,
              deliveredAt: new Date(),
              recipientName: body.recipientName
            },
            create: {
              status: 'DELIVERED',
              deliveredPhotoUrl: body.deliveredPhotoUrl,
              otpCode: body.otpCode,
              otpVerifiedAt: body.otpCode ? new Date() : null,
              deliveredAt: new Date(),
              recipientName: body.recipientName
            }
          }
        },
        settlements: Number(order.codAmount) > 0
          ? {
              create: {
                direction: 'CREDIT',
                status: 'PENDING',
                amount: Number(order.codAmount),
                ledgerCode: 'COD_COLLECTION',
                description: 'Pending COD collection settlement.'
              }
            }
          : undefined,
        statusHistory: {
          create: this.buildStatusHistoryCreate('DELIVERED', actor, body.note ?? 'Order delivered successfully.')
        },
        notifications: {
          create: {
            channel: 'INTERNAL',
            template: 'order.delivered',
            message: 'Order marked as delivered.',
            status: 'PENDING'
          }
        }
      },
      include: orderDetailInclude
    });

    if (updatedOrder.assignedDriverId) {
      await this.prismaService.driver.update({
        where: { id: updatedOrder.assignedDriverId },
        data: { status: 'AVAILABLE' }
      });
    }

    return {
      order: updatedOrder
    };
  }

  async failDelivery(orderId: string, body: FailDeliveryDto, user: AuthenticatedUser) {
    this.assertDriverLifecycleUser(user);
    const order = await this.findOrderOrThrow(orderId);
    this.assertStatus(order.status, ['PICKED_UP', 'IN_TRANSIT']);
    const actor = await this.resolveActor(order, user);

    const updatedOrder = await this.prismaService.order.update({
      where: { id: orderId },
      data: {
        status: 'FAILED_DELIVERY',
        failureReason: body.failureReason,
        proofOfDelivery: {
          upsert: {
            update: {
              status: 'FAILED',
              failureReason: body.failureReason
            },
            create: {
              status: 'FAILED',
              failureReason: body.failureReason
            }
          }
        },
        statusHistory: {
          create: this.buildStatusHistoryCreate('FAILED_DELIVERY', actor, body.note ?? body.failureReason)
        },
        notifications: {
          create: {
            channel: 'INTERNAL',
            template: 'order.failed_delivery',
            message: 'Order marked as failed delivery.',
            status: 'PENDING'
          }
        }
      },
      include: orderDetailInclude
    });

    if (updatedOrder.assignedDriverId) {
      await this.prismaService.driver.update({
        where: { id: updatedOrder.assignedDriverId },
        data: { status: 'AVAILABLE' }
      });
    }

    return {
      order: updatedOrder
    };
  }

  async cancelOrder(orderId: string, body: CancelOrderDto, user: AuthenticatedUser) {
    if (user.roles.includes('driver')) {
      throw new ForbiddenException('Drivers cannot cancel orders through this endpoint.');
    }

    const order = await this.findOrderOrThrow(orderId);
    await this.assertOrderAccessible(order, user);
    await this.ensureMutableOrder(order.status);
    const actor = await this.resolveActor(order, user, true);

    const updatedOrder = await this.prismaService.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: body.cancellationReason,
        statusHistory: {
          create: this.buildStatusHistoryCreate('CANCELLED', actor, body.note ?? body.cancellationReason)
        }
      },
      include: orderDetailInclude
    });

    if (updatedOrder.assignedDriverId) {
      await this.prismaService.driver.update({
        where: { id: updatedOrder.assignedDriverId },
        data: { status: 'AVAILABLE' }
      });
    }

    return {
      order: updatedOrder
    };
  }

  private async transitionOrder(
    orderId: string,
    input: {
      status: 'PICKED_UP' | 'IN_TRANSIT';
      pickedUpAt?: Date;
      note: string;
      actor: { actorType: 'ADMIN' | 'DRIVER'; actorUserId?: string; actorDriverId?: string };
    }
  ) {
    const order = await this.prismaService.order.update({
      where: { id: orderId },
      data: {
        status: input.status,
        pickedUpAt: input.pickedUpAt,
        statusHistory: {
          create: this.buildStatusHistoryCreate(input.status, input.actor, input.note)
        }
      },
      include: orderDetailInclude
    });

    return {
      order
    };
  }

  private async findOrderOrThrow(orderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: orderDetailInclude
    });

    if (!order) {
      throw new NotFoundException('Order was not found.');
    }

    return order;
  }

  private async assertOrderAccessible(order: OrderRecord, user: AuthenticatedUser) {
    if (user.roles.includes('driver')) {
      if (order.assignedDriver?.userId !== user.id) {
        throw new ForbiddenException('This driver cannot access the requested order.');
      }

      return;
    }

    if (user.roles.includes('customer') && order.customer?.userId !== user.id) {
      throw new ForbiddenException('This customer cannot access the requested order.');
    }
  }

  private async ensureDriverExists(driverId: string) {
    const driver = await this.prismaService.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver) {
      throw new NotFoundException('Driver was not found.');
    }
  }

  private async resolveDriverActor(
    order: OrderRecord,
    user: AuthenticatedUser
  ) {
    if (user.roles.includes('driver')) {
      const driver = await this.prismaService.driver.findUnique({
        where: { userId: user.id }
      });

      if (!driver) {
        throw new ForbiddenException('Driver actor was not found.');
      }

      if (order.assignedDriverId && order.assignedDriverId !== driver.id) {
        throw new ForbiddenException('This driver is not assigned to the order.');
      }

      return driver;
    }

    if (!order.assignedDriverId) {
      throw new BadRequestException('Order does not have an assigned driver.');
    }

    const driver = await this.prismaService.driver.findUnique({
      where: { id: order.assignedDriverId }
    });

    if (!driver) {
      throw new NotFoundException('Assigned driver was not found.');
    }

    return driver;
  }

  private async resolveActor(
    order: OrderRecord,
    user: AuthenticatedUser,
    adminOnly = false
  ) {
    if (!adminOnly && user.roles.includes('driver')) {
      const driver = await this.resolveDriverActor(order, user);

      return {
        actorType: 'DRIVER' as const,
        actorDriverId: driver.id
      };
    }

    return {
      actorType: 'ADMIN' as const,
      actorUserId: user.id
    };
  }

  private buildStatusHistoryCreate(
    status: OrderStatusValue,
    actor: { actorType: 'ADMIN' | 'DRIVER'; actorUserId?: string; actorDriverId?: string },
    note: string
  ) {
    return {
      status,
      note,
      actorType: actor.actorType,
      actorUserId: actor.actorUserId,
      actorDriverId: actor.actorDriverId
    };
  }

  private assertStatus(currentStatus: OrderStatusValue, allowedStatuses: OrderStatusValue[]) {
    if (!allowedStatuses.includes(currentStatus)) {
      throw new BadRequestException(
        `Order status ${currentStatus} cannot transition through this action.`
      );
    }
  }

  private async ensureMutableOrder(status: OrderStatusValue) {
    if (['DELIVERED', 'FAILED_DELIVERY', 'CANCELLED'].includes(status)) {
      throw new BadRequestException('The order can no longer be changed.');
    }
  }

  private assertOperationsUser(user: AuthenticatedUser, message: string) {
    if (user.roles.includes('driver') || user.roles.includes('customer')) {
      throw new ForbiddenException(message);
    }
  }

  private assertDriverLifecycleUser(user: AuthenticatedUser) {
    if (user.roles.includes('customer')) {
      throw new ForbiddenException('Customers cannot update delivery lifecycle states.');
    }
  }

  private assertCanCreateOrders(user: AuthenticatedUser) {
    if (user.roles.includes('driver')) {
      throw new ForbiddenException('Drivers cannot create new orders.');
    }
  }

  private async resolveOrderAccessWhere(user: AuthenticatedUser): Promise<Prisma.OrderWhereInput> {
    if (user.roles.includes('driver')) {
      const driver = await this.prismaService.driver.findUnique({
        where: { userId: user.id }
      });

      if (!driver) {
        throw new ForbiddenException('Authenticated driver identity was not found.');
      }

      return {
        assignedDriverId: driver.id
      };
    }

    if (user.roles.includes('customer')) {
      const customer = await this.prismaService.customer.findUnique({
        where: { userId: user.id }
      });

      if (!customer) {
        throw new ForbiddenException('Authenticated customer identity was not found.');
      }

      return {
        customerId: customer.id
      };
    }

    return {};
  }

  private async resolveCustomerIdForCreate(user: AuthenticatedUser, requestedCustomerId?: string) {
    if (!user.roles.includes('customer')) {
      return requestedCustomerId;
    }

    const customer = await this.prismaService.customer.findUnique({
      where: { userId: user.id }
    });

    if (!customer) {
      throw new ForbiddenException('Authenticated customer identity was not found.');
    }

    return customer.id;
  }

  private generateReferenceCode() {
    const timestamp = Date.now().toString().slice(-8);
    const suffix = randomBytes(2).toString('hex').toUpperCase();

    return `WDL-${timestamp}-${suffix}`;
  }

  private generatePublicTrackingCode() {
    return randomBytes(6).toString('hex').toUpperCase();
  }
}
