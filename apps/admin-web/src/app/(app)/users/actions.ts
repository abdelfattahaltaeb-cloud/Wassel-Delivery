'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function activeStatus(formData: FormData) {
  return value(formData, 'status') === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
}

export async function createUserAction(formData: FormData) {
  const accessToken = await getAccessTokenOrRedirect();

  await apiFetch('/users', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({
      name: value(formData, 'name'),
      email: value(formData, 'email'),
      phone: value(formData, 'phone'),
      role: value(formData, 'role'),
      status: activeStatus(formData),
      temporaryPassword: value(formData, 'temporaryPassword'),
      linkProfile: formData.get('linkProfile') === 'on',
      defaultAddress: value(formData, 'defaultAddress') || undefined
    })
  });

  revalidatePath('/users');
  redirect('/users');
}

export async function createDriverAction(formData: FormData) {
  const accessToken = await getAccessTokenOrRedirect();

  await apiFetch('/users/create-driver', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({
      name: value(formData, 'name'),
      email: value(formData, 'email'),
      phone: value(formData, 'phone'),
      secondPhone: value(formData, 'secondPhone') || undefined,
      city: value(formData, 'city'),
      serviceArea: value(formData, 'serviceArea'),
      branch: value(formData, 'branch') || undefined,
      transportMethod: value(formData, 'transportMethod'),
      vehiclePlate: value(formData, 'vehiclePlate') || undefined,
      temporaryPassword: value(formData, 'temporaryPassword'),
      active: activeStatus(formData) === 'ACTIVE'
    })
  });

  revalidatePath('/users');
  revalidatePath('/drivers');
  redirect('/users');
}

export async function createCustomerAction(formData: FormData) {
  const accessToken = await getAccessTokenOrRedirect();

  await apiFetch('/users/create-customer', {
    method: 'POST',
    accessToken,
    body: JSON.stringify({
      name: value(formData, 'name'),
      email: value(formData, 'email'),
      phone: value(formData, 'phone'),
      city: value(formData, 'city'),
      area: value(formData, 'area') || undefined,
      defaultAddress: value(formData, 'defaultAddress') || undefined,
      temporaryPassword: value(formData, 'temporaryPassword'),
      active: activeStatus(formData) === 'ACTIVE'
    })
  });

  revalidatePath('/users');
  redirect('/users');
}

export async function updateUserAction(formData: FormData) {
  const accessToken = await getAccessTokenOrRedirect();
  const userId = value(formData, 'userId');

  await apiFetch(`/users/${userId}`, {
    method: 'PATCH',
    accessToken,
    body: JSON.stringify({
      name: value(formData, 'name'),
      email: value(formData, 'email'),
      phone: value(formData, 'phone'),
      role: value(formData, 'role'),
      status: activeStatus(formData)
    })
  });

  revalidatePath('/users');
  revalidatePath(`/users/${userId}`);
  redirect('/users');
}

export async function activateUserAction(formData: FormData) {
  const accessToken = await getAccessTokenOrRedirect();
  const userId = value(formData, 'userId');
  await apiFetch(`/users/${userId}/activate`, { method: 'POST', accessToken });
  revalidatePath('/users');
}

export async function deactivateUserAction(formData: FormData) {
  const accessToken = await getAccessTokenOrRedirect();
  const userId = value(formData, 'userId');
  await apiFetch(`/users/${userId}/deactivate`, { method: 'POST', accessToken });
  revalidatePath('/users');
}

export async function resetPasswordAction(formData: FormData) {
  const accessToken = await getAccessTokenOrRedirect();
  const userId = value(formData, 'userId');
  await apiFetch(`/users/${userId}/reset-password`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify({
      temporaryPassword: value(formData, 'temporaryPassword')
    })
  });
  revalidatePath('/users');
}
