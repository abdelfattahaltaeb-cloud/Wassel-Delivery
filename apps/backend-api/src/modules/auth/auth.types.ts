import type { AuthenticatedUser } from '../../common/auth/authenticated-user.interface';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = AuthTokens & {
  user: AuthenticatedUser;
};

export type JwtTokenPayload = {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  tokenType: 'access' | 'refresh';
  sessionId: string;
  tokenFamilyId: string;
};

export type IssuedSession = {
  sessionId: string;
  familyId: string;
  expiresAt: Date;
  accessToken: string;
  refreshToken: string;
};
