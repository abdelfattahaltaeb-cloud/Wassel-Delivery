import '../core/api_client.dart';
import '../models/order_models.dart';

class OrdersRepository {
  const OrdersRepository(this._client);

  final WasselApiClient _client;

  Future<List<OrderRecord>> listOrders({String? status}) async {
    final payload = await _client.getJson(
      '/orders',
      queryParameters: status == null || status.isEmpty
          ? null
          : {'status': status},
    );
    final orders =
        (payload as Map<String, dynamic>)['orders'] as List<dynamic>? ??
        const [];

    return orders
        .map((order) => OrderRecord.fromJson(order as Map<String, dynamic>))
        .toList();
  }

  Future<OrderRecord> getOrder(String orderId) async {
    final payload = await _client.getJson('/orders/$orderId');

    return OrderRecord.fromJson(
      (payload as Map<String, dynamic>)['order'] as Map<String, dynamic>,
    );
  }

  Future<OrderRecord> createOrder(CreateOrderInput input) async {
    final payload = await _client.postJson('/orders', body: input.toJson());

    return OrderRecord.fromJson(
      (payload as Map<String, dynamic>)['order'] as Map<String, dynamic>,
    );
  }

  Future<OrderRecord> assignDriver({
    required String orderId,
    required String driverId,
    String? note,
  }) async {
    final payload = await _client.postJson(
      '/dispatch/orders/$orderId/manual-assign',
      body: {
        'driverId': driverId,
        if (note != null && note.isNotEmpty) 'note': note,
      },
    );

    return OrderRecord.fromJson(
      (payload as Map<String, dynamic>)['order'] as Map<String, dynamic>,
    );
  }

  Future<OrderRecord> acceptOrder(String orderId, {String? note}) {
    return _transition(orderId, 'driver-acceptance', note: note);
  }

  Future<OrderRecord> pickupOrder(String orderId, {String? note}) {
    return _transition(orderId, 'pickup', note: note);
  }

  Future<OrderRecord> markInTransit(String orderId, {String? note}) {
    return _transition(orderId, 'in-transit', note: note);
  }

  Future<OrderRecord> deliverOrder(String orderId, DeliveryInput input) async {
    final payload = await _client.postJson(
      '/orders/$orderId/deliver',
      body: input.toJson(),
    );

    return OrderRecord.fromJson(
      (payload as Map<String, dynamic>)['order'] as Map<String, dynamic>,
    );
  }

  Future<OrderRecord> failDelivery(
    String orderId,
    FailDeliveryInput input,
  ) async {
    final payload = await _client.postJson(
      '/orders/$orderId/fail-delivery',
      body: input.toJson(),
    );

    return OrderRecord.fromJson(
      (payload as Map<String, dynamic>)['order'] as Map<String, dynamic>,
    );
  }

  Future<OrderRecord> _transition(
    String orderId,
    String action, {
    String? note,
  }) async {
    final payload = await _client.postJson(
      '/orders/$orderId/$action',
      body: note == null || note.isEmpty
          ? const <String, dynamic>{}
          : {'note': note},
    );

    return OrderRecord.fromJson(
      (payload as Map<String, dynamic>)['order'] as Map<String, dynamic>,
    );
  }
}
