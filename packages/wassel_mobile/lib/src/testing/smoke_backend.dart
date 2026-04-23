import 'dart:convert';
import 'dart:io';

class SmokeBackend {
  SmokeBackend({required this.baseUrl, required this.seedPassword});

  final String baseUrl;
  final String seedPassword;

  static SmokeBackend current() {
    final configuredBaseUrl = const String.fromEnvironment(
      'WASSEL_API_BASE_URL',
      defaultValue: 'https://api.wassel.net.ly/api',
    );
    final normalizedBaseUrl = configuredBaseUrl.endsWith('/')
        ? configuredBaseUrl.substring(0, configuredBaseUrl.length - 1)
        : configuredBaseUrl;

    return SmokeBackend(
      baseUrl: normalizedBaseUrl,
      seedPassword: const String.fromEnvironment(
        'WASSEL_SEED_DEV_PASSWORD',
        defaultValue: 'DevOnly123!ChangeMe',
      ),
    );
  }

  Future<void> ensureHealthy() async {
    final response = await request('GET', '/health', authenticated: false);
    final dependencies =
        response['dependencies'] as Map<String, dynamic>? ?? const {};

    if (response['status'] != 'ok' ||
        dependencies['postgres'] != 'ok' ||
        dependencies['redis'] != 'ok') {
      throw StateError('Backend health check failed: $response');
    }
  }

  Future<String> loginAsAdmin() => login('admin@wassel-delivery.local');

  Future<String> loginAsCustomer() => login('customer@wassel-delivery.local');

  Future<String> loginAsDriver() => login('driver@wassel-delivery.local');

  Future<String> login(String email) async {
    final response = await request(
      'POST',
      '/auth/login',
      authenticated: false,
      body: {'email': email, 'password': seedPassword},
    );

    final accessToken = response['accessToken'];
    if (accessToken is! String || accessToken.isEmpty) {
      throw StateError('Missing access token for $email: $response');
    }

    return accessToken;
  }

  Future<Map<String, dynamic>> dashboardSummary(String token) {
    return request('GET', '/dashboard-summary', token: token);
  }

  Future<List<Map<String, dynamic>>> listOrders(String token) async {
    final response = await request('GET', '/orders', token: token);
    return _asMapList(response['orders']);
  }

  Future<Map<String, dynamic>> getOrder(String token, String orderId) async {
    final response = await request('GET', '/orders/$orderId', token: token);
    return Map<String, dynamic>.from(response['order'] as Map);
  }

  Future<List<Map<String, dynamic>>> listDrivers(String token) async {
    final response = await request('GET', '/drivers', token: token);
    return _asMapList(response['drivers']);
  }

  Future<List<Map<String, dynamic>>> listMerchants(String token) async {
    final response = await request('GET', '/merchants', token: token);
    return _asMapList(response['merchants']);
  }

  Future<List<Map<String, dynamic>>> listDispatch(String token) async {
    final response = await request('GET', '/dispatch', token: token);
    return _asMapList(response['jobs']);
  }

  Future<List<Map<String, dynamic>>> listSettlements(String token) async {
    final response = await request('GET', '/settlements', token: token);
    return _asMapList(response['settlements']);
  }

  Future<Map<String, dynamic>> createOrder(
    String token, {
    required String note,
  }) async {
    final response = await request(
      'POST',
      '/orders',
      token: token,
      body: {
        'totalAmount': 42,
        'codAmount': 42,
        'paymentCollectionType': 'COD',
        'notes': note,
        'stops': [
          {
            'sequence': 1,
            'type': 'PICKUP',
            'label': 'الاستلام',
            'addressLine': 'سوق الجمعة، طرابلس',
            'contactName': 'نقطة الاستلام',
            'contactPhone': '+218910000101',
          },
          {
            'sequence': 2,
            'type': 'DROPOFF',
            'label': 'التسليم',
            'addressLine': 'حي الأندلس، طرابلس',
            'contactName': 'لينا العميلة',
            'contactPhone': '+218910000004',
          },
        ],
      },
    );

    return Map<String, dynamic>.from(response['order'] as Map);
  }

