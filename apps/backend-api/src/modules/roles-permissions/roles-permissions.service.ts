import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class RolesPermissionsService {
  constructor(private readonly prismaService: PrismaService) {}

  async listRolesAndPermissions() {
    const [roles, permissions] = await Promise.all([
      this.prismaService.role.findMany({
        orderBy: { code: 'asc' },
        include: {
          permissionGrants: {
            include: {
              permission: true
            }
          }
        }
      }),
      this.prismaService.permission.findMany({
        orderBy: { code: 'asc' }
      })
    ]);

    return {
      roles: roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        permissions: role.permissionGrants.map((grant) => ({
          code: grant.permission.code,
          name: grant.permission.name
        }))
      })),
      permissions
    };
  }
}
