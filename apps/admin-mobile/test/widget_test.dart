import 'package:flutter_test/flutter_test.dart';

import 'package:admin_mobile/src/app.dart';

void main() {
  testWidgets('admin mobile foundation renders overview shell', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const AdminMobileApp());
    await tester.pumpAndSettle();

    expect(find.text('تطبيق الإدارة المتنقل'), findsOneWidget);
    expect(find.text('الرؤية العامة'), findsAtLeastNWidgets(1));
  });
}
