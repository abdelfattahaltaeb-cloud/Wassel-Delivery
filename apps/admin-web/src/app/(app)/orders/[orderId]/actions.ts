'use server';

import { revalidatePath } from 'next/cache';

import { apiFetch } from '../../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../../lib/auth';

export async function updateOrderStatusAction(formData: FormData) {
  const accessToken = await getAccessTokenOrRedirect();
  const orderId = String(formData.get('orderId') ?? '');
  const action = String(formData.get('action') ?? '');
  const note = String(formData.get('note') ?? '').trim();
  const failureReason = String(formData.get('failureReason') ?? '').trim();

  if (!orderId || !action) {
    return;
  }

  const body =
    action === 'deliver'
      ? {
          note,
          recipientName: 'تم الإغلاق من لوحة الإدارة'
        }
      : action === 'fail-delivery'
        ? {
            note,
            failureReason: failureReason || 'تعذر إكمال التوصيل'
          }
        : note
          ? { note }
          : {};

  await apiFetch(`/orders/${orderId}/${action}`, {
    method: 'POST',
    accessToken,
    body: JSON.stringify(body)
  });

  revalidatePath(`/orders/${orderId}`);
  revalidatePath('/orders');
  revalidatePath('/dispatch');
}
