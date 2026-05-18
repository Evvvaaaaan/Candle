import 'package:flutter_test/flutter_test.dart';
import 'package:candle/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const CandleApp());
    expect(find.byType(CandleApp), findsOneWidget);
  });
}
