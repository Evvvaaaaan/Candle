import 'package:candle/ads/reward_ad.dart';
import 'package:candle/api/candle_api.dart';
import 'package:candle/api/client.dart';
import 'package:candle/screens/predict_screens.dart';
import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;

import 'fake_backend.dart';

void main() {
  late FakeBackend backend;
  setUp(() => backend = FakeBackend()..seedAccount());

  test('sign-in stores the RefreshToken header and session sends it raw', () async {
    final state = await backend.state();
    await state.signIn('temp', {'username': 'u', 'password': 'p'});
    final auth = backend.calls('POST /api/auth').single;
    expect(auth.headers['RefreshToken'], 'r1');
    expect(auth.headers.containsKey('Authorization'), isFalse);

    await state.api.balance();
    expect(backend.calls('GET /api/reward/latest').single.headers['Authorization'], 'a1');
  });

  test('missing RefreshToken header on sign-in is a 502', () async {
    backend.handlers['POST /api/user/temp'] = (_) => http.Response('', 200);
    final state = await backend.state();
    expect(() => state.signIn('temp', {'username': 'u'}), throwsA(isA<ApiException>().having((e) => e.status, 'status', 502)));
  });

  test('GET params go in the query string, POST params in a JSON body', () async {
    final state = await backend.state(signedIn: true);
    await state.restore();
    await state.api.topics('삼성', '코스피');
    final search = backend.calls('GET /api/topic/scrollList').single.url.queryParameters;
    expect(search, {'perpage': '10', 'deleted': 'false', 'cate': '110', 'keyword': '삼성'});

    await state.api.predict('12', answerDown);
    final predict = backend.calls('POST /api/topicroundpredict/predict').single;
    expect(predict.body, '{"topicId":"12","answer":120}');
    expect(predict.headers['Content-Type'], startsWith('application/json'));
  });

  test('concurrent 401s share one refresh and each request retries once', () async {
    final state = await backend.state(signedIn: true);
    await state.restore();
    backend.handlers['POST /api/auth'] = (_) => http.Response('', 200, headers: {'authorization': 'a2'});
    backend.handlers['GET /api/reward/latest'] = (r) => r.headers['Authorization'] == 'a2'
        ? http.Response('{"latest":5}', 200)
        : http.Response('', 401);
    final before = backend.calls('POST /api/auth').length;
    final results = await Future.wait([state.api.balance(), state.api.balance(), state.api.balance()]);
    expect(results, [5, 5, 5]);
    expect(backend.calls('POST /api/auth').length - before, 1);
  });

  test('a second 401 expires the session', () async {
    final state = await backend.state(signedIn: true);
    await state.restore();
    backend.handlers['GET /api/reward/latest'] = (_) => http.Response('', 401);
    await expectLater(state.api.balance(), throwsA(isA<ApiException>().having((e) => e.status, 'status', 401)));
    expect(state.status.name, 'signedOut');
    expect(state.api.client.hasRefreshToken, isFalse);
  });

  test('refresh rejected with 403 on restore signs out; network error keeps the token', () async {
    backend.handlers['POST /api/auth'] = (_) => http.Response('', 403);
    final rejected = await backend.state(signedIn: true);
    await rejected.restore();
    expect(rejected.status.name, 'signedOut');

    backend.handlers['POST /api/auth'] = (_) => throw http.ClientException('offline');
    final offline = await backend.state(signedIn: true);
    await offline.restore();
    expect(offline.status.name, 'signedIn');
    expect(offline.api.client.hasRefreshToken, isTrue);
  });

  test('responses that break the contract are 502', () async {
    final state = await backend.state(signedIn: true);
    await state.restore();
    backend.json('GET /api/heart/count', {'amount': 1, 'ad': 11});
    expect(state.api.tickets(), throwsA(isA<ApiException>().having((e) => e.status, 'status', 502)));
    backend.json('GET /api/reward/latest', {'latest': -1});
    expect(state.api.balance(), throwsA(isA<ApiException>().having((e) => e.status, 'status', 502)));
  });

  test('204 from streak claim means no claim', () async {
    final state = await backend.state(signedIn: true);
    await state.restore();
    backend.handlers['GET /api/streak/claim'] = (_) => http.Response('', 204);
    expect(await state.api.myClaim(), isNull);
  });

  test('negative predict ids map to the deployed messages', () {
    expect(predictionMessage(501), '예측이 접수되었습니다.');
    expect(predictionMessage(-100), contains('마감'));
    expect(predictionMessage(-110), contains('이미 참여한 종목'));
    expect(predictionMessage(-120), contains('예측권이 부족'));
    expect(predictionMessage(-130), contains('10회까지'));
  });

  test('ad grant polling stops when ad increases, gives up after five tries', () {
    fakeAsync((async) {
      backend.seedAccount();
      late final dynamic state;
      backend.state(signedIn: true).then((s) => state = s);
      async.flushMicrotasks();
      var ad = 2;
      backend.handlers['GET /api/heart/count'] = (_) => http.Response('{"amount":${ad + 1},"ad":$ad}', 200);
      state.restore();
      async.flushMicrotasks();

      Tickets? granted;
      var done = false;
      verifyAdGrant(state, 2).then((t) {
        granted = t;
        done = true;
      });
      async.elapse(const Duration(seconds: 3));
      ad = 3;
      async.elapse(const Duration(seconds: 3));
      expect(done, isTrue);
      expect(granted?.ad, 3);

      done = false;
      final before = backend.calls('GET /api/heart/count').length;
      verifyAdGrant(state, 3).then((t) {
        granted = t;
        done = true;
      });
      async.elapse(const Duration(seconds: 20));
      expect(done, isTrue);
      expect(granted, isNull);
      expect(backend.calls('GET /api/heart/count').length - before, 5);
    });
  });
}
