double _asDouble(Object? value) {
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '') ?? 0;
}

class OrderStopInput {
  const OrderStopInput({
    required this.sequence,
    required this.type,
    required this.label,
    required this.addressLine,
    this.contactName,
    this.contactPhone,
  });

  final int sequence;
  final String type;
  final String label;
  final String addressLine;
  final String? contactName;
  final String? contactPhone;

  Map<String, dynamic> toJson() {
    return {
      'sequence': sequence,
      'type': type,
      'label': label,
      'addressLine': addressLine,
      if (contactName != null && contactName!.isNotEmpty)
        'contactName': contactName,
      if (contactPhone != null && contactPhone!.isNotEmpty)
        'contactPhone': contactPhone,
    };
  }
}

class CreateOrderInput {
  const CreateOrderInput({
    required this.totalAmount,
    required this.codAmount,
    required this.stops,
    this.notes,
    this.paymentCollectionType = 'COD',
  });

  final double totalAmount;
  final double codAmount;
  final List<OrderStopInput> stops;
  final String? notes;
  final String paymentCollectionType;

  Map<String, dynamic> toJson() {
    return {
      'totalAmount': totalAmount,
      'codAmount': codAmount,
      'paymentCollectionType': paymentCollectionType,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
      'stops': stops.map((stop) => stop.toJson()).toList(),
    };
  }
}

class DeliveryInput {
  const DeliveryInput({
    this.note,
    this.deliveredPhotoUrl,
    this.otpCode,
    this.recipientName,
  });

  final String? note;
  final String? deliveredPhotoUrl;
  final String? otpCode;
  final String? recipientName;

  Map<String, dynamic> toJson() {
    return {
      if (note != null && note!.isNotEmpty) 'note': note,
      if (deliveredPhotoUrl != null && deliveredPhotoUrl!.isNotEmpty)
        'deliveredPhotoUrl': deliveredPhotoUrl,
      if (otpCode != null && otpCode!.isNotEmpty) 'otpCode': otpCode,
      if (recipientName != null && recipientName!.isNotEmpty)
        'recipientName': recipientName,
    };
  }
}

class FailDeliveryInput {
  const FailDeliveryInput({required this.failureReason, this.note});

  final String failureReason;
  final String? note;

  Map<String, dynamic> toJson() {
    return {
      'failureReason': failureReason,
      if (note != null && note!.isNotEmpty) 'note': note,
    };
  }
}

class LocationUpdateInput {
  const LocationUpdateInput({
    required this.orderId,
    required this.latitude,
    required this.longitude,
    this.accuracyMeters,
  });

  final String orderId;
  final double latitude;
  final double longitude;
  final double? accuracyMeters;

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'latitude': latitude,
      'longitude': longitude,
      if (accuracyMeters != null) 'accuracyMeters': accuracyMeters,
    };
  }
}

class TrackingEntry {
  const TrackingEntry({
    required this.status,
    required this.note,
    required this.createdAt,
  });

  final String status;
  final String note;
  final DateTime? createdAt;

  factory TrackingEntry.fromJson(Map<String, dynamic> json) {
    return TrackingEntry(
      status: json['status'] as String? ?? '',
      note: json['note'] as String? ?? '',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? ''),
    );
  }
}

class DriverLocationRecord {
  const DriverLocationRecord({
    required this.latitude,
    required this.longitude,
    this.accuracyMeters,
    this.capturedAt,
  });

  final double latitude;
  final double longitude;
  final double? accuracyMeters;
  final DateTime? capturedAt;

  factory DriverLocationRecord.fromJson(Map<String, dynamic> json) {
    return DriverLocationRecord(
      latitude: _asDouble(json['latitude']),
      longitude: _asDouble(json['longitude']),
      accuracyMeters: json['accuracyMeters'] == null
          ? null
          : _asDouble(json['accuracyMeters']),
      capturedAt: DateTime.tryParse(json['capturedAt'] as String? ?? ''),
    );
  }
}

class OrderRecord {
  const OrderRecord({
    required this.id,
    required this.referenceCode,
    required this.publicTrackingCode,
    required this.status,
    required this.totalAmount,
    required this.codAmount,
    required this.notes,
    required this.merchantName,
    required this.customerName,
    required this.driverName,
    required this.proofOfDeliveryStatus,
    required this.stops,
    required this.timeline,
    required this.latestLocations,
    required this.raw,
  });

