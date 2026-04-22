import 'package:customer_app/main.dart' as app;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:wassel_mobile/wassel_mobile.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  final backend = SmokeBackend.current();

  Future<void> pumpUntilVisible(
    WidgetTester tester,
    Finder finder, {
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final deadline = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(deadline)) {
      await tester.pump(const Duration(milliseconds: 250));
      if (finder.evaluate().isNotEmpty) {
        return;
      }
    }
    throw TestFailure('Timed out waiting for $finder');
  }

  Future<void> tapText(WidgetTester tester, String text) async {
    final finder = find.text(text);
    await pumpUntilVisible(tester, finder);
    await tester.ensureVisible(finder.first);
    await tester.tap(finder.first);
    await tester.pump(const Duration(milliseconds: 300));
  }

  Future<void> pumpUntilAnyVisible(
    WidgetTester tester,
    List<Finder> finders, {
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final deadline = DateTime.now().add(timeout);
    while (DateTime.now().isBefore(deadline)) {
      await tester.pump(const Duration(milliseconds: 250));
      if (finders.any((finder) => finder.evaluate().isNotEmpty)) {
        return;
      }
    }
    throw TestFailure('Timed out waiting for one of $finders');
  }

  Future<void> ensureLoggedOutIfNeeded(WidgetTester tester) async {
    final loginFinder = find.text('تسجيل دخول العميل');
    final createFinder = find.text('إنشاء طلب');

    await pumpUntilAnyVisible(tester, [loginFinder, createFinder]);
    if (loginFinder.evaluate().isNotEmpty) {
      return;
    }

    await tapText(tester, 'الحساب');
    await tapText(tester, 'تسجيل الخروج');
    await pumpUntilVisible(tester, loginFinder);
  }

  testWidgets('customer app smoke flow', (tester) async {
    await backend.ensureHealthy();

    final customerToken = await backend.loginAsCustomer();
    final adminToken = await backend.loginAsAdmin();
    final driverToken = await backend.loginAsDriver();
    final drivers = await backend.listDrivers(adminToken);
    final seededDriver = drivers.firstWhere(
      (driver) => driver['email'] == 'driver@wassel-delivery.local',
    );
    final driverId = seededDriver['id'] as String;

    app.main();
    await tester.pump();

    await ensureLoggedOutIfNeeded(tester);
    await tapText(tester, 'دخول');
    await pumpUntilVisible(tester, find.text('إنشاء طلب'));

    app.main();
    await tester.pump();
    await pumpUntilVisible(tester, find.text('إنشاء طلب'));
    expect(find.text('تسجيل دخول العميل'), findsNothing);

    final uniqueNote =
        'customer-smoke-${DateTime.now().microsecondsSinceEpoch}';
    await tester.enterText(find.byType(TextField).at(8), uniqueNote);
    await tester.pump(const Duration(milliseconds: 300));
    await tapText(tester, 'إرسال الطلب');
    await pumpUntilVisible(tester, find.text('طلباتي'));

    final createdOrder = await backend.findOrderByNote(
      customerToken,
      uniqueNote,
    );
    final referenceCode = createdOrder['referenceCode'] as String;
    final orderId = createdOrder['id'] as String;
    final publicTrackingCode = createdOrder['publicTrackingCode'] as String;

    await pumpUntilVisible(tester, find.text(referenceCode));
    await tapText(tester, referenceCode);
    await pumpUntilVisible(tester, find.text('التتبع الخاص'));
    await pumpUntilVisible(tester, find.textContaining(publicTrackingCode));

    await tapText(tester, 'عرض التتبع العام');
    await pumpUntilVisible(tester, find.textContaining('الحالة الحالية:'));

    await backend.manualAssignDriver(adminToken, orderId, driverId);
    await backend.acceptOrder(driverToken, orderId);
    await backend.pickupOrder(driverToken, orderId);
    await backend.markInTransit(driverToken, orderId);
    await backend.deliverOrder(driverToken, orderId);

    await tester.tap(find.byIcon(Icons.refresh_rounded));
    await tester.pump(const Duration(milliseconds: 300));
    await pumpUntilVisible(tester, find.text('الحالة: DELIVERED'));

    await tapText(tester, 'طلباتي');
    await pumpUntilVisible(tester, find.text(referenceCode));
    await pumpUntilVisible(tester, find.text('DELIVERED'));

    final publicTracking = await backend.getPublicTracking(publicTrackingCode);
    expect(publicTracking['currentStatus'], 'DELIVERED');

    await tapText(tester, 'الحساب');
    await tapText(tester, 'تسجيل الخروج');
    await pumpUntilVisible(tester, find.text('تسجيل دخول العميل'));
  });
}
