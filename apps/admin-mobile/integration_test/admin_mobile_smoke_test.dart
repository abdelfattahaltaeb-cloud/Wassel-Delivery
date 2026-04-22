import 'package:admin_mobile/main.dart' as app;
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
    final loginFinder = find.text('تسجيل دخول الإدارة المتنقلة');
    final dashboardFinder = find.text('اللوحة التنفيذية');

    await pumpUntilAnyVisible(tester, [loginFinder, dashboardFinder]);
    if (loginFinder.evaluate().isNotEmpty) {
      return;
    }

    await tapText(tester, 'المالية');
    await tapText(tester, 'تسجيل الخروج');
    await pumpUntilVisible(tester, loginFinder);
  }

  testWidgets('admin mobile smoke flow', (tester) async {
    await backend.ensureHealthy();

    final adminToken = await backend.loginAsAdmin();
    final dashboard = await backend.dashboardSummary(adminToken);
    final firstOrder = (await backend.listOrders(adminToken)).first;
    final firstDriver = (await backend.listDrivers(adminToken)).first;
    final firstMerchant = (await backend.listMerchants(adminToken)).first;
    final settlements = await backend.listSettlements(adminToken);

    app.main();
    await tester.pump();

    await ensureLoggedOutIfNeeded(tester);
    await tapText(tester, 'دخول');
    await pumpUntilVisible(tester, find.text('اللوحة التنفيذية'));

    app.main();
    await tester.pump();
    await pumpUntilVisible(tester, find.text('اللوحة التنفيذية'));
    expect(find.text('تسجيل دخول الإدارة المتنقلة'), findsNothing);

    await pumpUntilVisible(
      tester,
      find.text(
        (dashboard['orders'] as Map<String, dynamic>)['total'].toString(),
      ),
    );

    await tapText(tester, 'الطلبات');
    await pumpUntilVisible(tester, find.text('قائمة الطلبات'));
    await pumpUntilVisible(
      tester,
      find.text(firstOrder['referenceCode'] as String),
    );
    await tapText(tester, firstOrder['referenceCode'] as String);
    await pumpUntilVisible(tester, find.text('تفاصيل الطلب'));
    await pumpUntilVisible(tester, find.text('قائمة التوزيع'));

    await tapText(tester, 'الكيانات');
    await pumpUntilVisible(tester, find.text('السائقون'));
    await pumpUntilVisible(tester, find.text(firstDriver['name'] as String));
    await pumpUntilVisible(tester, find.text('التجار'));
    await pumpUntilVisible(tester, find.text(firstMerchant['name'] as String));

    await tapText(tester, 'المالية');
    await pumpUntilVisible(tester, find.text('آخر التسويات'));
    if (settlements.isNotEmpty) {
      await pumpUntilVisible(
        tester,
        find.text(settlements.first['ledgerCode'] as String),
      );
    }

    await tapText(tester, 'تسجيل الخروج');
    await pumpUntilVisible(tester, find.text('تسجيل دخول الإدارة المتنقلة'));
  });
}
