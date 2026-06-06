import { formatDateTime } from './format';

export const unavailableLabel = 'غير متاح حالياً';
export const notConfiguredLabel = 'جاهز للإضافة لاحقاً';

export const parcelStageLabels = [
  'محفوظ عند المتجر',
  'مرسل من المتجر',
  'قيد التجهيز',
  'محفوظ ومرسل للمتجر',
  'في الشركة',
  'إلى المندوب',
  'عند المندوب',
  'تم التسليم',
  'معين للمهمة',
  'تمت التسوية / موردة',
  'مدفوع إلكترونياً',
  'دولي'
] as const;

export type ParcelFilter =
  | 'all'
  | 'new'
  | 'in-company'
  | 'with-courier'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'settled'
  | 'electronic-payment'
  | 'international';

export const parcelFilters: Array<{ key: ParcelFilter; label: string }> = [
  { key: 'all', label: 'الكل' },
  { key: 'new', label: 'جديد' },
  { key: 'in-company', label: 'في الشركة' },
  { key: 'with-courier', label: 'مع المندوب' },
  { key: 'delivered', label: 'تم التسليم' },
  { key: 'failed', label: 'فشل التسليم' },
  { key: 'returned', label: 'راجع' },
  { key: 'settled', label: 'تمت التسوية' },
  { key: 'electronic-payment', label: 'مدفوع إلكترونياً' },
  { key: 'international', label: 'دولي' }
];

type StageInput = {
  status: string;
  paymentCollectionType?: string | null;
  settlements?: Array<{ status: string }> | null;
};

export function getParcelOperationalStage(input: StageInput) {
  if (input.paymentCollectionType === 'PREPAID') {
    return 'مدفوع إلكترونياً';
  }

  if (input.settlements?.some((settlement) => settlement.status === 'POSTED')) {
    return 'تمت التسوية / موردة';
  }

  switch (input.status) {
    case 'CREATED':
      return 'محفوظ عند المتجر';
    case 'ASSIGNED':
      return 'معين للمهمة';
    case 'DRIVER_ACCEPTED':
      return 'إلى المندوب';
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return 'عند المندوب';
    case 'DELIVERED':
      return 'تم التسليم';
    case 'FAILED_DELIVERY':
      return 'محفوظ ومرسل للمتجر';
    case 'CANCELLED':
      return 'محفوظ ومرسل للمتجر';
    default:
      return 'قيد التجهيز';
  }
}

export function getParcelFilterForOrder(input: StageInput): ParcelFilter {
  if (input.paymentCollectionType === 'PREPAID') {
    return 'electronic-payment';
  }

  if (input.settlements?.some((settlement) => settlement.status === 'POSTED')) {
    return 'settled';
  }

  switch (input.status) {
    case 'CREATED':
      return 'new';
    case 'ASSIGNED':
    case 'DRIVER_ACCEPTED':
      return 'in-company';
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      return 'with-courier';
    case 'DELIVERED':
      return 'delivered';
    case 'FAILED_DELIVERY':
      return 'failed';
    case 'CANCELLED':
      return 'returned';
    default:
      return 'all';
  }
}

export function matchesParcelFilter(input: StageInput, filter: string | undefined) {
  if (!filter || filter === 'all') {
    return true;
  }

  return getParcelFilterForOrder(input) === filter;
}

type StopSummary = {
  type: string;
  label: string;
  addressLine: string;
  contactName?: string | null;
  contactPhone?: string | null;
};

export function getRecipientName(stops: StopSummary[]) {
  const dropoff = stops.find((stop) => stop.type === 'DROPOFF') ?? stops.at(-1);
  return dropoff?.contactName || dropoff?.label || unavailableLabel;
}

export function getRecipientPhone(stops: StopSummary[]) {
  const dropoff = stops.find((stop) => stop.type === 'DROPOFF') ?? stops.at(-1);
  return dropoff?.contactPhone || unavailableLabel;
}

export function getDeliveryAddress(stops: StopSummary[]) {
  const dropoff = stops.find((stop) => stop.type === 'DROPOFF') ?? stops.at(-1);
  return dropoff?.addressLine || unavailableLabel;
}

export function getRouteSummary(stops: StopSummary[]) {
  if (stops.length === 0) {
    return unavailableLabel;
  }

  const pickup = stops.find((stop) => stop.type === 'PICKUP') ?? stops[0];
  const dropoff = stops.find((stop) => stop.type === 'DROPOFF') ?? stops.at(-1);

  return `${pickup?.label ?? 'نقطة غير محددة'} إلى ${dropoff?.label ?? 'وجهة غير محددة'}`;
}

export function getTimelineSummary(history: Array<{ status: string; createdAt: string }>) {
  if (history.length === 0) {
    return 'لا يوجد سجل مراحل بعد';
  }

  const latest = history.at(-1);
  return `${history.length} مراحل، آخر تحديث ${formatDateTime(latest?.createdAt)}`;
}
