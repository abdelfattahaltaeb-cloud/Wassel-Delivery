import '../core/api_client.dart';
import '../models/operations_models.dart';
import '../models/order_models.dart';

class OperationsRepository {
  const OperationsRepository(this._client);

  final WasselApiClient _client;

  Future<DashboardSummary> getDashboardSummary() async {
    final payload = await _client.getJson('/dashboard-summary');

    return DashboardSummary.fromJson(payload as Map<String, dynamic>);
  }

  Future<List<OrderRecord>> getDispatchJobs() async {
    final payload = await _client.getJson('/dispatch');
    final jobs = (payload as Map<String, dynamic>)['jobs'] as List<dynamic>? ?? const [];

    return jobs.map((job) => OrderRecord.fromJson(job as Map<String, dynamic>)).toList();
  }

  Future<List<DriverRecord>> listDrivers() async {
    final payload = await _client.getJson('/drivers');
    final drivers = (payload as Map<String, dynamic>)['drivers'] as List<dynamic>? ?? const [];

    return drivers.map((driver) => DriverRecord.fromJson(driver as Map<String, dynamic>)).toList();
  }

  Future<List<MerchantRecord>> listMerchants() async {
    final payload = await _client.getJson('/merchants');
    final merchants = (payload as Map<String, dynamic>)['merchants'] as List<dynamic>? ?? const [];

    return merchants.map((merchant) => MerchantRecord.fromJson(merchant as Map<String, dynamic>)).toList();
  }

  Future<List<SettlementRecord>> listSettlements() async {
    final payload = await _client.getJson('/settlements');
    final settlements = (payload as Map<String, dynamic>)['settlements'] as List<dynamic>? ?? const [];

    return settlements
        .map((settlement) => SettlementRecord.fromJson(settlement as Map<String, dynamic>))
        .toList();
  }
}