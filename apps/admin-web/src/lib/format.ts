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
  CREATED: 'تم الإنشاء',
  ASSIGNED: 'تم الإسناد',
  DRIVER_ACCEPTED: 'قبول السائق',
  PICKED_UP: 'تم الاستلام',
  IN_TRANSIT: 'قيد التوصيل',
  DELIVERED: 'تم التسليم',
  FAILED_DELIVERY: 'فشل التسليم',
  CANCELLED: 'ملغي'
};

const driverStatusLabels: Record<string, string> = {
  AVAILABLE: 'متاح',
  BUSY: 'مشغول',
  OFFLINE: 'غير متصل',
  BLOCKED: 'محظور'
};

const settlementStatusLabels: Record<string, string> = {
  PENDING: 'معلقة',
  POSTED: 'مرحلة',
  REVERSED: 'معكوسة'
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
