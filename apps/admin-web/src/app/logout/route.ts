import { NextResponse } from 'next/server';

import { accessTokenCookieName, refreshTokenCookieName } from '../../lib/auth';

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url));

  response.cookies.delete(accessTokenCookieName);
  response.cookies.delete(refreshTokenCookieName);

  return response;
}
