import 'dart:convert';

import 'package:candle/api/candle_api.dart';
import 'package:candle/api/client.dart';
import 'package:candle/state.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// In-memory stand-in for the Candle backend. Handlers are keyed by
/// "METHOD /path"; every request is recorded.
class FakeBackend {
  final requests = <http.Request>[];
  final handlers = <String, http.Response Function(http.Request)>{};

  late final client = MockClient((request) async {
    requests.add(request);
    final key = '${request.method} ${request.url.path}';
    final handler = handlers[key];
    if (handler == null) return http.Response('not found: $key', 404);
    return handler(request);
  });

  void json(String key, Object? body, {int status = 200, Map<String, String> headers = const {}}) =>
      handlers[key] = (_) => http.Response.bytes(
            utf8.encode(jsonEncode(body)),
            status,
            headers: {'content-type': 'application/json; charset=utf-8', ...headers},
          );

  Iterable<http.Request> calls(String key) => requests.where((r) => '${r.method} ${r.url.path}' == key);

  /// A signed-in account with a small balance and a few predictions.
  void seedAccount() {
    handlers['POST /api/user/temp'] = (_) => http.Response('', 200, headers: {'refreshtoken': 'r1'});
    handlers['POST /api/auth'] = (_) => http.Response('', 200, headers: {'authorization': 'a1'});
    json('GET /api/user', {'id': 7, 'nick': '테스터'});
    json('GET /api/reward/latest', {'latest': 12000});
    json('GET /api/heart/count', {'amount': 3, 'ad': 2});
    json('GET /api/alarm/count', {'hasNew': false});
    json('GET /api/streak', {
      'current': 3, 'best': 5, 'goal': 10, 'remaining': 7,
      'settledcount': 8, 'hitcount': 6, 'achieved': false, 'hitrate': 75,
    });
    json('GET /api/prediction/my', []);
    json('GET /api/topic/scrollList', [
      {'id': 12, 'code': '005930', 'title': '삼성전자', 'cate': 110},
      {'id': 13, 'code': '035720', 'title': '카카오', 'cate': 110},
    ]);
    handlers['GET /api/topic'] = (r) {
      final id = r.url.queryParameters['id'];
      return http.Response.bytes(
        utf8.encode(jsonEncode({'id': int.parse(id!), 'code': '005930', 'title': '삼성전자', 'cate': 110, 'price': 71200, 'rate': 1.28})),
        200,
        headers: {'content-type': 'application/json; charset=utf-8'},
      );
    };
    json('POST /api/term/consent', {});
    json('GET /api/term/terms', {'key': 'terms', 'title': '서비스 이용약관 동의', 'content': null});
    json('POST /api/topicroundpredict/predict', {'id': 501});
    json('GET /api/mission', {
      'daily': [{'key': 'attend', 'done': false}, {'key': 'ad', 'done': false}],
      'weekly': [{'key': 'week-attend', 'progress': 2, 'goal': 5}, {'key': 'week-hit', 'progress': 1, 'goal': 3}],
      'dailyDone': 0, 'dailyTotal': 2, 'todayRemainingPoint': 20,
    });
    json('POST /api/attend/today', {'streak': 4, 'today': true});
    json('POST /api/exchange', {'id': 31});
    json('GET /api/exchange/my', [{'id': 31, 'process': 0}]);
    json('GET /api/reward/scrollList', [
      {'id': 90, 'title': '네이버페이 5,000원권 교환', 'amount': -5000, 'createdAt': '2026-11-26T10:00:00', 'code': 'exchange_31'},
      {'id': 89, 'title': '출석 보상', 'amount': 10, 'createdAt': '2026-11-25T09:00:00', 'code': 'attend'},
    ]);
  }

  Future<AppState> state({bool signedIn = false, bool tutorialSeen = true}) async {
    SharedPreferences.setMockInitialValues({if (tutorialSeen) 'candle.tutorial.seen': '1'});
    final tokens = MemoryTokenStore();
    if (signedIn) tokens.values['refreshToken'] = 'r1';
    final api = CandleApi(ApiClient(baseUrl: 'https://example.test', tokens: tokens, httpClient: client));
    return AppState(api: api, prefs: await SharedPreferences.getInstance());
  }
}
