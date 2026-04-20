import { Prisma, PrismaClient } from '@prisma/client';

import { hashSecret } from '../src/common/security/password.util';

const prisma = new PrismaClient();

const localDevPassword = process.env.SEED_LOCAL_PASSWORD ?? 'LocalDev123!';

const permissionCatalog = [
  ['dashboard.summary.read', 'Read dashboard summary'],
  ['orders.read', 'Read orders'],
  ['orders.write', 'Manage orders'],
  ['dispatch.read', 'Read dispatch board'],
  ['dispatch.write', 'Manage dispatch assignments'],
  ['tracking.read', 'Read tracking timeline'],
  ['tracking.write', 'Publish tracking updates'],
  ['drivers.read', 'Read drivers'],
  ['merchants.read', 'Read merchants'],
  ['settlements.read', 'Read settlements'],
  ['roles.read', 'Read roles and permissions']
] as const;

const roleCatalog = [
  {
    code: 'super_admin',
    name: 'Super Admin',
    permissions: permissionCatalog.map(([code]) => code)
  },
  {
    code: 'operations_manager',
    name: 'Operations Manager',
    permissions: [
      'dashboard.summary.read',
      'orders.read',
      'orders.write',
      'dispatch.read',
      'dispatch.write',
      'tracking.read',
      'drivers.read',
      'merchants.read',
      'settlements.read'
    ]
  },
  {
    code: 'dispatcher',
    name: 'Dispatcher',
    permissions: [
      'orders.read',
      'dispatch.read',
      'dispatch.write',
      'tracking.read',
      'drivers.read',
      'merchants.read'
    ]
  },
  {
    code: 'driver',
    name: 'Driver',
    permissions: ['orders.read', 'orders.write', 'tracking.write']
  }
] as const;

