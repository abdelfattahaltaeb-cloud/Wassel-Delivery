'use server';

import { revalidatePath } from 'next/cache';

import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';

export async function assignDriverAction(formData: FormData) {
  const accessToken = await getAccessTokenOrRedirect();
  const orderId = String(formData.get('orderId') ?? '');
  const driverId = String(formData.get('driverId') ?? '');
  const note = String(formData.get('note') ?? '').trim();

  if (!orderId || !driverId) {
    return;
  }

  await apiFetch(`/dispatch/orders/${orderId}/manual-assign`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify({
      driverId,
      note: note || 'تعيين من لوحة التوزيع'
    })
  });

  revalidatePath('/dispatch');
  revalidatePath('/orders');
}
