import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import type { Prisma, Role, User } from '@prisma/client';

import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { safeUserSelect } from '../../common/data/safe-user-select';
import { hashSecret } from '../../common/security/password.util';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { RegisterCustomerDto } from '../auth/dto/register-customer.dto';
import type { CreateCustomerUserDto } from './dto/create-customer-user.dto';
import type { CreateDriverUserDto } from './dto/create-driver-user.dto';
import { supportedUserRoles, type CreateUserDto } from './dto/create-user.dto';
import type { ResetPasswordDto, UpdateUserDto } from './dto/update-user.dto';

type SupportedRole = (typeof supportedUserRoles)[number];
type UserWithRelations = Prisma.UserGetPayload<{ include: typeof userInclude }>;

const userInclude = {
  roleAssignments: {
    include: {
      role: true
    }
  },
  driver: {
    include: {
      vehicle: true,
      availabilitySnapshots: {
        orderBy: { recordedAt: 'desc' as const },
        take: 1,
        include: {
          serviceArea: {
            include: {
              city: true
            }
          }
        }
      }
    }
  },
  customer: true
} satisfies Prisma.UserInclude;

const roleCatalog: Record<SupportedRole, { name: string; permissions: string[] }> = {
  super_admin: {
    name: 'Super Admin',
    permissions: [
      'dashboard.summary.read',
      'orders.read',
      'orders.write',
      'dispatch.read',
      'dispatch.write',
      'tracking.read',
      'tracking.write',
      'drivers.read',
      'drivers.write',
      'customers.read',
      'customers.write',
      'users.read',
      'users.write',
      'roles.read',
      'roles.manage',
      'merchants.read',
      'settlements.read'
    ]
  },
  admin: {
    name: 'Admin',
    permissions: [
      'dashboard.summary.read',
      'orders.read',
      'orders.write',
      'dispatch.read',
      'dispatch.write',
      'tracking.read',
      'drivers.read',
      'drivers.write',
      'customers.read',
      'customers.write',
      'users.read',
      'users.write',
      'merchants.read',
      'settlements.read'
    ]
  },
  dispatcher: {
    name: 'Dispatcher',
    permissions: ['orders.read', 'orders.write', 'dispatch.read', 'dispatch.write', 'tracking.read', 'drivers.read', 'merchants.read']
  },
  finance: {
    name: 'Finance',
    permissions: ['dashboard.summary.read', 'orders.read', 'settlements.read', 'users.read']
  },
  support: {
    name: 'Support',
    permissions: ['orders.read', 'tracking.read', 'customers.read', 'users.read']
  },
  driver: {
    name: 'Driver',
    permissions: ['orders.read', 'orders.write', 'tracking.write']
  },
  customer: {
    name: 'Customer',
    permissions: ['orders.read', 'orders.write', 'tracking.read']
  },
  merchant_admin: {
    name: 'Merchant Admin',
    permissions: ['orders.read', 'orders.write', 'tracking.read']
  }
};