async function main() {
  await resetDatabase();

  const hashedPassword = hashSecret(localDevPassword);

  await prisma.permission.createMany({
    data: permissionCatalog.map(([code, name]) => ({ code, name })),
    skipDuplicates: true
  });

  const permissions = await prisma.permission.findMany();
  const permissionMap = new Map(permissions.map((permission) => [permission.code, permission.id]));

  for (const role of roleCatalog) {
    await prisma.role.create({
      data: {
        code: role.code,
        name: role.name
      }
    });
  }

  const roles = await prisma.role.findMany();
  const roleMap = new Map(roles.map((role) => [role.code, role.id]));

  await prisma.rolePermission.createMany({
    data: roleCatalog.flatMap((role) =>
      role.permissions.map((permissionCode) => ({
        roleId: roleMap.get(role.code)!,
        permissionId: permissionMap.get(permissionCode)!
      }))
    ),
    skipDuplicates: true
  });

  const tripoli = await prisma.city.create({
    data: {
      name: 'Tripoli',
      code: 'TIP'
    }
  });

  const downtownZone = await prisma.zone.create({
    data: {
      cityId: tripoli.id,
      name: 'Downtown',
      code: 'TIP-DT'
    }
  });

  const downtownServiceArea = await prisma.serviceArea.create({
    data: {
      cityId: tripoli.id,
      zoneId: downtownZone.id,
      name: 'Downtown Core',
      code: 'TIP-DT-CORE'
    }
  });

  await prisma.pricingRule.createMany({
    data: [
      {
        code: 'BASE-TRIPOLI',
        name: 'Base Delivery Fee',
        type: 'BASE_FEE',
        cityId: tripoli.id,
        amount: new Prisma.Decimal('12.00')
      },
      {
        code: 'COD-TRIPOLI',
        name: 'COD Surcharge',
        type: 'COD_SURCHARGE',
        serviceAreaId: downtownServiceArea.id,
        amount: new Prisma.Decimal('4.50')
      }
    ]
  });

  const merchant = await prisma.merchant.create({
    data: {
      cityId: tripoli.id,
      serviceAreaId: downtownServiceArea.id,
      name: 'Al Manara Market',
      code: 'MER-ALMANARA',
      contactName: 'Ops Desk',
      contactPhone: '+218910000101'
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@wassel-delivery.local',
      passwordHash: hashedPassword,
      firstName: 'Platform',
      lastName: 'Admin',
      phoneNumber: '+218910000001',
      status: 'ACTIVE'
    }
  });

  const dispatcherUser = await prisma.user.create({
    data: {
      email: 'dispatcher@wassel-delivery.local',
      passwordHash: hashedPassword,
      firstName: 'Dispatch',
      lastName: 'Lead',
      phoneNumber: '+218910000002',
      status: 'ACTIVE'
    }
  });

  const driverUser = await prisma.user.create({
    data: {
      email: 'driver@wassel-delivery.local',
      passwordHash: hashedPassword,
      firstName: 'Sami',
      lastName: 'Driver',
      phoneNumber: '+218910000003',
      status: 'ACTIVE'
    }
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@wassel-delivery.local',
      passwordHash: hashedPassword,
      firstName: 'Lina',
      lastName: 'Customer',
      phoneNumber: '+218910000004',
      status: 'ACTIVE'
    }
  });

  await prisma.userRole.createMany({
    data: [
      { userId: adminUser.id, roleId: roleMap.get('super_admin')! },
      { userId: dispatcherUser.id, roleId: roleMap.get('dispatcher')! },
      { userId: driverUser.id, roleId: roleMap.get('driver')! }
    ]
  });

  const customer = await prisma.customer.create({
    data: {
      userId: customerUser.id,
      defaultAddressLine: 'Shara Omar Almukhtar, Tripoli'
    }
  });

  const driver = await prisma.driver.create({
    data: {
      userId: driverUser.id,
      status: 'BUSY',
      licenseNumber: 'DRV-LY-001'
    }
  });

  await prisma.vehicle.create({
    data: {
      driverId: driver.id,
      plateNumber: '5-12345',
      type: 'CAR',
      make: 'Toyota',
      model: 'Yaris',
      color: 'White'
    }
  });

  await prisma.driverAvailability.create({
    data: {
      driverId: driver.id,
      serviceAreaId: downtownServiceArea.id,
      status: 'ON_DELIVERY',
      notes: 'Seeded operational availability snapshot.'
    }
  });

  const deliveredOrder = await prisma.order.create({
    data: {
      referenceCode: 'WDL-SEED-1001',
      publicTrackingCode: 'TRACK1001',
      merchantId: merchant.id,
      customerId: customer.id,
      cityId: tripoli.id,
      zoneId: downtownZone.id,
      serviceAreaId: downtownServiceArea.id,
      assignedDriverId: driver.id,
      status: 'DELIVERED',
      paymentCollectionType: 'COD',
      totalAmount: new Prisma.Decimal('84.50'),
      codAmount: new Prisma.Decimal('84.50'),
      acceptedAt: new Date('2025-01-15T09:15:00.000Z'),
      pickedUpAt: new Date('2025-01-15T09:40:00.000Z'),
      deliveredAt: new Date('2025-01-15T10:05:00.000Z'),
      notes: 'Delivered seed order.',
      stops: {
        create: [
          {
            sequence: 1,
            type: 'PICKUP',
            label: 'Merchant Pickup',
            addressLine: 'Souq Aljumaa, Tripoli',
            contactName: 'Ops Desk',
            contactPhone: '+218910000101'
          },
          {
            sequence: 2,
            type: 'DROPOFF',
            label: 'Customer Dropoff',
            addressLine: 'Hay Al Andalus, Tripoli',
            contactName: 'Lina Customer',
            contactPhone: '+218910000004'
          }
        ]
      },
      assignments: {
        create: {
          driverId: driver.id,
          assignedByUserId: dispatcherUser.id,
          status: 'ACCEPTED',
          note: 'Seeded manual dispatch.',
          assignedAt: new Date('2025-01-15T09:05:00.000Z'),
          respondedAt: new Date('2025-01-15T09:10:00.000Z')
        }
      },
      statusHistory: {
        create: [
          {
            status: 'CREATED',
            actorType: 'ADMIN',
            actorUserId: adminUser.id,
            note: 'Order created in seed.'
          },
          {
            status: 'ASSIGNED',
            actorType: 'ADMIN',
            actorUserId: dispatcherUser.id,
            note: 'Driver assigned manually.'
          },
          {
            status: 'DRIVER_ACCEPTED',
            actorType: 'DRIVER',
            actorDriverId: driver.id,
            note: 'Driver accepted the job.'
          },
          {
            status: 'PICKED_UP',
            actorType: 'DRIVER',
            actorDriverId: driver.id,
            note: 'Order picked up.'
          },
          {
            status: 'DELIVERED',
            actorType: 'DRIVER',
            actorDriverId: driver.id,
            note: 'Order delivered.'
          }
        ]
      },
      proofOfDelivery: {
        create: {
          status: 'DELIVERED',
          deliveredPhotoUrl: 'https://example.com/pod/wdl-seed-1001.jpg',
          otpCode: '1001',
          otpVerifiedAt: new Date('2025-01-15T10:05:00.000Z'),
          deliveredAt: new Date('2025-01-15T10:05:00.000Z'),
          recipientName: 'Lina Customer'
        }
      },
      settlements: {
        create: {
          direction: 'CREDIT',
          status: 'PENDING',
          amount: new Prisma.Decimal('84.50'),
          ledgerCode: 'COD_COLLECTION',
          description: 'Seeded COD ledger entry.'
        }
      },
      notifications: {
        create: {
          channel: 'INTERNAL',
          status: 'SENT',
          template: 'order.delivered',
          message: 'Seeded delivered notification.',
          sentAt: new Date('2025-01-15T10:06:00.000Z')
        }
      }
    }
  });

  const inTransitOrder = await prisma.order.create({
    data: {
      referenceCode: 'WDL-SEED-1002',
      publicTrackingCode: 'TRACK1002',
      merchantId: merchant.id,
      customerId: customer.id,
      cityId: tripoli.id,
      zoneId: downtownZone.id,
      serviceAreaId: downtownServiceArea.id,
      assignedDriverId: driver.id,
      status: 'IN_TRANSIT',
      paymentCollectionType: 'PREPAID',
      totalAmount: new Prisma.Decimal('59.00'),
      codAmount: new Prisma.Decimal('0.00'),
      acceptedAt: new Date('2025-01-15T11:15:00.000Z'),
      pickedUpAt: new Date('2025-01-15T11:35:00.000Z'),
      notes: 'Seeded live tracking order.',
      stops: {
        create: [
          {
            sequence: 1,
            type: 'PICKUP',
            label: 'Merchant Pickup',
            addressLine: 'Souq Aljumaa, Tripoli'
          },
          {
            sequence: 2,
            type: 'DROPOFF',
            label: 'Customer Dropoff',
            addressLine: 'Ben Ashour, Tripoli'
          }
        ]
      },
      assignments: {
        create: {
          driverId: driver.id,
          assignedByUserId: dispatcherUser.id,
          status: 'ACCEPTED',
          note: 'Seeded active dispatch.',
          assignedAt: new Date('2025-01-15T11:05:00.000Z'),
          respondedAt: new Date('2025-01-15T11:10:00.000Z')
        }
      },
      statusHistory: {
        create: [
          {
            status: 'CREATED',
            actorType: 'ADMIN',
            actorUserId: adminUser.id,
            note: 'Order created in seed.'
          },
          {
            status: 'ASSIGNED',
            actorType: 'ADMIN',
            actorUserId: dispatcherUser.id,
            note: 'Driver assigned manually.'
          },
          {
            status: 'DRIVER_ACCEPTED',
            actorType: 'DRIVER',
            actorDriverId: driver.id,
            note: 'Driver accepted the job.'
          },
          {
            status: 'PICKED_UP',
            actorType: 'DRIVER',
            actorDriverId: driver.id,
            note: 'Order picked up.'
          },
          {
            status: 'IN_TRANSIT',
            actorType: 'DRIVER',
            actorDriverId: driver.id,
            note: 'Order is moving to customer.'
          }
        ]
      },
      driverLocations: {
        create: [
          {
            driverId: driver.id,
            latitude: 32.8872,
            longitude: 13.1913,
            accuracyMeters: 8
          },
          {
            driverId: driver.id,
            latitude: 32.8895,
            longitude: 13.195,
            accuracyMeters: 6
          }
        ]
      }
    }
  });

  const createdOrder = await prisma.order.create({
    data: {
      referenceCode: 'WDL-SEED-1003',
      publicTrackingCode: 'TRACK1003',
      merchantId: merchant.id,
      customerId: customer.id,
      cityId: tripoli.id,
      zoneId: downtownZone.id,
      serviceAreaId: downtownServiceArea.id,
      status: 'CREATED',
      paymentCollectionType: 'COD',
      totalAmount: new Prisma.Decimal('33.00'),
      codAmount: new Prisma.Decimal('33.00'),
      notes: 'Unassigned seed order for manual dispatch testing.',
      stops: {
        create: [
          {
            sequence: 1,
            type: 'PICKUP',
            label: 'Merchant Pickup',
            addressLine: 'Gargaresh, Tripoli'
          },
          {
            sequence: 2,
            type: 'DROPOFF',
            label: 'Customer Dropoff',
            addressLine: 'Fashloum, Tripoli'
          }
        ]
      },
      statusHistory: {
        create: {
          status: 'CREATED',
          actorType: 'ADMIN',
          actorUserId: adminUser.id,
          note: 'Seed order waiting for dispatch.'
        }
      }
    }
  });

  console.log(
    JSON.stringify(
      {
        seeded: true,
        cityId: tripoli.id,
        serviceAreaId: downtownServiceArea.id,
        merchantId: merchant.id,
        driverId: driver.id,
        customerId: customer.id,
        orderIds: [deliveredOrder.id, inTransitOrder.id, createdOrder.id],
        users: {
          adminEmail: adminUser.email,
          dispatcherEmail: dispatcherUser.email,
          driverEmail: driverUser.email
        }
      },
      null,
      2
    )
  );
}

async function resetDatabase() {
  await prisma.notification.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.proofOfDelivery.deleteMany();
  await prisma.driverLocationUpdate.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.orderStop.deleteMany();
  await prisma.order.deleteMany();
  await prisma.driverAvailability.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.merchant.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.city.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.user.deleteMany();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });