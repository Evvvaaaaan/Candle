// Drives the real app on a simulator/device: temp login, then every screen,
// saving a screenshot of each to screenshots/.
//
//   flutter drive --driver=test_driver/integration_test.dart \
//     --target=integration_test/screens_test.dart -d <device> \
//     --dart-define=TEST_USERNAME=<id> --dart-define=TEST_PASSWORD=<pw> \
//     [--dart-define=API_BASE_URL=<origin>]
import 'package:candle/main.dart' as app;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

const _username = String.fromEnvironment('TEST_USERNAME');
const _password = String.fromEnvironment('TEST_PASSWORD');

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('temp login and every screen', (tester) async {
    expect(_username, isNotEmpty, reason: 'pass --dart-define=TEST_USERNAME');

    Future<void> settle([int seconds = 2]) async {
      final end = DateTime.now().add(Duration(seconds: seconds));
      while (DateTime.now().isBefore(end)) {
        await tester.pump(const Duration(milliseconds: 100));
      }
    }

    Future<void> shot(String name) async {
      await settle(1);
      await binding.takeScreenshot(name);
    }

    Future<void> tap(Finder finder) async {
      // Lists build lazily; scroll the page until an off-screen target exists.
      for (var i = 0; i < 8 && finder.evaluate().isEmpty; i++) {
        await tester.drag(find.byType(ListView).first, const Offset(0, -300));
        await settle(1);
      }
      await tester.ensureVisible(finder.first);
      await settle(1);
      await tester.tap(finder.first);
      await settle();
    }

    Future<void> back() => tap(find.byTooltip('이전 화면'));

    app.main();
    await settle(4);
    // A previous run's session survives reinstall (keychain); log out first.
    if (find.byKey(const Key('temp-username')).evaluate().isEmpty) {
      await tap(find.byTooltip('내 정보'));
      await tap(find.byTooltip('계정 · 약관'));
      await tap(find.byKey(const Key('logout')));
      await settle(2);
    }
    await shot('01-signup');

    await tester.enterText(find.byKey(const Key('temp-username')), _username);
    await tester.enterText(find.byKey(const Key('temp-password')), _password);
    FocusManager.instance.primaryFocus?.unfocus();
    await settle(1);
    await tap(find.text('임시로그인'));
    await settle(3);
    await shot('02-consent');
    await tap(find.byTooltip('서비스 이용약관 동의'));
    await shot('02b-terms');
    await tap(find.text('닫기'));

    await tap(find.byKey(const Key('agree-all')));
    await tap(find.byKey(const Key('consent-submit')));
    await settle(3);
    if (find.text('건너뛰기').evaluate().isNotEmpty) {
      await shot('03-tutorial');
      await tap(find.text('건너뛰기'));
    }
    if (find.text('지난 예측 결과').evaluate().isNotEmpty) {
      await shot('03-last-result');
      await tap(find.text('확인'));
    }
    await shot('04-home');

    await tap(find.text('종목 변경'));
    await shot('05-stock-select');
    await tester.enterText(find.byKey(const Key('stock-search')), '삼성전자');
    FocusManager.instance.primaryFocus?.unfocus();
    await settle(3);
    await shot('05b-stock-search');
    // The search field also contains '삼성전자'; tap the row by its code line.
    await tap(find.text('005930 · 코스피'));
    await settle(2);
    await shot('06-home-selected');

    await tap(find.byKey(const Key('direction-down')));
    await shot('07-prediction');
    await tap(find.text('예측 확인'));
    await shot('08-prediction-review');
    await tap(find.text('취소'));

    await tap(find.text('사용 가능한 예측권'));
    await shot('09-pass');
    await tap(find.text('광고 보기'));
    await shot('10-reward-ad-sheet');
    await tap(find.text('나중에 할게요'));

    await tap(find.text('미션'));
    await shot('11-missions');
    await tap(find.text('상점'));
    await shot('12-shop');

    await tap(find.text('홈'));
    // Home shows the latest scored day's results once per date.
    if (find.text('지난 예측 결과').evaluate().isNotEmpty) {
      await shot('12b-last-result');
      await tap(find.text('확인'));
    }
    await tap(find.text('10연승에 도전해 볼까요?'));
    await shot('13-challenge');
    await tap(find.text('당첨 확인 · 리워드 수령'));
    await shot('14-challenge-reward');
    await back();
    await back();

    await tap(find.byTooltip('내 정보'));
    await shot('15-profile');
    await tap(find.text('예측 내역'));
    await shot('16-prediction-history');
    await back();
    await tap(find.text('포인트 내역'));
    await shot('17-wallet');
    await back();
    await tap(find.byTooltip('계정 · 약관'));
    await shot('18-settings');
  });
}
