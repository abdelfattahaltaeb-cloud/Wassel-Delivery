import 'package:flutter_test/flutter_test.dart';

import 'package:customer_app/src/app.dart';

void main() {
  testWidgets('customer foundation renders home shell', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const CustomerApp());
    await tester.pumpAndSettle();

    expect(find.text('تطبيق العملاء'), findsOneWidget);
    expect(find.text('الرئيسية'), findsAtLeastNWidgets(1));
  });
}
