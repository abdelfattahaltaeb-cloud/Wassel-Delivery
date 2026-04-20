import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Prisma } from '@prisma/client';

import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { hashSecret, verifySecret } from '../../common/security/password.util';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { AuthSession, AuthTokens, JwtTokenPayload } from './auth.types';

const authUserInclude = {
  roleAssignments: {
    include: {
      role: {
        include: {
          permissionGrants: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.UserInclude;

type AuthUserRecord = Prisma.UserGetPayload<{ include: typeof authUserInclude }>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(body: LoginDto): Promise<AuthSession> {
    const user = await this.findUserByEmail(body.email);

    if (!user || !verifySecret(body.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User is not active.');
    }

    const authUser = this.mapAuthenticatedUser(user);
    const tokens = await this.issueTokens(authUser);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        refreshTokenHash: hashSecret(tokens.refreshToken)
      }
    });

    return {
      ...tokens,
      user: authUser
    };
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    const payload = await this.verifyToken(refreshToken, this.getRefreshSecret());
    const user = await this.findUserById(payload.sub);

    if (!user?.refreshTokenHash || !verifySecret(refreshToken, user.refreshTokenHash)) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User is not active.');
    }

    const authUser = this.mapAuthenticatedUser(user);
    const tokens = await this.issueTokens(authUser);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: hashSecret(tokens.refreshToken)
      }
    });

    return {
      ...tokens,
      user: authUser
    };
  }

  async logout(userId: string) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null
      }
    });

    return {
      success: true
    };
  }

  async getMe(userId: string) {
    const user = await this.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException('Authenticated user was not found.');
    }

    return {
      user: this.mapAuthenticatedUser(user)
    };
  }

  async verifyAccessToken(token: string) {
    const payload = await this.verifyToken(token, this.getAccessSecret());
    const user = await this.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Authenticated user was not found.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User is not active.');
    }

    return this.mapAuthenticatedUser(user);
  }

  private async issueTokens(authUser: AuthenticatedUser): Promise<AuthTokens> {
    const payload: JwtTokenPayload = {
      sub: authUser.id,
      email: authUser.email,
      roles: authUser.roles,
      permissions: authUser.permissions
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.getAccessSecret(),
      expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m') as never
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.getRefreshSecret(),
      expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d') as never
    });

    return {
      accessToken,
      refreshToken
    };
  }

  private async verifyToken(token: string, secret: string) {
    try {
      return await this.jwtService.verifyAsync<JwtTokenPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException('Token verification failed.');
    }
  }

  private getAccessSecret() {
    return this.configService.get<string>('JWT_ACCESS_SECRET', '<JWT_ACCESS_SECRET>');
  }

  private getRefreshSecret() {
    return this.configService.get<string>('JWT_REFRESH_SECRET', '<JWT_REFRESH_SECRET>');
  }

  private async findUserByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: {
        email: email.toLowerCase()
      },
      include: authUserInclude
    });
  }

  private async findUserById(userId: string) {
    return this.prismaService.user.findUnique({
      where: {
        id: userId
      },
      include: authUserInclude
    });
  }

  private mapAuthenticatedUser(user: AuthUserRecord): AuthenticatedUser {
    const roleCodes = user.roleAssignments.map((assignment) => assignment.role.code);
    const permissionCodes = user.roleAssignments.flatMap((assignment) =>
      assignment.role.permissionGrants.map((grant) => grant.permission.code)
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: [...new Set(roleCodes)],
      permissions: [...new Set(permissionCodes)]
    };
  }
}
