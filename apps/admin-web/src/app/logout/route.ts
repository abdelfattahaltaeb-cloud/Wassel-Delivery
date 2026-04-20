import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { apiFetch } from '../../lib/api';
import {
  accessTokenCookieName,
  clearSessionCookies,
  refreshTokenCookieName
} from '../../lib/session';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(accessTokenCookieName)?.value;
  const refreshToken = cookieStore.get(refreshTokenCookieName)?.value;
  const response = NextResponse.redirect(new URL('/login', request.url));

  try {
    if (accessToken) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        accessToken,
        body: JSON.stringify(refreshToken ? { refreshToken } : {})
      });
    }
  } catch {
    // Clear local session cookies regardless of backend logout outcome.
  }

  clearSessionCookies(response);

  return response;
}
