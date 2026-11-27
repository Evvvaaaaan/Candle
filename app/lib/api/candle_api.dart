import 'client.dart';

/// Every Candle HTTP contract, ported from the deployed `js/api.js`
/// (reference/web/js/api.js). Responses that break a contract throw 502.
Never _invalid() => throw const ApiException(502);

bool _finite(Object? v) =>
    v is num ? v.isFinite : (v is String && v.trim().isNotEmpty && num.tryParse(v.trim()) != null);
num _num(Object? v) => v is num ? v : num.parse((v as String).trim());
bool _nonnegative(Object? v) => _finite(v) && _num(v) >= 0;
bool _nonnegativeInt(Object? v) => _nonnegative(v) && _num(v) == _num(v).truncate();
Map<String, Object?> _map(Object? v) => v is Map ? v.cast<String, Object?>() : _invalid();
List<Object?> _list(Object? v) => v is List ? v : _invalid();

const marketNames = {'110': '코스피', '120': '코스닥', '210': '나스닥', '310': '코인'};

/// Server prediction answer codes: 100 변동없음, 110 상승, 120 하락.
const answerUp = 110;
const answerDown = 120;

class Topic {
  const Topic({
    required this.id,
    required this.code,
    required this.title,
    required this.cate,
    this.price,
    this.rate,
  });
  final String id;
  final String code;
  final String title;
  final String cate;
  final num? price;
  final num? rate;
  String get market => marketNames[cate] ?? cate;

  factory Topic.fromJson(Object? raw, {bool detail = false}) {
    final row = _map(raw);
    final id = row['id'], code = row['code'], title = row['title'];
    if (!(id is String || id is num) || '$id'.isEmpty) _invalid();
    if (code is! String || code.isEmpty || title is! String || title.isEmpty) _invalid();
    if (detail && (!_nonnegative(row['price']) || !_finite(row['rate']))) _invalid();
    return Topic(
      id: '$id',
      code: code,
      title: title,
      cate: '${row['cate'] ?? ''}',
      price: detail ? _num(row['price']) : null,
      rate: detail ? _num(row['rate']) : null,
    );
  }

  Map<String, Object?> toJson() => {'id': id, 'code': code, 'title': title, 'cate': cate};
}

class Tickets {
  const Tickets({required this.amount, required this.ad});
  final int amount;
  final int ad;
}

class Streak {
  const Streak({
    required this.current,
    required this.best,
    required this.goal,
    required this.remaining,
    required this.settledCount,
    required this.hitCount,
    required this.achieved,
    required this.hitRate,
  });
  final int current, best, goal, remaining, settledCount, hitCount;
  final bool achieved;
  final num? hitRate;
}

class Attendance {
  const Attendance(this.streak, this.today);
  final int streak;
  final bool today;
  factory Attendance.fromJson(Object? raw) {
    final row = _map(raw);
    if (!_nonnegative(row['streak']) || row['today'] is! bool) _invalid();
    return Attendance(_num(row['streak']).toInt(), row['today'] as bool);
  }
}

class RewardRow {
  const RewardRow({
    required this.id,
    required this.title,
    required this.amount,
    required this.createdAt,
    required this.code,
  });
  final int id;
  final String title;
  final int amount;
  final String createdAt;
  final String code;
}

class PredictionRow {
  const PredictionRow({
    required this.id,
    required this.topicTitle,
    required this.answer,
    required this.status,
    required this.point,
    required this.rewarded,
    required this.roundDate,
    required this.rate,
    required this.result,
  });
  final Object id;
  final String topicTitle;
  final int? answer;

  /// pending | hit | miss
  final String status;
  final num point;
  final bool rewarded;
  final String? roundDate;
  final num? rate;
  final int? result;

  factory PredictionRow.fromJson(Object? raw) {
    final row = _map(raw);
    int? code(Object? v) => _finite(v) ? _num(v).toInt() : null;
    final status = row['status'];
    return PredictionRow(
      id: row['id'] ?? _invalid(),
      topicTitle: row['topicTitle'] is String && (row['topicTitle'] as String).isNotEmpty
          ? row['topicTitle'] as String
          : '종목',
      answer: code(row['answer']),
      status: status == 'hit' || status == 'miss' ? status as String : 'pending',
      point: _finite(row['point']) ? _num(row['point']) : 0,
      rewarded: row['rewarded'] == true,
      roundDate: row['roundDate'] is String && (row['roundDate'] as String).isNotEmpty
          ? row['roundDate'] as String
          : null,
      rate: _finite(row['rate']) ? _num(row['rate']) : null,
      result: code(row['result']),
    );
  }
}

