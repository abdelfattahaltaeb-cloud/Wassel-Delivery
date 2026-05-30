'use server';

import { redirect } from 'next/navigation';

import { apiFetch } from '../../../lib/api';
import { clearSession, storeSession } from '../../../lib/auth';

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '').trim();

  if (!email || !password) {
    redirect('/login?error=missing');
  }

  let response: LoginResponse;

  try {
    response = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  } catch {
    await clearSession();
    redirect('/login?error=invalid');
  }

  await storeSession(response);
  redirect('/dashboard');
}
