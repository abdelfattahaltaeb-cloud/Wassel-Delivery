import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ApiError, apiFetch } from './api';
import {
  accessTokenCookieName,
  clearSessionCookieStore,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  refreshTokenCookieName
} from './session';

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  permissions: string[];
};

export async function getAccessTokenOrRedirect() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessTokenCookieName)?.value;

  if (!accessToken) {
    redirect('/login');
  }

  return accessToken;
}

export async function getSessionUserOrRedirect() {
  const accessToken = await getAccessTokenOrRedirect();

  try {
    const response = await apiFetch<{ user: SessionUser }>('/auth/me', { accessToken });

    return {
      accessToken,
      user: response.user
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect('/login');
    }

    throw error;
  }
}

export async function storeSession(tokens: { accessToken: string; refreshToken: string }) {
  const cookieStore = await cookies();

  cookieStore.set(accessTokenCookieName, tokens.accessToken, getAccessTokenCookieOptions(tokens.accessToken));
  cookieStore.set(refreshTokenCookieName, tokens.refreshToken, getRefreshTokenCookieOptions(tokens.refreshToken));
}

export async function clearSession() {
  clearSessionCookieStore(await cookies());
}
