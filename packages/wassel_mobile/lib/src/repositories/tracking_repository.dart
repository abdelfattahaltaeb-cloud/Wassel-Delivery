import '../core/api_client.dart';
import '../models/order_models.dart';

class TrackingRepository {
  const TrackingRepository(this._client);

  final WasselApiClient _client;

  Future<TrackingSnapshot> getOrderTimeline(String orderId) async {
    final payload = await _client.getJson('/tracking/orders/$orderId/timeline');

    return TrackingSnapshot.fromJson(
      (payload as Map<String, dynamic>)['tracking'] as Map<String, dynamic>,
    );
  }

  Future<TrackingSnapshot> getPublicTracking(String trackingCode) async {
    final payload = await _client.getJson(
      '/tracking/public/$trackingCode',
      authenticated: false,
      allowRefresh: false,
    );

    return TrackingSnapshot.fromJson(
      (payload as Map<String, dynamic>)['tracking'] as Map<String, dynamic>,
    );
  }

  Future<void> sendLocation(LocationUpdateInput input) async {
    await _client.postJson('/tracking/driver-locations', body: input.toJson());
  }
}