  final String id;
  final String referenceCode;
  final String publicTrackingCode;
  final String status;
  final double totalAmount;
  final double codAmount;
  final String notes;
  final String merchantName;
  final String customerName;
  final String driverName;
  final String proofOfDeliveryStatus;
  final List<OrderStopInput> stops;
  final List<TrackingEntry> timeline;
  final List<DriverLocationRecord> latestLocations;
  final Map<String, dynamic> raw;

  bool get isDelivered => status == 'DELIVERED';

  factory OrderRecord.fromJson(Map<String, dynamic> json) {
    final merchant = json['merchant'] as Map<String, dynamic>?;
    final customer = json['customer'] as Map<String, dynamic>?;
    final customerUser = customer?['user'] as Map<String, dynamic>?;
    final driver = json['assignedDriver'] as Map<String, dynamic>?;
    final driverUser = driver?['user'] as Map<String, dynamic>?;
    final proof = json['proofOfDelivery'] as Map<String, dynamic>?;

    return OrderRecord(
      id: json['id'] as String? ?? '',
      referenceCode: json['referenceCode'] as String? ?? '',
      publicTrackingCode: json['publicTrackingCode'] as String? ?? '',
      status: json['status'] as String? ?? '',
      totalAmount: _asDouble(json['totalAmount']),
      codAmount: _asDouble(json['codAmount']),
      notes: json['notes'] as String? ?? '',
      merchantName: merchant?['name'] as String? ?? 'غير محدد',
      customerName: customerUser == null
          ? 'غير محدد'
          : '${customerUser['firstName'] ?? ''} ${customerUser['lastName'] ?? ''}'
                .trim(),
      driverName: driverUser == null
          ? 'غير مخصص'
          : '${driverUser['firstName'] ?? ''} ${driverUser['lastName'] ?? ''}'
                .trim(),
      proofOfDeliveryStatus: proof?['status'] as String? ?? 'PENDING',
      stops: (json['stops'] as List<dynamic>? ?? const [])
          .map(
            (stop) => OrderStopInput(
              sequence: stop['sequence'] as int? ?? 0,
              type: stop['type'] as String? ?? '',
              label: stop['label'] as String? ?? '',
              addressLine: stop['addressLine'] as String? ?? '',
              contactName: stop['contactName'] as String?,
              contactPhone: stop['contactPhone'] as String?,
            ),
          )
          .toList(),
      timeline: (json['statusHistory'] as List<dynamic>? ?? const [])
          .map((entry) => TrackingEntry.fromJson(entry as Map<String, dynamic>))
          .toList(),
      latestLocations:
          ((json['locations'] ?? json['latestLocations']) as List<dynamic>? ??
                  const [])
              .map(
                (entry) => DriverLocationRecord.fromJson(
                  entry as Map<String, dynamic>,
                ),
              )
              .toList(),
      raw: json,
    );
  }
}

class TrackingSnapshot {
  const TrackingSnapshot({
    required this.referenceCode,
    required this.publicTrackingCode,
    required this.currentStatus,
    required this.timeline,
    required this.locations,
    required this.proofOfDeliveryStatus,
  });

  final String referenceCode;
  final String publicTrackingCode;
  final String currentStatus;
  final List<TrackingEntry> timeline;
  final List<DriverLocationRecord> locations;
  final String proofOfDeliveryStatus;

  factory TrackingSnapshot.fromJson(Map<String, dynamic> json) {
    final proof = json['proofOfDelivery'] as Map<String, dynamic>?;

    return TrackingSnapshot(
      referenceCode: json['referenceCode'] as String? ?? '',
      publicTrackingCode: json['publicTrackingCode'] as String? ?? '',
      currentStatus: json['currentStatus'] as String? ?? '',
      timeline: (json['timeline'] as List<dynamic>? ?? const [])
          .map((entry) => TrackingEntry.fromJson(entry as Map<String, dynamic>))
          .toList(),
      locations:
          ((json['locations'] ?? json['latestLocations']) as List<dynamic>? ??
                  const [])
              .map(
                (entry) => DriverLocationRecord.fromJson(
                  entry as Map<String, dynamic>,
                ),
              )
              .toList(),
      proofOfDeliveryStatus: proof?['status'] as String? ?? 'PENDING',
    );
  }
}