const permissionNames: Record<string, string> = {
  'dashboard.summary.read': 'Read dashboard summary',
  'orders.read': 'Read orders',
  'orders.write': 'Manage orders',
  'dispatch.read': 'Read dispatch board',
  'dispatch.write': 'Manage dispatch assignments',
  'tracking.read': 'Read tracking timeline',
  'tracking.write': 'Publish tracking updates',
  'drivers.read': 'Read drivers',
  'drivers.write': 'Manage drivers',
  'customers.read': 'Read customers',
  'customers.write': 'Manage customers',
  'users.read': 'Read users',
  'users.write': 'Manage users',
  'roles.read': 'Read roles and permissions',
  'roles.manage': 'Manage roles and permissions',
  'merchants.read': 'Read merchants',
  'settlements.read': 'Read settlements'
};

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async listUsers(actor: AuthenticatedUser) {
    this.assertCanReadUsers(actor);
    const users = await this.prismaService.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: userInclude
    });

    return {
      users: users.map((user) => this.mapUser(user))
    };
  }

  async getUser(userId: string, actor: AuthenticatedUser) {
    this.assertCanReadUsers(actor);
    const user = await this.findUserOrThrow(userId);

    return {
      user: this.mapUser(user)
    };
  }

  async createUser(body: CreateUserDto, actor: AuthenticatedUser) {
    this.assertCanCreateRole(body.role, actor);
    const user = await this.createBaseUser({
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.temporaryPassword,
      role: body.role,
      status: body.status ?? 'ACTIVE'
    });

    if (body.linkProfile || body.role === 'driver' || body.role === 'customer') {
      await this.ensureOperationalProfile(user.id, body.role, { defaultAddress: body.defaultAddress });
    }

    return {
      user: this.mapUser(await this.findUserOrThrow(user.id))
    };
  }

  async updateUser(userId: string, body: UpdateUserDto, actor: AuthenticatedUser) {
    this.assertCanWriteUsers(actor);
    const current = await this.findUserOrThrow(userId);

    if (body.role && !current.roleAssignments.some((assignment) => assignment.role.code === body.role)) {
      this.assertSuperAdmin(actor, 'Only super_admin can change user roles.');
    }

    const nameParts = body.name ? this.splitName(body.name) : undefined;

    await this.prismaService.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: userId },
        data: {
          ...(body.email ? { email: body.email.toLowerCase().trim() } : {}),
          ...(body.phone ? { phoneNumber: body.phone.trim() } : {}),
          ...(body.status ? { status: body.status } : {}),
          ...(nameParts
            ? {
                firstName: nameParts.firstName,
                lastName: nameParts.lastName
              }
            : {})
        }
      });

      if (body.role) {
        const role = await this.ensureSupportedRole(body.role, transaction);
        await transaction.userRole.deleteMany({ where: { userId } });
        await transaction.userRole.create({
          data: {
            userId,
            roleId: role.id
          }
        });
        await this.ensureOperationalProfile(userId, body.role, {}, transaction);
      }
    });

    return {
      user: this.mapUser(await this.findUserOrThrow(userId))
    };
  }

  async activateUser(userId: string, actor: AuthenticatedUser) {
    this.assertCanWriteUsers(actor);
    await this.prismaService.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' }
    });

    return this.getUser(userId, actor);
  }

  async deactivateUser(userId: string, actor: AuthenticatedUser) {
    this.assertCanWriteUsers(actor);
    if (userId === actor.id) {
      throw new BadRequestException('Users cannot deactivate their own account.');
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' }
    });

    return this.getUser(userId, actor);
  }

  async resetPassword(userId: string, body: ResetPasswordDto, actor: AuthenticatedUser) {
    this.assertCanWriteUsers(actor);
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashSecret(body.temporaryPassword),
        refreshSessions: {
          updateMany: {
            where: { revokedAt: null },
            data: {
              revokedAt: new Date(),
              revokedReason: 'password_reset'
            }
          }
        }
      }
    });

    return {
      success: true
    };
  }

  async createDriver(body: CreateDriverUserDto, actor: AuthenticatedUser) {
    this.assertCanCreateRole('driver', actor);
    const user = await this.createBaseUser({
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.temporaryPassword,
      role: 'driver',
      status: body.active === false ? 'SUSPENDED' : 'ACTIVE'
    });

    const serviceArea = await this.findServiceArea(body.serviceArea, body.city);
    const driver = await this.prismaService.driver.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: body.active === false ? 'OFFLINE' : 'AVAILABLE'
      },
      update: {
        status: body.active === false ? 'OFFLINE' : 'AVAILABLE'
      }
    });

    if (body.vehiclePlate && (body.transportMethod === 'CAR' || body.transportMethod === 'BIKE')) {
      const vehicleType = body.transportMethod;

      await this.prismaService.vehicle.upsert({
        where: { driverId: driver.id },
        create: {
          driverId: driver.id,
          plateNumber: body.vehiclePlate,
          type: vehicleType
        },
        update: {
          plateNumber: body.vehiclePlate,
          type: vehicleType
        }
      });
    }

    await this.prismaService.driverAvailability.create({
      data: {
        driverId: driver.id,
        serviceAreaId: serviceArea?.id,
        status: body.active === false ? 'OFFLINE' : 'AVAILABLE',
        notes: `Created by admin. City: ${body.city}. Service area: ${body.serviceArea}. Branch: ${body.branch ?? 'none'}. Second phone: ${body.secondPhone ?? 'none'}.`
      }
    });

    return {
      user: this.mapUser(await this.findUserOrThrow(user.id))
    };
  }

  async createCustomer(body: CreateCustomerUserDto, actor: AuthenticatedUser) {
    this.assertCanCreateRole('customer', actor);
    const user = await this.createBaseUser({
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.temporaryPassword,
      role: 'customer',
      status: body.active === false ? 'SUSPENDED' : 'ACTIVE'
    });

    await this.prismaService.customer.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        defaultAddressLine: this.buildCustomerAddress(body.defaultAddress, body.area, body.city)
      },
      update: {
        defaultAddressLine: this.buildCustomerAddress(body.defaultAddress, body.area, body.city)
      }
    });

    return {
      user: this.mapUser(await this.findUserOrThrow(user.id))
    };
  }

  async registerCustomer(body: RegisterCustomerDto) {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('كلمة المرور وتأكيدها غير متطابقين.');
    }

    const user = await this.createBaseUser({
      name: body.name,
      email: body.email,
      phone: body.phone,
      password: body.password,
      role: 'customer',
      status: 'ACTIVE'
    });

    await this.prismaService.customer.create({
      data: {
        userId: user.id,
        defaultAddressLine: this.buildCustomerAddress(
          body.defaultPickupAddress,
          body.defaultArea,
          body.city
        )
      }
    });

    return this.findUserOrThrow(user.id);
  }

  async listSupportedRoles(actor: AuthenticatedUser) {
    this.assertCanReadUsers(actor);
    const roles = await this.prismaService.role.findMany({
      where: {
        code: {
          in: [...supportedUserRoles]
        }
      }
    });
    const roleMap = new Map(roles.map((role) => [role.code, role]));

    return {
      roles: supportedUserRoles.map((roleCode) => ({
        id: roleMap.get(roleCode)?.id ?? null,
        code: roleCode,
        name: roleMap.get(roleCode)?.name ?? roleCatalog[roleCode].name
      }))
    };
  }

  private async createBaseUser(input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: SupportedRole;
    status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  }) {
    const existing = await this.prismaService.user.findUnique({
      where: { email: input.email.toLowerCase().trim() }
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists.');
    }

    const nameParts = this.splitName(input.name);
    const role = await this.ensureSupportedRole(input.role);

    return this.prismaService.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        passwordHash: hashSecret(input.password),
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        phoneNumber: input.phone.trim(),
        status: input.status,
        roleAssignments: {
          create: {
            roleId: role.id
          }
        }
      },
      select: safeUserSelect
    });
  }

  private async findUserOrThrow(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: userInclude
    });

    if (!user) {
      throw new NotFoundException('User was not found.');
    }

    return user;
  }

  private async ensureSupportedRole(
    roleCode: SupportedRole,
    transaction: Prisma.TransactionClient = this.prismaService
  ): Promise<Role> {
    const catalogEntry = roleCatalog[roleCode];

    const role = await transaction.role.upsert({
      where: { code: roleCode },
      create: {
        code: roleCode,
        name: catalogEntry.name
      },
      update: {
        name: catalogEntry.name
      }
    });

    const permissions = await Promise.all(
      catalogEntry.permissions.map((permissionCode) =>
        transaction.permission.upsert({
          where: { code: permissionCode },
          create: {
            code: permissionCode,
            name: permissionNames[permissionCode] ?? permissionCode
          },
          update: {
            name: permissionNames[permissionCode] ?? permissionCode
          }
        })
      )
    );

    await transaction.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id
      })),
      skipDuplicates: true
    });

    return role;
  }

  private async ensureOperationalProfile(
    userId: string,
    role: SupportedRole,
    options: { defaultAddress?: string },
    transaction: Prisma.TransactionClient = this.prismaService
  ) {
    if (role === 'driver') {
      await transaction.driver.upsert({
        where: { userId },
        create: {
          userId,
          status: 'OFFLINE'
        },
        update: {}
      });
    }

    if (role === 'customer') {
      await transaction.customer.upsert({
        where: { userId },
        create: {
          userId,
          defaultAddressLine: options.defaultAddress
        },
        update: {
          ...(options.defaultAddress ? { defaultAddressLine: options.defaultAddress } : {})
        }
      });
    }

    // TODO: add admin/customer/driver audit events when an audit log model exists.
  }

  private async findServiceArea(serviceArea: string, city: string) {
    return this.prismaService.serviceArea.findFirst({
      where: {
        OR: [
          { code: serviceArea.trim() },
          { name: { equals: serviceArea.trim(), mode: 'insensitive' } }
        ],
        city: {
          OR: [
            { code: city.trim() },
            { name: { equals: city.trim(), mode: 'insensitive' } }
          ]
        }
      }
    });
  }

  private mapUser(user: UserWithRelations) {
    const roles = user.roleAssignments.map((assignment) => assignment.role.code);
    const latestAvailability = user.driver?.availabilitySnapshots[0] ?? null;

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phoneNumber,
      role: roles[0] ?? null,
      roles,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      createdBy: null,
      profiles: {
        admin: roles.some((role) => ['super_admin', 'admin', 'dispatcher', 'finance', 'support'].includes(role)),
        driver: user.driver
          ? {
              id: user.driver.id,
              status: user.driver.status,
              vehicle: user.driver.vehicle,
              latestAvailability
            }
          : null,
        customer: user.customer
          ? {
              id: user.customer.id,
              defaultAddressLine: user.customer.defaultAddressLine
            }
          : null,
        merchantUser: null
      }
    };
  }

  private splitName(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      throw new BadRequestException('Name is required.');
    }

    return {
      firstName: parts[0]!,
      lastName: parts.slice(1).join(' ')
    };
  }

  private buildCustomerAddress(address?: string, area?: string, city?: string) {
    return [address, area, city].map((part) => part?.trim()).filter(Boolean).join('، ') || null;
  }

  private assertCanReadUsers(actor: AuthenticatedUser) {
    this.assertAdminPortalActor(actor);
    if (
      actor.roles.includes('super_admin') ||
      actor.roles.includes('admin') ||
      actor.permissions.includes('users.read') ||
      actor.permissions.includes('users.write')
    ) {
      return;
    }

    throw new ForbiddenException('Insufficient permissions to read users.');
  }

  private assertCanWriteUsers(actor: AuthenticatedUser) {
    this.assertAdminPortalActor(actor);
    if (
      actor.roles.includes('super_admin') ||
      actor.roles.includes('admin') ||
      actor.permissions.includes('users.write')
    ) {
      return;
    }

    throw new ForbiddenException('Insufficient permissions to manage users.');
  }

  private assertCanCreateRole(role: SupportedRole, actor: AuthenticatedUser) {
    this.assertCanWriteUsers(actor);

    if (actor.roles.includes('super_admin')) {
      return;
    }

    if (['driver', 'customer'].includes(role)) {
      return;
    }

    throw new ForbiddenException('Only super_admin can create admin or permission-bearing users.');
  }

  private assertSuperAdmin(actor: AuthenticatedUser, message: string) {
    if (!actor.roles.includes('super_admin')) {
      throw new ForbiddenException(message);
    }
  }

  private assertAdminPortalActor(actor: AuthenticatedUser) {
    if (actor.roles.includes('driver') || actor.roles.includes('customer')) {
      throw new ForbiddenException('Driver and customer users cannot access admin user management.');
    }
  }
}
