double _asDouble(Object? value) {
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '') ?? 0;
}

class DashboardSummary {
  const DashboardSummary({
    required this.totalOrders,
    required this.activeOrders,
    required this.deliveredOrders,
    required this.failedOrders,
    required this.availableDrivers,
    required this.busyDrivers,
    required this.merchants,
    required this.pendingSettlementAmount,
    required this.codVolume,
  });

  final int totalOrders;
  final int activeOrders;
  final int deliveredOrders;
  final int failedOrders;
  final int availableDrivers;
  final int busyDrivers;
  final int merchants;
  final double pendingSettlementAmount;
  final double codVolume;

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    final orders = json['orders'] as Map<String, dynamic>? ?? const {};
    final fleet = json['fleet'] as Map<String, dynamic>? ?? const {};
    final finance = json['finance'] as Map<String, dynamic>? ?? const {};

    return DashboardSummary(
      totalOrders: orders['total'] as int? ?? 0,
      activeOrders: orders['active'] as int? ?? 0,
      deliveredOrders: orders['delivered'] as int? ?? 0,
      failedOrders: orders['failed'] as int? ?? 0,
      availableDrivers: fleet['availableDrivers'] as int? ?? 0,
      busyDrivers: fleet['busyDrivers'] as int? ?? 0,
      merchants: json['merchants'] as int? ?? 0,
      pendingSettlementAmount: _asDouble(finance['pendingSettlementAmount']),
      codVolume: _asDouble(finance['codVolume']),
    );
  }
}

class DriverRecord {
  const DriverRecord({
    required this.id,
    required this.name,
    required this.email,
    required this.phoneNumber,
    required this.status,
    required this.activeAssignments,
  });

  final String id;
  final String name;
  final String email;
  final String phoneNumber;
  final String status;
  final int activeAssignments;

  factory DriverRecord.fromJson(Map<String, dynamic> json) {
    return DriverRecord(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phoneNumber: json['phoneNumber'] as String? ?? '',
      status: json['status'] as String? ?? '',
      activeAssignments: json['activeAssignments'] as int? ?? 0,
    );
  }
}

class MerchantRecord {
  const MerchantRecord({
    required this.id,
    required this.code,
    required this.name,
    required this.contactName,
    required this.contactPhone,
    required this.city,
    required this.ordersCount,
  });

  final String id;
  final String code;
  final String name;
  final String contactName;
  final String contactPhone;
  final String city;
  final int ordersCount;

  factory MerchantRecord.fromJson(Map<String, dynamic> json) {
    return MerchantRecord(
      id: json['id'] as String? ?? '',
      code: json['code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      contactName: json['contactName'] as String? ?? '',
      contactPhone: json['contactPhone'] as String? ?? '',
      city: json['city'] as String? ?? '',
      ordersCount: json['ordersCount'] as int? ?? 0,
    );
  }
}

class SettlementRecord {
  const SettlementRecord({
    required this.id,
    required this.status,
    required this.direction,
    required this.amount,
    required this.ledgerCode,
    required this.description,
  });

  final String id;
  final String status;
  final String direction;
  final double amount;
  final String ledgerCode;
  final String description;

  factory SettlementRecord.fromJson(Map<String, dynamic> json) {
    return SettlementRecord(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? '',
      direction: json['direction'] as String? ?? '',
      amount: _asDouble(json['amount']),
      ledgerCode: json['ledgerCode'] as String? ?? '',
      description: json['description'] as String? ?? '',
    );
  }
}
