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
  const response = NextResponse.redirect(new URL('/login', getPublicOrigin(request)));

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

function getPublicOrigin(request: Request) {
  const forwardedHost = firstForwardedValue(request.headers.get('x-forwarded-host'));
  const host = forwardedHost ?? request.headers.get('host');
  const forwardedProto = firstForwardedValue(request.headers.get('x-forwarded-proto')) ?? 'https';

  if (host && !host.startsWith('0.0.0.0')) {
    return `${forwardedProto}://${host}`;
  }

  return new URL(request.url).origin;
}

function firstForwardedValue(value: string | null) {
  return value?.split(',')[0]?.trim() || null;
}
