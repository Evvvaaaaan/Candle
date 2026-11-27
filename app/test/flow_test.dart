import 'dart:convert';

import 'package:candle/main.dart';
import 'package:candle/screens/auth_screens.dart';
import 'package:candle/state.dart';
import 'package:candle/ui/widgets.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

import 'fake_backend.dart';

/// End-to-end widget flows against [FakeBackend] (no network).
void main() {
  late FakeBackend backend;
  setUp(() => backend = FakeBackend()..seedAccount());

  Future<AppState> launch(WidgetTester tester, {bool signedIn = true, bool tutorialSeen = true}) async {
    tester.view.physicalSize = const Size(1170, 2532);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    final state = await backend.state(signedIn: signedIn, tutorialSeen: tutorialSeen);
    await tester.pumpWidget(CandleApp(state: state));
    await tester.pump(const Duration(seconds: 2));
    await tester.pumpAndSettle();
    return state;
  }

  Future<void> tapText(WidgetTester tester, String text) async {
    final finder = find.text(text).last;
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  testWidgets('release builds hide the temp login until the logo is tapped 7 times', (tester) async {
    final state = await backend.state();
    await tester.pumpWidget(AppScope(
      state: state,
      child: const MaterialApp(home: SignupScreen(showDevLogin: false)),
    ));
    expect(find.text('개발용 임시 로그인'), findsNothing);
    for (var i = 0; i < 6; i++) {
      await tester.tap(find.byKey(const Key('signup-logo')));
    }
    await tester.pump();
    expect(find.text('개발용 임시 로그인'), findsNothing, reason: 'six taps are not enough');
    await tester.tap(find.byKey(const Key('signup-logo')));
    await tester.pump();
    expect(find.text('개발용 임시 로그인'), findsOneWidget);
  });

  testWidgets('Apple login is offered on iOS only', (tester) async {
    final state = await backend.state();
    for (final (platform, expected) in [(TargetPlatform.iOS, findsOneWidget), (TargetPlatform.android, findsNothing)]) {
      debugDefaultTargetPlatformOverride = platform;
      await tester.pumpWidget(AppScope(state: state, child: MaterialApp(key: UniqueKey(), home: const SignupScreen())));
      expect(find.text('Apple로 계속하기'), expected, reason: '$platform');
      expect(find.text('카카오로 계속하기'), findsNothing, reason: 'no Kakao key configured');
      expect(find.text('네이버로 계속하기'), findsNothing, reason: 'no Naver key configured');
      expect(find.text('Google로 계속하기'), findsNothing, reason: 'no Google key configured');
    }
    debugDefaultTargetPlatformOverride = null;
  });

  testWidgets('new user: temp login, consent, tutorial, home data', (tester) async {
    await launch(tester, signedIn: false, tutorialSeen: false);
    expect(find.text('로그인'), findsOneWidget);
    expect(find.text('개발용 임시 로그인'), findsOneWidget, reason: 'debug test builds show the temp login');

    await tester.enterText(find.byKey(const Key('temp-username')), 'reviewer');
    await tester.enterText(find.byKey(const Key('temp-password')), 'secret');
    await tapText(tester, '임시로그인');
    final login = backend.calls('POST /api/user/temp').single;
    expect(login.body, '{"username":"reviewer","password":"secret"}');
    expect(find.text('고객님,\n환영합니다!'), findsOneWidget);

    final next = find.byKey(const Key('consent-submit'));
    expect(tester.widget<TextButton>(next).onPressed, isNull);
    await tester.tap(find.byKey(const Key('agree-age')));
    await tester.pump();
    expect(tester.widget<TextButton>(next).onPressed, isNull, reason: 'one of three is not enough');
    await tester.tap(find.byKey(const Key('agree-all')));
    await tester.pump();
    await tester.tap(next);
    await tester.pumpAndSettle();
    expect(backend.calls('POST /api/term/consent').single.body, '{"keys":["age","terms","privacy"]}');

    expect(find.text('10일 연속 예측 성공'), findsOneWidget);
    await tapText(tester, '건너뛰기');
    expect(find.text('오늘의 종목을 예측해 보세요'), findsOneWidget);
    expect(find.text('12,000 P'), findsOneWidget);
    expect(find.text('3회'), findsOneWidget);
    expect(find.text('3'), findsWidgets);
  });

  testWidgets('choose a stock, predict down, and see the server result message', (tester) async {
    await launch(tester);
    await tapText(tester, '종목 변경');
    expect(find.text('어떤 종목을 예측할까요?'), findsOneWidget);
    await tapText(tester, '삼성전자');
    expect(find.text('71,200원'), findsOneWidget);
    expect(tester.widget<BottomNav>(find.byType(BottomNav)).active, 'home');

    await tester.tap(find.byKey(const Key('direction-down')).first);
    await tester.pumpAndSettle();
    expect(tester.widget<BottomNav>(find.byType(BottomNav)).active, 'predict',
        reason: 'pushed screens highlight their own tab');
    expect(find.text('하락'), findsWidgets);
    expect(find.text('예측 확인'), findsOneWidget);
    await tapText(tester, '예측 확인');
    expect(find.text('선택한 예측 확인'), findsOneWidget);
    await tapText(tester, '예측 제출');
    final predict = backend.calls('POST /api/topicroundpredict/predict').single;
    expect(predict.body, '{"topicId":"12","answer":120}');
    expect(find.text('예측이 접수되었습니다.'), findsOneWidget);

    backend.json('POST /api/topicroundpredict/predict', {'id': -110});
    await tapText(tester, '예측 확인');
    await tapText(tester, '예측 제출');
    expect(find.text('이미 참여한 종목이에요. 접수된 예측은 변경할 수 없어요.'), findsOneWidget);
  });

  testWidgets('shop, exchange, payout validation, wallet shows the pending exchange', (tester) async {
    await launch(tester);
    await tapText(tester, '상점');
    expect(find.text('30,000원'), findsOneWidget);
    expect(find.text('18,000P 부족'), findsOneWidget);
    await tapText(tester, '10,000원');
    await tapText(tester, '10,000원 교환하기');
    expect(find.text('교환 가능'), findsOneWidget);
    await tapText(tester, '수령 정보 입력');

    final submit = find.widgetWithText(TextButton, '지급 신청하기');
    await tester.enterText(find.byKey(const Key('phone')), '0101234');
    await tester.enterText(find.byKey(const Key('name')), '홍길동');
    await tester.tap(find.byKey(const Key('payout-agree')));
    await tester.pumpAndSettle();
    expect(find.text('010으로 시작하는 휴대폰 번호 11자리를 입력해 주세요.'), findsOneWidget);
    expect(tester.widget<TextButton>(submit).onPressed, isNull);

    await tester.enterText(find.byKey(const Key('phone')), '010-1234-5678');
    await tester.pumpAndSettle();
    await tester.tap(submit);
    await tester.pumpAndSettle();
    expect(backend.calls('POST /api/exchange').single.body,
        '{"productId":"naverpay-10000","name":"홍길동","phone":"01012345678","agree":true}');
    expect(find.text('포인트 내역'), findsOneWidget);
    expect(find.text('교환 신청이 접수되었어요. 관리자 확인 후 지급됩니다.'), findsOneWidget);
    expect(find.text('처리 중'), findsOneWidget, reason: 'exchange 31 has process 0');
    expect(find.text('출석 보상'), findsNothing, reason: 'the 사용 tab hides earnings');
  });

  testWidgets('attendance on the missions tab', (tester) async {
    await launch(tester);
    await tapText(tester, '미션');
    expect(find.text('2 / 5'), findsOneWidget);
    await tester.tap(find.byKey(const Key('attendance')));
    await tester.pumpAndSettle();
    expect(find.text('출석 완료! 10P를 받았어요. 4일 연속 출석 중이에요.'), findsOneWidget);
  });

  testWidgets('logout, log back in, consent reaches home', (tester) async {
    await launch(tester);
    await tester.tap(find.byTooltip('내 정보'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('계정 · 약관'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('logout')));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('temp-username')), 'again');
    await tapText(tester, '임시로그인');
    expect(find.text('고객님,\n환영합니다!'), findsOneWidget);
    await tester.tap(find.byKey(const Key('agree-all')));
    await tester.pump();
    await tester.tap(find.byKey(const Key('consent-submit')));
    await tester.pumpAndSettle();
    expect(find.text('오늘의 종목을 예측해 보세요'), findsOneWidget);
  });

  testWidgets('signup does not scroll on iOS when it fits; buttons sit at the bottom', (tester) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    addTearDown(() => debugDefaultTargetPlatformOverride = null);
    tester.view.physicalSize = const Size(1170, 2532);
    tester.view.devicePixelRatio = 3;
    addTearDown(tester.view.reset);
    final state = await backend.state(signedIn: false);
    await tester.pumpWidget(AppScope(
      state: state,
      child: const MaterialApp(home: SignupScreen(showDevLogin: false)),
    ));
    final logo = find.byKey(const Key('signup-logo'));
    final before = tester.getTopLeft(logo);
    await tester.drag(find.byType(CustomScrollView), const Offset(0, 200));
    await tester.pump(const Duration(milliseconds: 50));
    expect(tester.getTopLeft(logo), before);
    expect(tester.getBottomLeft(find.text('Apple로 계속하기')).dy, greaterThan(844 * 0.75));
    debugDefaultTargetPlatformOverride = null;
  });

  testWidgets('withdraw needs consent, sends the reason, signs out; a failure stays put', (tester) async {
    final state = await launch(tester);
    await tester.tap(find.byTooltip('내 정보'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('계정 · 약관'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const Key('withdraw')));
    await tester.tap(find.byKey(const Key('withdraw')));
    await tester.pumpAndSettle();

    final submit = find.byKey(const Key('withdraw-submit'));
    await tester.tap(submit);
    await tester.pumpAndSettle();
    expect(backend.calls('PUT /api/user/withdraw'), isEmpty, reason: 'disabled until agreed');

    backend.handlers['PUT /api/user/withdraw'] = (_) => http.Response('', 500);
    await tester.enterText(find.byKey(const Key('withdraw-reason')), '  자주 안 써요 ');
    await tester.tap(find.byKey(const Key('withdraw-agree')));
    await tester.pumpAndSettle();
    await tester.tap(submit);
    await tester.pumpAndSettle();
    expect(state.status, AuthStatus.signedIn);
    expect(find.text('탈퇴하기 전에 확인해 주세요'), findsOneWidget);
    await tester.pump(const Duration(seconds: 6)); // error SnackBar covers the button
    await tester.pumpAndSettle();

    backend.handlers['PUT /api/user/withdraw'] = (_) => http.Response('', 200);
    await tester.tap(submit);
    await tester.pumpAndSettle();
    final sent = backend.calls('PUT /api/user/withdraw').last;
    expect(jsonDecode(sent.body), {'withdraw': '자주 안 써요'});
    expect(sent.headers['Authorization'], 'a1');
    expect(state.status, AuthStatus.signedOut);
    expect(find.text('로그인'), findsOneWidget);
    expect(await state.api.client.tokens.read('refreshToken'), isNull);
  });

  testWidgets('logout and an expired session both return to signup', (tester) async {
    final state = await launch(tester);
    await tester.tap(find.byTooltip('내 정보'));
    await tester.pumpAndSettle();
    expect(find.text('테스터'), findsOneWidget);
    expect(find.text('8회 중 6회 적중'), findsOneWidget);
    await tester.tap(find.byTooltip('계정 · 약관'));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('logout')));
    await tester.pumpAndSettle();
    expect(find.text('로그인'), findsOneWidget);
    expect(state.status, AuthStatus.signedOut);

    await state.signIn('temp', {'username': 'u', 'password': 'p'});
    await tester.pumpAndSettle();
    state.chooseDirection('up');
    backend.handlers['GET /api/reward/latest'] = (_) => http.Response('', 403);
    await state.refreshBalance().catchError((_) => 0);
    await tester.pumpAndSettle();
    expect(state.status, AuthStatus.signedOut);
    expect(find.text('로그인'), findsOneWidget);
  });
}
