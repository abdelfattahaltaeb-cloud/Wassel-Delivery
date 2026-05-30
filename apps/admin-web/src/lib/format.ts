const currencyFormatter = new Intl.NumberFormat('ar-LY', {
  style: 'currency',
  currency: 'LYD',
  maximumFractionDigits: 2
});

const dateTimeFormatter = new Intl.DateTimeFormat('ar-LY', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const orderStatusLabels: Record<string, string> = {
  CREATED: 'طلب جديد',
  ASSIGNED: 'تم تعيين السائق',
  DRIVER_ACCEPTED: 'قبل السائق الطلب',
  PICKED_UP: 'تم الاستلام',
  IN_TRANSIT: 'في الطريق',
  DELIVERED: 'تم التسليم',
  FAILED_DELIVERY: 'فشل التسليم',
  CANCELLED: 'ملغي',
  PENDING: 'معلق'
};

const driverStatusLabels: Record<string, string> = {
  AVAILABLE: 'متاح',
  BUSY: 'مشغول',
  OFFLINE: 'غير متصل',
  BLOCKED: 'محظور'
};

const settlementStatusLabels: Record<string, string> = {
  PENDING: 'معلق',
  POSTED: 'مرحلة',
  REVERSED: 'معكوسة'
};

const ledgerCodeLabels: Record<string, string> = {
  COD_COLLECTION: 'تحصيل نقدي'
};

export function formatCurrency(value: number | string | null | undefined) {
  const numericValue = Number(value ?? 0);
  return currencyFormatter.format(Number.isFinite(numericValue) ? numericValue : 0);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) {
    return 'غير متاح';
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatOrderStatus(value: string) {
  return orderStatusLabels[value] ?? value;
}

export function formatDriverStatus(value: string) {
  return driverStatusLabels[value] ?? value;
}

export function formatSettlementStatus(value: string) {
  return settlementStatusLabels[value] ?? value;
}

export function formatLedgerCode(value: string) {
  return ledgerCodeLabels[value] ?? value;
}

export function getStatusTone(value: string) {
  if (['DELIVERED', 'AVAILABLE', 'POSTED'].includes(value)) {
    return 'success';
  }

  if (['FAILED_DELIVERY', 'CANCELLED', 'BLOCKED', 'REVERSED'].includes(value)) {
    return 'danger';
  }

  if (['IN_TRANSIT', 'PICKED_UP', 'ASSIGNED', 'DRIVER_ACCEPTED', 'BUSY'].includes(value)) {
    return 'warning';
  }

  return 'neutral';
}
