import { randomUUID } from 'node:crypto';

import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Prisma } from '@prisma/client';

import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';
import { hashSecret, verifySecret } from '../../common/security/password.util';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { AuthSession, IssuedSession, JwtTokenPayload } from './auth.types';

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

type JwtSettings = {
  accessSecret: string;
  refreshSecret: string;
  accessTtl: string;
  refreshTtl: string;
  issuer: string;
  audience: string;
};

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

    const baseUser = this.mapAuthenticatedUser(user);
    const issuedSession = await this.issueSession(baseUser);

    await this.prismaService.$transaction(async (transaction) => {
      await transaction.refreshSession.updateMany({
        where: {
          userId: user.id,
          revokedAt: null
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'superseded_by_new_login'
        }
      });

      await transaction.refreshSession.create({
        data: this.buildRefreshSessionRecord(user.id, issuedSession)
      });

      await transaction.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date()
        }
      });
    });

    return {
      accessToken: issuedSession.accessToken,
      refreshToken: issuedSession.refreshToken,
      user: this.mapAuthenticatedUser(user, {
        sessionId: issuedSession.sessionId,
        tokenFamilyId: issuedSession.familyId
      })
    };
  }

  async refresh(refreshToken: string): Promise<AuthSession> {
    const payload = await this.verifyToken(refreshToken, 'refresh');
    const session = await this.prismaService.refreshSession.findUnique({
      where: {
        id: payload.sessionId
      },
      include: {
        user: {
          include: authUserInclude
        }
      }
    });

    if (!session || session.familyId !== payload.tokenFamilyId) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (session.revokedAt) {
      await this.revokeSessionFamily(session.familyId, 'refresh_token_reuse_detected');
      throw new UnauthorizedException('Refresh token has already been revoked.');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.revokeSession(session.id, 'refresh_token_expired');
      throw new UnauthorizedException('Refresh token expired.');
    }

    if (!verifySecret(refreshToken, session.tokenHash)) {
      await this.revokeSessionFamily(session.familyId, 'refresh_token_hash_mismatch');
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (session.user.status !== 'ACTIVE') {
      await this.revokeSessionFamily(session.familyId, 'user_inactive');
      throw new ForbiddenException('User is not active.');
    }

    const baseUser = this.mapAuthenticatedUser(session.user);
    const nextSession = await this.issueSession(baseUser, session.familyId);

    await this.prismaService.$transaction(async (transaction) => {
      await transaction.refreshSession.update({
        where: { id: session.id },
        data: {
          revokedAt: new Date(),
          revokedReason: 'rotated',
          replacedBySessionId: nextSession.sessionId,
          lastUsedAt: new Date()
        }
      });

      await transaction.refreshSession.create({
        data: this.buildRefreshSessionRecord(session.userId, nextSession)
      });

      await transaction.user.update({
        where: { id: session.userId },
        data: {
          lastLoginAt: new Date()
        }
      });
    });

    return {
      accessToken: nextSession.accessToken,
      refreshToken: nextSession.refreshToken,
      user: this.mapAuthenticatedUser(session.user, {
        sessionId: nextSession.sessionId,
        tokenFamilyId: nextSession.familyId
      })
    };
  }

  async logout(user: AuthenticatedUser, refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = await this.verifyToken(refreshToken, 'refresh');

        if (payload.sub === user.id) {
          await this.revokeSessionFamily(payload.tokenFamilyId, 'logout');

          return {
            success: true
          };
        }
      } catch {
        // Ignore invalid refresh tokens during logout and fall back to current access context.
      }
    }

    if (user.tokenFamilyId) {
      await this.revokeSessionFamily(user.tokenFamilyId, 'logout');
    } else if (user.sessionId) {
      await this.revokeSession(user.sessionId, 'logout');
    } else {
      await this.revokeUserSessions(user.id, 'logout');
    }

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
    const payload = await this.verifyToken(token, 'access');
    const user = await this.findUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Authenticated user was not found.');
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User is not active.');
    }

    return this.mapAuthenticatedUser(user, {
      sessionId: payload.sessionId,
      tokenFamilyId: payload.tokenFamilyId
    });
  }

  private async issueSession(
    authUser: AuthenticatedUser,
    existingFamilyId: string = randomUUID()
  ): Promise<IssuedSession> {
    const jwtSettings = this.getJwtSettings();
    const sessionId = randomUUID();
    const tokenFamilyId = existingFamilyId;

    const accessPayload = this.buildTokenPayload(authUser, 'access', sessionId, tokenFamilyId);
    const refreshPayload = this.buildTokenPayload(authUser, 'refresh', sessionId, tokenFamilyId);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: jwtSettings.accessSecret,
        expiresIn: jwtSettings.accessTtl as never,
        issuer: jwtSettings.issuer,
        audience: jwtSettings.audience
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: jwtSettings.refreshSecret,
        expiresIn: jwtSettings.refreshTtl as never,
        issuer: jwtSettings.issuer,
        audience: jwtSettings.audience
      })
    ]);

    return {
      sessionId,
      familyId: tokenFamilyId,
      expiresAt: this.getExpirationDate(refreshToken),
      accessToken,
      refreshToken
    };
  }

  private async verifyToken(token: string, tokenType: 'access' | 'refresh') {
    const jwtSettings = this.getJwtSettings();

    try {
      const payload = await this.jwtService.verifyAsync<JwtTokenPayload>(token, {
        secret: tokenType === 'access' ? jwtSettings.accessSecret : jwtSettings.refreshSecret,
        issuer: jwtSettings.issuer,
        audience: jwtSettings.audience
      });

      if (
        payload.tokenType !== tokenType ||
        !payload.sessionId ||
        !payload.tokenFamilyId
      ) {
        throw new UnauthorizedException('Token verification failed.');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Token verification failed.');
    }
  }

  private getJwtSettings() {
    return this.configService.getOrThrow<JwtSettings>('app.jwt');
  }

  private buildTokenPayload(
    authUser: AuthenticatedUser,
    tokenType: 'access' | 'refresh',
    sessionId: string,
    tokenFamilyId: string
  ): JwtTokenPayload {
    return {
      sub: authUser.id,
      email: authUser.email,
      roles: authUser.roles,
      permissions: authUser.permissions,
      tokenType,
      sessionId,
      tokenFamilyId
    };
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

  private buildRefreshSessionRecord(userId: string, issuedSession: IssuedSession) {
    return {
      id: issuedSession.sessionId,
      userId,
      familyId: issuedSession.familyId,
      tokenHash: hashSecret(issuedSession.refreshToken),
      expiresAt: issuedSession.expiresAt
    };
  }

  private getExpirationDate(token: string) {
    const decoded = this.jwtService.decode(token);

    if (!decoded || typeof decoded !== 'object' || typeof decoded.exp !== 'number') {
      throw new UnauthorizedException('Issued token is missing expiration metadata.');
    }

    return new Date(decoded.exp * 1000);
  }

  private async revokeSession(sessionId: string, reason: string) {
    await this.prismaService.refreshSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    });
  }

  private async revokeSessionFamily(familyId: string, reason: string) {
    await this.prismaService.refreshSession.updateMany({
      where: {
        familyId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    });
  }

  private async revokeUserSessions(userId: string, reason: string) {
    await this.prismaService.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason
      }
    });
  }

  private mapAuthenticatedUser(
    user: AuthUserRecord,
    tokenContext?: Pick<AuthenticatedUser, 'sessionId' | 'tokenFamilyId'>
  ): AuthenticatedUser {
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
      permissions: [...new Set(permissionCodes)],
      sessionId: tokenContext?.sessionId,
      tokenFamilyId: tokenContext?.tokenFamilyId
    };
  }
}