class MissionItem {
  const MissionItem(this.key, this.done, this.progress, this.goal);
  final String key;
  final bool done;
  final int? progress;
  final int? goal;
}

class MissionStatus {
  const MissionStatus({
    required this.items,
    required this.dailyDone,
    required this.dailyTotal,
    required this.todayRemainingPoint,
  });
  final Map<String, MissionItem> items;
  final int dailyDone, dailyTotal;
  final num todayRemainingPoint;
}

/// 10연승 리워드 신청: process 0 접수, 200 지급 완료, 300 미선정.
class StreakClaim {
  const StreakClaim(this.process, this.bestStreak, this.hitRate);
  final int? process;
  final Object? bestStreak;
  final Object? hitRate;
}

class CandleApi {
  CandleApi(this.client);
  final ApiClient client;

  Future<Object?> _get(String path, [Map<String, Object?>? param]) =>
      client.request(path, param: param);
  Future<Object?> _post(String path, [Map<String, Object?>? param]) =>
      client.request(path, method: 'POST', param: param ?? const {});

  Future<void> signIn(String provider, Map<String, Object?> credentials) =>
      client.signIn(provider, credentials);
  Future<void> session() => client.refreshAccess();

  /// Deletes the signed-in account (server revokes Apple too). 200 even when
  /// already withdrawn.
  Future<void> withdraw([String reason = '']) => client.request('/api/user/withdraw',
      method: 'PUT', param: {if (reason.trim().isNotEmpty) 'withdraw': reason.trim()});

  Future<Map<String, Object?>> user() async => _map(await _get('/api/user', {'id': 0}));

  Future<int> balance() async {
    final row = _map(await _get('/api/reward/latest'));
    if (!_nonnegative(row['latest'])) _invalid();
    return _num(row['latest']).toInt();
  }

  Future<Tickets> tickets() async {
    final row = _map(await _get('/api/heart/count'));
    if (!_nonnegativeInt(row['amount']) || !_nonnegativeInt(row['ad']) || _num(row['ad']) > 10) {
      _invalid();
    }
    return Tickets(amount: _num(row['amount']).toInt(), ad: _num(row['ad']).toInt());
  }

  Future<bool> hasNewAlarm() async {
    final row = await _get('/api/alarm/count');
    return row is Map && row['hasNew'] == true;
  }

  /// [market] is '' (전체), '코스피' or '코스닥'.
  Future<List<Topic>> topics(String keyword, String market) async {
    final rows = _list(await _get('/api/topic/scrollList', {
      'perpage': 10,
      'deleted': false,
      'cate': const {'코스피': '110', '코스닥': '120'}[market] ?? '',
      'keyword': keyword,
    }));
    return rows.map(Topic.fromJson).toList();
  }

  Future<Topic> topic(String id) async {
    final row = Topic.fromJson(await _get('/api/topic', {'id': id}), detail: true);
    if (row.id != id) _invalid();
    return row;
  }

  /// Returns the round id. A negative id is a business result:
  /// -100 마감, -110 이미 참여, -120 예측권 부족, -130 하루 10회 초과.
  Future<int> predict(String topicId, int answer) async {
    final row = _map(await _post('/api/topicroundpredict/predict', {'topicId': topicId, 'answer': answer}));
    if (!_finite(row['id'])) _invalid();
    return _num(row['id']).toInt();
  }

  Future<List<RewardRow>> rewards([int? cursor]) async {
    final rows = _list(await _get('/api/reward/scrollList', {
      'userId': 0,
      'deleted': false,
      'perpage': 20,
      'cursor': cursor,
    }));
    return rows.map((raw) {
      final row = _map(raw);
      if (!_finite(row['id']) || !_finite(row['amount'])) _invalid();
      final title = row['title'];
      return RewardRow(
        id: _num(row['id']).toInt(),
        title: title is String && title.isNotEmpty ? title : '포인트',
        amount: _num(row['amount']).toInt(),
        createdAt: '${row['createdAt'] ?? ''}',
        code: row['code'] is String ? row['code'] as String : '',
      );
    }).toList();
  }

