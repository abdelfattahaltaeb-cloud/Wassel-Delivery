import type { NextResponse } from 'next/server';

import { getApiBaseUrl } from './api';

export const accessTokenCookieName = 'wassel_delivery_admin_access_token';
export const refreshTokenCookieName = 'wassel_delivery_admin_refresh_token';

type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

type SessionCookieOptions = {
  httpOnly: true;
  sameSite: 'lax' | 'strict' | 'none';
  secure: boolean;
  path: '/';
  maxAge: number;
  domain?: string;
};

type CookieStore = {
  set(name: string, value: string, options: SessionCookieOptions): void;
};

type JwtPayload = {
  exp?: number;
};

const accessTokenFallbackMaxAge = 60 * 15;
const refreshTokenFallbackMaxAge = 60 * 60 * 24 * 7;
const refreshWindowSeconds = 15;

export function getAccessTokenCookieOptions(token: string): SessionCookieOptions {
  return buildSessionCookieOptions(getTokenMaxAgeSeconds(token, accessTokenFallbackMaxAge));
}

export function getRefreshTokenCookieOptions(token: string): SessionCookieOptions {
  return buildSessionCookieOptions(getTokenMaxAgeSeconds(token, refreshTokenFallbackMaxAge));
}

export function clearSessionCookieStore(cookieStore: CookieStore) {
  const expiredOptions = buildSessionCookieOptions(0);

  cookieStore.set(accessTokenCookieName, '', expiredOptions);
  cookieStore.set(refreshTokenCookieName, '', expiredOptions);
}

export function applySessionCookies(response: NextResponse, tokens: SessionTokens) {
  response.cookies.set(accessTokenCookieName, tokens.accessToken, getAccessTokenCookieOptions(tokens.accessToken));
  response.cookies.set(
    refreshTokenCookieName,
    tokens.refreshToken,
    getRefreshTokenCookieOptions(tokens.refreshToken)
  );
}

export function clearSessionCookies(response: NextResponse) {
  clearSessionCookieStore(response.cookies);
}

export function hasUsableAccessToken(token?: string | null) {
  const payload = decodeJwtPayload(token);

  return Boolean(payload?.exp && payload.exp > Math.floor(Date.now() / 1000) + refreshWindowSeconds);
}

export async function requestSessionRefresh(refreshToken: string) {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Partial<SessionTokens>;

    if (!payload.accessToken || !payload.refreshToken) {
      return null;
    }

    return {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken
    };
  } catch {
    return null;
  }
}

function buildSessionCookieOptions(maxAge: number): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: getSameSiteValue(),
    secure: getSecureValue(),
    path: '/',
    maxAge,
    ...(process.env.SESSION_COOKIE_DOMAIN ? { domain: process.env.SESSION_COOKIE_DOMAIN } : {})
  };
}

function getSecureValue() {
  const configuredValue = process.env.SESSION_COOKIE_SECURE?.toLowerCase();

  if (configuredValue === 'true') {
    return true;
  }

  if (configuredValue === 'false') {
    return false;
  }

  return process.env.NODE_ENV === 'production';
}

function getSameSiteValue(): SessionCookieOptions['sameSite'] {
  const configuredValue = process.env.SESSION_COOKIE_SAME_SITE?.toLowerCase();

  if (configuredValue === 'strict' || configuredValue === 'none') {
    return configuredValue;
  }

  return 'lax';
}

function getTokenMaxAgeSeconds(token: string, fallbackMaxAge: number) {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return fallbackMaxAge;
  }

  return Math.max(payload.exp - Math.floor(Date.now() / 1000), 0);
}

function decodeJwtPayload(token?: string | null): JwtPayload | null {
  if (!token) {
    return null;
  }

  const segments = token.split('.');
  const payloadSegment = segments[1];

  if (segments.length !== 3 || !payloadSegment) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(payloadSegment)) as JwtPayload;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string) {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddedValue = normalizedValue.padEnd(Math.ceil(normalizedValue.length / 4) * 4, '=');

  if (typeof atob === 'function') {
    return atob(paddedValue);
  }

  return Buffer.from(paddedValue, 'base64').toString('utf8');
}