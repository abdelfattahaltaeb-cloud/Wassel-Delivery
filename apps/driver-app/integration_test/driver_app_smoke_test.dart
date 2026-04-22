import 'package:driver_app/main.dart' as app;
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
    final loginFinder = find.text('تسجيل دخول السائق');
    final tasksFinder = find.text('المهام الحالية');

    await pumpUntilAnyVisible(tester, [loginFinder, tasksFinder]);
    if (loginFinder.evaluate().isNotEmpty) {
      return;
    }

    await tapText(tester, 'الحساب');
    await tapText(tester, 'تسجيل الخروج');
    await pumpUntilVisible(tester, loginFinder);
  }

  Future<void> openOrderFromList(
    WidgetTester tester,
    String referenceCode,
  ) async {
    final finder = find.text(referenceCode);
    await pumpUntilVisible(tester, find.byType(Scrollable));
    await tester.scrollUntilVisible(
      finder,
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(finder.first);
    await tester.pump(const Duration(milliseconds: 300));
  }

  testWidgets('driver app smoke flow', (tester) async {
    await backend.ensureHealthy();

    final adminToken = await backend.loginAsAdmin();
    final customerToken = await backend.loginAsCustomer();
    final driverToken = await backend.loginAsDriver();
    final drivers = await backend.listDrivers(adminToken);
    final seededDriver = drivers.firstWhere(
      (driver) => driver['email'] == 'driver@wassel-delivery.local',
    );
    final driverId = seededDriver['id'] as String;

    final primaryNote =
        'driver-smoke-primary-${DateTime.now().microsecondsSinceEpoch}';
    final failureNote =
        'driver-smoke-failure-${DateTime.now().microsecondsSinceEpoch}';

    final primaryOrder = await backend.createOrder(
      customerToken,
      note: primaryNote,
    );
    final failureOrder = await backend.createOrder(
      customerToken,
      note: failureNote,
    );
    await backend.manualAssignDriver(
      adminToken,
      primaryOrder['id'] as String,
      driverId,
    );
    await backend.manualAssignDriver(
      adminToken,
      failureOrder['id'] as String,
      driverId,
    );

    app.main();
    await tester.pump();

    await ensureLoggedOutIfNeeded(tester);
    await tapText(tester, 'دخول');
    await pumpUntilVisible(tester, find.text('المهام الحالية'));

    app.main();
    await tester.pump();
    await pumpUntilVisible(tester, find.text('المهام الحالية'));
    expect(find.text('تسجيل دخول السائق'), findsNothing);

    await openOrderFromList(tester, primaryOrder['referenceCode'] as String);
    await pumpUntilVisible(tester, find.text('تفاصيل المهمة'));

    await tapText(tester, 'قبول المهمة');
    expect(
      (await backend.getOrder(
        adminToken,
        primaryOrder['id'] as String,
      ))['status'],
      'DRIVER_ACCEPTED',
    );

    await tapText(tester, 'استلام الطلب');
    expect(
      (await backend.getOrder(
        adminToken,
        primaryOrder['id'] as String,
      ))['status'],
      'PICKED_UP',
    );

    await tapText(tester, 'إرسال الموقع');
    final trackingAfterLocation = await backend.getTracking(
      driverToken,
      primaryOrder['id'] as String,
    );
    expect(
      (trackingAfterLocation['locations'] as List<dynamic>).isNotEmpty,
      isTrue,
    );

    await tapText(tester, 'قيد التوصيل');
    expect(
      (await backend.getOrder(
        adminToken,
        primaryOrder['id'] as String,
      ))['status'],
      'IN_TRANSIT',
    );

    await tapText(tester, 'تسليم الطلب');
    expect(
      (await backend.getOrder(
        adminToken,
        primaryOrder['id'] as String,
      ))['status'],
      'DELIVERED',
    );

    await tapText(tester, 'المهام');
    await openOrderFromList(tester, failureOrder['referenceCode'] as String);
    await pumpUntilVisible(tester, find.text('تفاصيل المهمة'));

    await tapText(tester, 'قبول المهمة');
    await tapText(tester, 'استلام الطلب');
    await tapText(tester, 'فشل التوصيل');
    expect(
      (await backend.getOrder(
        adminToken,
        failureOrder['id'] as String,
      ))['status'],
      'FAILED_DELIVERY',
    );

    final publicTracking = await backend.getPublicTracking(
      primaryOrder['publicTrackingCode'] as String,
    );
    expect(publicTracking['currentStatus'], 'DELIVERED');

    await tapText(tester, 'الحساب');
    await tapText(tester, 'تسجيل الخروج');
    await pumpUntilVisible(tester, find.text('تسجيل دخول السائق'));
  });
}
