export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
  sessionId?: string;
  tokenFamilyId?: string;
};
