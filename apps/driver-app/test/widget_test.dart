import 'package:flutter_test/flutter_test.dart';

import 'package:driver_app/src/app.dart';

void main() {
  testWidgets('driver foundation renders dashboard shell', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const DriverApp());
    await tester.pumpAndSettle();

    expect(find.text('تطبيق السائقين'), findsOneWidget);
    expect(find.text('المهام'), findsAtLeastNWidgets(1));
  });
}
