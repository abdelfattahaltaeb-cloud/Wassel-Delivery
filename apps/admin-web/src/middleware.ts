import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  accessTokenCookieName,
  applySessionCookies,
  clearSessionCookies,
  hasUsableAccessToken,
  refreshTokenCookieName,
  requestSessionRefresh
} from './lib/session';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get(accessTokenCookieName)?.value ?? null;
  const refreshToken = request.cookies.get(refreshTokenCookieName)?.value ?? null;

  if (pathname === '/login') {
    if (hasUsableAccessToken(accessToken)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (refreshToken) {
      const refreshedSession = await requestSessionRefresh(refreshToken);

      if (refreshedSession) {
        const response = NextResponse.redirect(new URL('/dashboard', request.url));
        applySessionCookies(response, refreshedSession);

        return response;
      }
    }

    const response = NextResponse.next();

    if (accessToken || refreshToken) {
      clearSessionCookies(response);
    }

    return response;
  }

  if (hasUsableAccessToken(accessToken)) {
    return NextResponse.next();
  }

  if (refreshToken) {
    const refreshedSession = await requestSessionRefresh(refreshToken);

    if (refreshedSession) {
      const response = NextResponse.next();
      applySessionCookies(response, refreshedSession);

      return response;
    }
  }

  const response = NextResponse.redirect(new URL('/login', request.url));
  clearSessionCookies(response);

  return response;
}

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/orders/:path*',
    '/drivers/:path*',
    '/merchants/:path*',
    '/dispatch/:path*',
    '/settlements/:path*',
    '/reports/:path*',
    '/settings/:path*'
  ]
};