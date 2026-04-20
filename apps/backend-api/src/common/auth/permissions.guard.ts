import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AuthenticatedUser } from './authenticated-user.interface';
import { REQUIRED_PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly reflector = new Reflector();

  canActivate(context: ExecutionContext) {
    const permissions = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!permissions || permissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ authUser?: AuthenticatedUser }>();
    const authUser = request.authUser;

    if (!authUser) {
      throw new ForbiddenException('Authenticated user context is missing.');
    }

    const hasAllPermissions = permissions.every((permission) =>
      authUser.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Insufficient permissions for this endpoint.');
    }

    return true;
  }
}
