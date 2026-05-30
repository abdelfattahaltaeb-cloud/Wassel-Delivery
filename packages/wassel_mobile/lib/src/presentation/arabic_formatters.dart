String formatArabicOrderStatus(String value) {
  return _labels[value] ?? value;
}

String formatArabicDriverStatus(String value) {
  return _labels[value] ?? value;
}

String formatArabicSettlementStatus(String value) {
  return _labels[value] ?? value;
}

String formatArabicLedgerCode(String value) {
  return _labels[value] ?? value;
}

String formatArabicStopType(String value) {
  return _labels[value] ?? value;
}

String formatArabicCurrency(num value) {
  return '${value.toStringAsFixed(2)} د.ل';
}

String formatArabicDateTime(DateTime? value) {
  if (value == null) {
    return 'غير متاح';
  }

  final date = '${value.year}-${_two(value.month)}-${_two(value.day)}';
  final time = '${_two(value.hour)}:${_two(value.minute)}';
  return '$date $time';
}

String _two(int value) => value.toString().padLeft(2, '0');

const _labels = {
  'CREATED': 'طلب جديد',
  'ASSIGNED': 'تم تعيين السائق',
  'DRIVER_ACCEPTED': 'قبل السائق الطلب',
  'PICKED_UP': 'تم الاستلام',
  'IN_TRANSIT': 'في الطريق',
  'DELIVERED': 'تم التسليم',
  'FAILED_DELIVERY': 'فشل التسليم',
  'CANCELLED': 'ملغي',
  'PENDING': 'معلق',
  'POSTED': 'مرحّل',
  'REVERSED': 'معكوس',
  'AVAILABLE': 'متاح',
  'BUSY': 'مشغول',
  'OFFLINE': 'غير متصل',
  'BLOCKED': 'محظور',
  'COD_COLLECTION': 'تحصيل نقدي',
  'PICKUP': 'استلام',
  'DROPOFF': 'تسليم',
  'CREDIT': 'دائن',
  'DEBIT': 'مدين',
};