  Future<Map<String, dynamic>> findOrderByNote(
    String token,
    String note,
  ) async {
    final orders = await listOrders(token);

    for (final order in orders) {
      if (order['notes'] == note) {
        return order;
      }
    }

    throw StateError('Could not find order with note $note');
  }

  Future<Map<String, dynamic>> manualAssignDriver(
    String token,
    String orderId,
    String driverId,
  ) async {
    final response = await request(
      'POST',
      '/dispatch/orders/$orderId/manual-assign',
      token: token,
      body: {'driverId': driverId, 'note': 'smoke-test-assignment'},
    );

    return Map<String, dynamic>.from(response['order'] as Map);
  }

  Future<Map<String, dynamic>> acceptOrder(String token, String orderId) {
    return _orderAction(
      token,
      orderId,
      '/driver-acceptance',
      body: {'note': 'قبول من الاختبار'},
    );
  }

  Future<Map<String, dynamic>> pickupOrder(String token, String orderId) {
    return _orderAction(
      token,
      orderId,
      '/pickup',
      body: {'note': 'استلام من الاختبار'},
    );
  }

  Future<Map<String, dynamic>> markInTransit(String token, String orderId) {
    return _orderAction(
      token,
      orderId,
      '/in-transit',
      body: {'note': 'قيد التوصيل من الاختبار'},
    );
  }

  Future<Map<String, dynamic>> deliverOrder(String token, String orderId) {
    return _orderAction(
      token,
      orderId,
      '/deliver',
      body: {
        'note': 'تسليم من الاختبار',
        'deliveredPhotoUrl': 'https://example.com/pod/smoke.jpg',
        'otpCode': '1234',
        'recipientName': 'مستلم الاختبار',
      },
    );
  }

  Future<Map<String, dynamic>> failDelivery(String token, String orderId) {
    return _orderAction(
      token,
      orderId,
      '/fail-delivery',
      body: {
        'failureReason': 'تعذر الوصول إلى العميل',
        'note': 'فشل من الاختبار',
      },
    );
  }

  Future<void> sendLocation(String token, String orderId) async {
    await request(
      'POST',
      '/tracking/driver-locations',
      token: token,
      body: {
        'orderId': orderId,
        'latitude': 32.8895,
        'longitude': 13.1950,
        'accuracyMeters': 6,
      },
    );
  }

  Future<Map<String, dynamic>> getTracking(String token, String orderId) async {
    final response = await request(
      'GET',
      '/tracking/orders/$orderId/timeline',
      token: token,
    );
    return Map<String, dynamic>.from(response['tracking'] as Map);
  }

  Future<Map<String, dynamic>> getPublicTracking(String trackingCode) async {
    final response = await request(
      'GET',
      '/tracking/public/$trackingCode',
      authenticated: false,
    );
    return Map<String, dynamic>.from(response['tracking'] as Map);
  }

  Future<Map<String, dynamic>> request(
    String method,
    String path, {
    String? token,
    bool authenticated = true,
    Object? body,
  }) async {
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 20);

    try {
      final request = await client.openUrl(method, Uri.parse('$baseUrl$path'));
      request.headers.contentType = ContentType.json;
      request.headers.set(HttpHeaders.acceptHeader, 'application/json');
      if (authenticated && token != null) {
        request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $token');
      }
      if (body != null) {
        request.write(jsonEncode(body));
      }

      final response = await request.close();
      final responseBody = await response.transform(utf8.decoder).join();
      final decoded = responseBody.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(responseBody) as Map<String, dynamic>;

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw StateError(
          'Request failed [$method $path]: ${response.statusCode} $decoded',
        );
      }

      return decoded;
    } finally {
      client.close(force: true);
    }
  }

  Future<Map<String, dynamic>> _orderAction(
    String token,
    String orderId,
    String suffix, {
    required Map<String, dynamic> body,
  }) async {
    final response = await request(
      'POST',
      '/orders/$orderId$suffix',
      token: token,
      body: body,
    );
    return Map<String, dynamic>.from(response['order'] as Map);
  }

  List<Map<String, dynamic>> _asMapList(Object? value) {
    if (value is! List) {
      return const [];
    }

    return value
        .whereType<Map>()
        .map((entry) => Map<String, dynamic>.from(entry))
        .toList();
  }
}