  /// 포인트 교환: 신청 즉시 차감, 관리자가 지급 완료(200) 또는 반려·환급(300).
  Future<void> exchange(String productId, String name, String phone) =>
      _post('/api/exchange', {'productId': productId, 'name': name, 'phone': phone, 'agree': true});

  /// exchange id → process (0 처리 중, 200 지급 완료, 300 반려).
  Future<Map<int, int?>> myExchanges() async {
    final rows = _list(await _get('/api/exchange/my'));
    return {
      for (final raw in rows)
        if (raw is Map && _finite(raw['id']))
          _num(raw['id']).toInt(): _finite(raw['process']) ? _num(raw['process']).toInt() : null,
    };
  }

  Future<Attendance> attendStreak() async => Attendance.fromJson(await _get('/api/attend/streak'));
  Future<Attendance> attendToday() async => Attendance.fromJson(await _post('/api/attend/today'));

  /// 연승은 채점된 날 단위: 그날 적중률 50% 초과면 +1, 이하면 0.
  Future<Streak> streak() async {
    final row = _map(await _get('/api/streak'));
    for (final key in ['current', 'best', 'goal', 'remaining', 'settledcount', 'hitcount']) {
      if (!_nonnegative(row[key])) _invalid();
    }
    int n(String key) => _num(row[key]).toInt();
    return Streak(
      current: n('current'),
      best: n('best'),
      goal: n('goal'),
      remaining: n('remaining'),
      settledCount: n('settledcount'),
      hitCount: n('hitcount'),
      achieved: row['achieved'] == true,
      hitRate: _finite(row['hitrate']) ? _num(row['hitrate']) : null,
    );
  }

  /// 내 예측 내역 (최신순).
  Future<List<PredictionRow>> predictions([Object? cursor]) async {
    final rows = _list(await _get('/api/prediction/my', {'perpage': 20, 'cursor': cursor}));
    return rows.map(PredictionRow.fromJson).toList();
  }

  Future<void> claimPrediction(Object id) => _post('/api/prediction/claim', {'id': id});

  Future<MissionStatus> mission() async {
    final row = _map(await _get('/api/mission'));
    final daily = _list(row['daily']), weekly = _list(row['weekly']);
    int? n(Object? v) => _finite(v) ? _num(v).toInt() : null;
    final items = <String, MissionItem>{
      for (final raw in [...daily, ...weekly])
        if (raw is Map && raw['key'] is String)
          raw['key'] as String: MissionItem(
            raw['key'] as String,
            raw['done'] == true,
            n(raw['progress']),
            n(raw['goal']),
          ),
    };
    return MissionStatus(
      items: items,
      dailyDone: n(row['dailyDone']) ?? 0,
      dailyTotal: n(row['dailyTotal']) ?? 0,
      todayRemainingPoint: _finite(row['todayRemainingPoint']) ? _num(row['todayRemainingPoint']) : 0,
    );
  }

  /// 약관 본문 (공개). content 가 null 이면 미등록.
  Future<({String? title, String? content})> term(String key) async {
    final row = await _get('/api/term/${Uri.encodeComponent(key)}');
    if (row is! Map) return (title: null, content: null);
    String? s(Object? v) => v is String && v.isNotEmpty ? v : null;
    return (title: s(row['title']), content: s(row['content']));
  }

  Future<void> consent(List<String> keys) => _post('/api/term/consent', {'keys': keys});

  StreakClaim? _claim(Object? raw) {
    if (raw is! Map) return null;
    return StreakClaim(
      _finite(raw['process']) ? _num(raw['process']).toInt() : null,
      raw['beststreak'],
      raw['hitrate'],
    );
  }

  /// 204(신청 없음)는 null.
  Future<StreakClaim?> myClaim() async => _claim(await _get('/api/streak/claim'));
  Future<StreakClaim?> claim(String naverId) async =>
      _claim(await _post('/api/streak/claim', {'naverId': naverId}));
}
