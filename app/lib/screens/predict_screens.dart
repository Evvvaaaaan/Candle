import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../api/candle_api.dart';
import '../api/client.dart';
import '../config.dart';
import '../state.dart';
import '../theme.dart';
import '../ui/icons.dart';
import '../ui/sheets.dart';
import '../ui/widgets.dart';

/// Runs [job] and reports failures on [context].
Future<void> _guard(BuildContext context, Future<void> Function() job) async {
  try {
    await job();
  } catch (error) {
    if (context.mounted) report(context, error);
  }
}

String _quote(Topic? t) => t?.price == null ? '—' : '${fmt(t!.price!)}원';
String _change(Topic? t) => t?.rate == null ? '—' : rateText(t!.rate!);
String _meta(Topic? t) => t == null ? '—' : '${t.code} · ${t.market}';

// ---------------------------------------------------------------- home

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, this.tutorial = false});
  final bool tutorial;
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Streak? _streak;
  Topic? _detail;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }

  Future<void> _start() async {
    await _load();
    if (!mounted) return;
    final state = AppScope.read(context);
    if (widget.tutorial && !state.tutorialSeen) {
      await showTutorial(context);
    } else if (state.tutorialSeen) {
      maybeShowLastResult(context).catchError((_) {});
    }
  }

  String? _requestedTopic;
  bool _quoteStarted = false;

  /// Reloads the quote whenever the selected stock changes (e.g. after
  /// returning from 종목 변경).
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final id = AppScope.of(context).topic?.id;
    if (_quoteStarted && id != null && id != _requestedTopic) _loadQuote();
  }

  Future<void> _loadQuote() {
    final state = AppScope.read(context);
    final topic = state.topic;
    _quoteStarted = true;
    _requestedTopic = topic?.id;
    if (topic == null) return Future.value();
    return _guard(context, () async {
      final d = await state.api.topic(topic.id);
      if (mounted && AppScope.read(context).topic?.id == d.id) setState(() => _detail = d);
    });
  }

  Future<void> _load() async {
    final state = AppScope.read(context);
    await Future.wait([
      _guard(context, () async {
        final s = await state.api.streak();
        if (mounted) setState(() => _streak = s);
      }),
      _guard(context, () => state.refreshBalance()),
      _guard(context, () => state.refreshTickets()),
      _loadQuote(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final topic = state.topic;
    final detail = _detail?.id == topic?.id ? _detail : null;
    final current = _streak?.current;
    final quoteReady = detail != null;

    void predict(String direction) {
      state.chooseDirection(direction);
      context.push('/prediction');
    }

    return PageBody(
      header: const AppHeader(),
      onRefresh: _load,
      children: [
        const Heading('오늘의 종목을 예측해 보세요', sub: '다음 거래일 방향을 선택하세요.'),
        _AdSlot(onTap: () => context.go('/stock-select')),
        const SizedBox(height: 12),
        CandleCard(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
              Text(current == null ? '—' : fmt(current),
                  style: font(48, weight: FontWeight.w800, height: 52, color: C.primary, spacing: -1 / 48)),
              const SizedBox(width: 4),
              Padding(
                padding: const EdgeInsets.only(top: 14),
                child: Text('연승', style: font(18, weight: FontWeight.w700)),
              ),
              const Spacer(),
              TextButton(
                onPressed: () => context.push('/prediction-history'),
                child: Text('내역 보기 ›', style: font(11, color: C.textMid)),
              ),
            ]),
            const SizedBox(height: 14),
            _StreakTrack(current: current),
            const SizedBox(height: 12),
            Text.rich(TextSpan(style: font(13, height: 20, color: C.textMid), children: [
              TextSpan(
                  text: _streak == null ? '—' : fmt(_streak!.remaining),
                  style: const TextStyle(color: C.textDark, fontWeight: FontWeight.w700)),
              const TextSpan(text: '번 더 맞히면 보상을 받아요'),
            ])),
          ]),
        ),
        const SizedBox(height: 12),
        CandleCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('선택한 종목', style: T.label),
                  const SizedBox(height: 2),
                  Text(topic?.title ?? '종목을 선택해 주세요', style: font(20, weight: FontWeight.w700, height: 28)),
                  Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
                    Text(_quote(detail), style: font(14, weight: FontWeight.w700, height: 22)),
                    const SizedBox(width: 6),
                    Text(_change(detail), style: font(12, color: C.textMid)),
                  ]),
                  Text(_meta(topic), style: T.label),
                ]),
              ),
              OutlinedButton(
                onPressed: () => context.push('/stock-select?return=home'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(0, 32),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  side: const BorderSide(color: C.border),
                  shape: const StadiumBorder(),
                  foregroundColor: C.primary,
                ),
                child: Text('종목 변경', style: font(11, weight: FontWeight.w500, color: C.primary)),
              ),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: DirectionCard(up: true, height: 64, onTap: quoteReady ? () => predict('up') : null)),
              const SizedBox(width: 10),
              Expanded(child: DirectionCard(up: false, height: 64, onTap: quoteReady ? () => predict('down') : null)),
            ]),
          ]),
        ),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
            child: _Stat(
              icon: Ic.coin,
              label: '모은 포인트',
              value: state.balance == null ? '—' : '${fmt(state.balance!)} P',
              onTap: () => context.push('/wallet?tab=all'),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _Stat(
              icon: Ic.ticket,
              label: '예측권',
              value: state.tickets == null ? '—' : '${fmt(state.tickets!.amount)}회',
              onTap: () => context.push('/pass'),
            ),
          ),
        ]),
        const SizedBox(height: 12),
        CandleCard(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('참여할수록 더 쌓여요', style: T.label),
            MenuRow(
              icon: Ic.calendarCheck,
              iconColor: C.up,
              iconBg: C.upBg,
              title: '출석하고 포인트 받기',
              sub: '하루 한 번, 미션에서 받을 수 있어요',
              onTap: () => context.go('/missions'),
            ),
            const Divider(color: C.border, height: 1),
            MenuRow(
              icon: Ic.trophy,
              iconColor: C.amber,
              iconBg: C.amberBg,
              title: '10연승에 도전해 볼까요?',
              sub: '적중률 1위에게 100만원 리워드',
              onTap: () => context.push('/challenge'),
            ),
            const Divider(color: C.border, height: 1),
            MenuRow(
              icon: Ic.play,
              title: '예측권을 더 받아보세요',
              sub: '광고 15초 보고 1장 더',
              onTap: () => showRewardAdSheet(context, 'home'),
            ),
          ]),
        ),
      ],
    );
  }
}

class _AdSlot extends StatelessWidget {
  const _AdSlot({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          height: 96,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: const LinearGradient(
              begin: Alignment(-0.9, -1),
              end: Alignment(0.9, 1),
              colors: [Color(0xFF12284A), Color(0xFF2557A8), Color(0xFF3174CF)],
              stops: [0, 0.6, 1],
            ),
          ),
          child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.end, children: [
                Text('AD  오늘의 브랜드 · Candle', style: font(10, height: 14, color: Colors.white.withValues(alpha: 0.68))),
                const SizedBox(height: 5),
                Text('하루 1분,\n금융 감각을 키우는 습관',
                    style: font(16, weight: FontWeight.w700, height: 21, color: Colors.white, spacing: -0.01)),
              ]),
            ),
            Text('살펴보기 ›', style: font(10, color: Colors.white.withValues(alpha: 0.88))),
          ]),
        ),
      );
}

class _StreakTrack extends StatelessWidget {
  const _StreakTrack({required this.current});
  final int? current;
  @override
  Widget build(BuildContext context) => Row(children: [
        for (var i = 0; i < 10; i++) ...[
          if (i > 0) const SizedBox(width: 4),
          Expanded(
            child: AspectRatio(
              aspectRatio: 1,
              child: Builder(builder: (context) {
                final reward = i == 9;
                final done = !reward && current != null && i < current!;
                final next = !reward && current != null && i == current;
                return Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: reward ? C.primaryLight : done ? C.primary : next ? C.surface : C.surfaceSubtle,
                    border: next ? Border.all(color: C.primary, width: 1.5) : null,
                  ),
                  alignment: Alignment.center,
                  child: reward
                      ? const CandleIcon(Ic.gift, color: C.primary, size: 16)
                      : done
                          ? const CandleIcon(Ic.check, color: Colors.white, size: 16)
                          : Text('${i + 1}', style: font(12, weight: FontWeight.w600, color: next ? C.primary : C.textLight)),
                );
              }),
            ),
          ),
        ],
      ]);
}

class _Stat extends StatelessWidget {
  const _Stat({required this.icon, required this.label, required this.value, required this.onTap});
  final String icon, label, value;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => CandleCard(
        padding: const EdgeInsets.all(14),
        onTap: onTap,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            IconTile(icon, size: 32),
            const SizedBox(width: 8),
            Expanded(child: Text(label, style: font(12, color: C.textMid))),
            const CandleIcon(Ic.chevron, color: C.textLight, size: 16),
          ]),
          const SizedBox(height: 10),
          Text(value, style: font(18, weight: FontWeight.w700, height: 26, spacing: -0.01)),
        ]),
      );
}

// ---------------------------------------------------------------- stock select

class StockSelectScreen extends StatefulWidget {
  const StockSelectScreen({super.key, this.returnHome = false});
  final bool returnHome;
  @override
  State<StockSelectScreen> createState() => _StockSelectScreenState();
}

class _StockSelectScreenState extends State<StockSelectScreen> {
  static const _markets = [('all', '전체'), ('코스피', '코스피'), ('코스닥', '코스닥'), ('watchlist', '관심종목')];
  final _query = TextEditingController();
  String _market = 'all';
  int _version = 0;
  Timer? _timer;
  List<Topic>? _rows;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _search());
  }

  @override
  void dispose() {
    _timer?.cancel();
    _query.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final current = ++_version;
    final state = AppScope.read(context);
    if (_market == 'watchlist') {
      final q = _query.text.trim().toLowerCase();
      setState(() => _rows = state.watchlist.where((t) => '${t.code} ${t.title}'.toLowerCase().contains(q)).toList());
      return;
    }
    try {
      final rows = await state.api.topics(_query.text.trim(), _market == 'all' ? '' : _market);
      if (mounted && current == _version) setState(() => _rows = rows);
    } catch (error) {
      if (mounted && current == _version) report(context, error);
    }
  }

  void _choose(Topic topic) {
    AppScope.read(context).chooseTopic(topic);
    if (widget.returnHome) {
      context.canPop() ? context.pop() : context.go('/home');
    } else {
      context.push('/prediction');
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedId = AppScope.of(context).topic?.id;
    final rows = _rows;
    return PageBody(
      header: widget.returnHome ? const PageHeader('종목 선택', fallback: '/home') : const AppHeader(),
      children: [
        const Heading('어떤 종목을 예측할까요?', sub: '종목을 고르면 다음 거래일 방향을 예측할 수 있어요.'),
        TextField(
          key: const Key('stock-search'),
          controller: _query,
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            hintText: '종목명 또는 종목코드 검색',
            prefixIcon: Padding(
              padding: const EdgeInsets.only(left: 14, right: 6),
              child: Text('⌕', style: mono(18, color: C.textLight)),
            ),
            prefixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          ),
          onChanged: (_) {
            _timer?.cancel();
            _version++;
            _timer = Timer(const Duration(milliseconds: 250), _search);
          },
        ),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            for (final (key, label) in _markets)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Material(
                  color: key == _market ? C.textDark : C.surfaceSubtle,
                  shape: const StadiumBorder(),
                  child: InkWell(
                    customBorder: const StadiumBorder(),
                    onTap: () {
                      _timer?.cancel();
                      setState(() => _market = key);
                      _search();
                    },
                    child: SizedBox(
                      height: 34,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        child: Center(
                          child: Text(label,
                              style: font(13,
                                  weight: key == _market ? FontWeight.w700 : FontWeight.w400,
                                  color: key == _market ? Colors.white : C.textMid)),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ]),
        ),
        const SizedBox(height: 18),
        Row(children: [
          Text(_market == 'watchlist' ? '관심종목' : '국내 종목', style: T.section),
          const Spacer(),
          Text(rows == null ? '' : '${rows.length}개', style: font(12, color: C.textMid)),
        ]),
        const SizedBox(height: 12),
        if (rows != null && rows.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text(
              _market == 'watchlist' ? '관심종목이 없습니다. 예측 화면의 책갈피로 추가해 보세요.' : '검색 결과가 없습니다.',
              textAlign: TextAlign.center,
              style: font(13, color: C.textMid),
            ),
          )
        else if (rows != null)
          CandleCard(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Column(children: [
              for (final t in rows)
                InkWell(
                  onTap: () => _choose(t),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    child: Row(children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(color: C.primaryLight, borderRadius: BorderRadius.circular(11)),
                        alignment: Alignment.center,
                        child: Text(t.title.characters.first, style: font(14, weight: FontWeight.w700, color: C.primary)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(t.title, style: font(14, weight: FontWeight.w500, height: 20)),
                          Text('${t.code} · ${t.market}', style: font(12, color: C.textMid)),
                        ]),
                      ),
                      Text(t.id == selectedId ? '선택됨' : '선택',
                          style: font(12, weight: FontWeight.w500, color: t.id == selectedId ? C.primary : C.textMid)),
                    ]),
                  ),
                ),
            ]),
          )
        else
          const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
        const SizedBox(height: 12),
        Text('서버에서 조회한 종목입니다.', style: font(12, color: C.textLight)),
      ],
    );
  }
}

// ---------------------------------------------------------------- prediction

/// Messages for the negative ids returned by the predict endpoint.
String predictionMessage(int id) =>
    const {
      -100: '예측 마감 시간이 지났습니다. 다음 거래일 회차에 참여해 주세요.',
      -110: '이미 참여한 종목이에요. 접수된 예측은 변경할 수 없어요.',
      -130: '오늘은 10회까지 참여할 수 있어요. 내일 다시 도전해 주세요.',
      -120: '예측권이 부족합니다. 광고를 보고 예측권을 받아 주세요.',
    }[id] ??
    '예측이 접수되었습니다.';

class PredictionScreen extends StatefulWidget {
  const PredictionScreen({super.key});
  @override
  State<PredictionScreen> createState() => _PredictionScreenState();
}

class _PredictionScreenState extends State<PredictionScreen> {
  Topic? _detail;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final state = AppScope.read(context);
    final topic = state.topic;
    if (topic == null) {
      context.go('/stock-select');
      return;
    }
    await Future.wait([
      _guard(context, () async {
        final d = await state.api.topic(topic.id);
        if (mounted) setState(() => _detail = d);
      }),
      _guard(context, () => state.refreshTickets()),
    ]);
  }

  Future<void> _submit(Topic detail, String direction) async {
    if (_busy) return;
    final state = AppScope.read(context);
    if (state.topic?.id != detail.id) return announce(context, '종목 정보를 조회한 후 제출해 주세요.');
    setState(() => _busy = true);
    try {
      final id = await state.api.predict(detail.id, direction == 'down' ? answerDown : answerUp);
      if (mounted) announce(context, predictionMessage(id));
      await state.refreshTickets();
    } catch (error) {
      if (mounted) report(context, error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _review(Topic detail) {
    final state = AppScope.read(context);
    final up = state.direction == 'up';
    showCandleSheet(context, (sheet) => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text('선택한 예측 확인', style: font(18, weight: FontWeight.w700, height: 26)),
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(border: Border.all(color: C.border), borderRadius: BorderRadius.circular(16)),
            child: Column(children: [
              SummaryRow('종목', detail.title),
              SummaryRow('종목 정보', _meta(detail)),
              SummaryRow('조회 가격', '${_quote(detail)} ${_change(detail)}'),
              SummaryRow('예측 방향', up ? '상승' : '하락', valueColor: up ? C.up : C.down),
            ]),
          ),
          Text('예측권 1장이 사용돼요.\n접수 후에는 변경할 수 없어요.', style: font(12, height: 20, color: C.textMid)),
          const SizedBox(height: 18),
          PrimaryButton('예측 제출', onPressed: () {
            Navigator.pop(sheet);
            _submit(detail, state.direction);
          }),
          TextButton(
            onPressed: () => Navigator.pop(sheet),
            style: TextButton.styleFrom(minimumSize: const Size.fromHeight(44)),
            child: Text('취소', style: font(13, color: C.textMid)),
          ),
        ]));
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final topic = state.topic;
    final detail = _detail?.id == topic?.id ? _detail : null;
    final ready = detail != null && !_busy;
    final watched = topic != null && state.isWatched(topic.id);
    return PageBody(
      header: const PageHeader('예측', fallback: '/home'),
      children: [
        CandleCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(topic?.title ?? '—', style: T.heading)),
              IconButton(
                tooltip: watched ? '관심종목에서 빼기' : '관심종목에 추가',
                onPressed: detail == null ? null : () => state.toggleWatch(detail),
                icon: watched
                    ? const Icon(Icons.bookmark, color: C.primary)
                    : const CandleIcon(Ic.bookmark, color: C.textMid),
              ),
            ]),
            Text(_meta(topic), style: T.sub),
            const SizedBox(height: 20),
            Row(children: [
              Text('조회 가격', style: font(14, weight: FontWeight.w700, height: 22)),
              const Spacer(),
              Text('${_quote(detail)} ${_change(detail)}', style: font(14, weight: FontWeight.w700, height: 22)),
            ]),
          ]),
        ),
        const SizedBox(height: 12),
        _TicketCard(tickets: state.tickets, onTap: () => context.push('/pass')),
        const SizedBox(height: 20),
        Text('다음 거래일 종가를 예측해 보세요', style: T.section),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
            child: DirectionCard(
              up: true,
              selected: state.direction == 'up',
              onTap: ready ? () => state.chooseDirection('up') : null,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: DirectionCard(
              up: false,
              selected: state.direction == 'down',
              onTap: ready ? () => state.chooseDirection('down') : null,
            ),
          ),
        ]),
        const SizedBox(height: 16),
        PrimaryButton('예측 확인', onPressed: ready ? () => _review(detail) : null),
        const SizedBox(height: 10),
        Text('예측권은 제출할 때 사용되며, 접수 후에는 변경할 수 없어요.', style: font(12, height: 18, color: C.textMid)),
      ],
    );
  }
}

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.tickets, this.onTap});
  final Tickets? tickets;
  final VoidCallback? onTap;
  @override
  Widget build(BuildContext context) => CandleCard(
        onTap: onTap,
        child: Row(children: [
          Text('사용 가능한 예측권', style: font(14, weight: FontWeight.w500)),
          const Spacer(),
          Text(tickets == null ? '—' : '${fmt(tickets!.amount)}회',
              style: font(22, weight: FontWeight.w700, height: 30, color: C.primary)),
          if (onTap != null) ...[const SizedBox(width: 4), const CandleIcon(Ic.chevron, color: C.textLight, size: 18)],
        ]),
      );
}

// ---------------------------------------------------------------- pass

class PassScreen extends StatefulWidget {
  const PassScreen({super.key});
  @override
  State<PassScreen> createState() => _PassScreenState();
}

class _PassScreenState extends State<PassScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _guard(context, () => AppScope.read(context).refreshTickets()));
  }

  @override
  Widget build(BuildContext context) {
    final tickets = AppScope.of(context).tickets;
    final ad = tickets?.ad;
    return PageBody(
      header: const PageHeader('', fallback: '/home'),
      onRefresh: () => _guard(context, () => AppScope.read(context).refreshTickets()),
      children: [
        const Heading('추가 예측권', sub: '영상 광고의 완료가 확인되면 예측권을 받을 수 있습니다.'),
        _TicketCard(tickets: tickets),
        const SizedBox(height: 12),
        CandleCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Row(children: [
              Text('광고 보고 예측권 받기', style: font(14, weight: FontWeight.w700, height: 22)),
              const Spacer(),
              Text('오늘 ${ad ?? '—'} / ${AppConfig.adLimit}회', style: font(12, height: 18, color: C.textMid)),
            ]),
            const SizedBox(height: 2),
            Text('광고 시청을 끝까지 완료하면 예측권이 지급됩니다.', style: font(12, height: 18, color: C.textMid)),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (ad ?? 0) / AppConfig.adLimit,
                minHeight: 7,
                color: C.primary,
                backgroundColor: C.primaryLight,
              ),
            ),
            const SizedBox(height: 14),
            PrimaryButton(
              '광고 보기',
              onPressed: ad != null && ad >= AppConfig.adLimit ? null : () => showRewardAdSheet(context, 'pass'),
            ),
          ]),
        ),
        const SizedBox(height: 12),
        PrimaryButton('예측하러 가기', secondary: true, onPressed: () => context.go('/stock-select')),
      ],
    );
  }
}

// ---------------------------------------------------------------- prediction history

class PredictionHistoryScreen extends StatefulWidget {
  const PredictionHistoryScreen({super.key});
  @override
  State<PredictionHistoryScreen> createState() => _PredictionHistoryScreenState();
}

class _PredictionHistoryScreenState extends State<PredictionHistoryScreen> {
  final _rows = <PredictionRow>[];
  final _claimed = <Object>{};
  final _claiming = <Object>{};
  Object? _cursor;
  bool _busy = false;
  bool _more = false;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _next());
  }

  Future<void> _next() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final rows = await AppScope.read(context).api.predictions(_cursor);
      if (!mounted) return;
      setState(() {
        _rows.addAll(rows);
        if (rows.isNotEmpty) _cursor = rows.last.id;
        _more = rows.length >= 20;
      });
    } catch (error) {
      if (mounted) report(context, error);
    } finally {
      if (mounted) {
        setState(() {
          _busy = false;
          _loaded = true;
        });
      }
    }
  }

  Future<void> _claim(PredictionRow row) async {
    if (_claiming.contains(row.id)) return;
    setState(() => _claiming.add(row.id));
    final state = AppScope.read(context);
    try {
      await state.api.claimPrediction(row.id);
      if (!mounted) return;
      setState(() => _claimed.add(row.id));
      announce(context, '${fmt(row.point)}P를 받았어요.');
      state.refreshBalance().catchError((_) => 0);
    } on ApiException catch (error) {
      if (!mounted) return;
      if (error.status == 409) {
        setState(() => _claimed.add(row.id));
        announce(context, '이미 받았거나 아직 받을 수 없는 보상이에요.');
      } else {
        report(context, error);
      }
    } finally {
      if (mounted) setState(() => _claiming.remove(row.id));
    }
  }

  Widget _card(PredictionRow row) {
    final status = row.status;
    final (icon, color, bg) = switch (status) {
      'hit' => (Ic.check, C.up, C.upBg),
      'miss' => (Ic.alert, C.down, C.downBg),
      _ => (Ic.clock, C.primary, C.iconTile),
    };
    final direction = row.answer == answerDown ? '↘ 하락' : '↗ 상승';
    final rewarded = row.rewarded || _claimed.contains(row.id);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: CandleCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            IconTile(icon, color: color, background: bg),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(row.topicTitle, style: font(15, weight: FontWeight.w700, height: 22)),
                Text.rich(TextSpan(style: font(12, height: 18, color: C.textMid), children: [
                  TextSpan(text: direction, style: const TextStyle(fontWeight: FontWeight.w700, color: C.textDark)),
                  if (status == 'pending')
                    const TextSpan(text: ' · 결과 확정 후 확인')
                  else ...[
                    TextSpan(text: ' · ${fmt(row.point)}P · '),
                    TextSpan(
                      text: status == 'hit' ? '적중' : '미적중',
                      style: TextStyle(color: status == 'hit' ? C.up : C.down, fontWeight: FontWeight.w700),
                    ),
                  ],
                ])),
              ]),
            ),
            if (status == 'pending')
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                decoration: BoxDecoration(color: C.primaryLight, borderRadius: BorderRadius.circular(999)),
                child: Text('결과 대기', style: font(11, height: 16, color: C.primary)),
              ),
          ]),
          if (status != 'pending') ...[
            const SizedBox(height: 12),
            PrimaryButton(
              rewarded ? '수령 완료' : '${fmt(row.point)}P 받기',
              height: 44,
              onPressed: rewarded || _claiming.contains(row.id) ? null : () => _claim(row),
            ),
          ],
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => PageBody(
        header: const PageHeader('예측 내역', fallback: '/profile'),
        children: [
          for (final row in _rows) _card(row),
          if (_loaded && _rows.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Text('아직 예측 내역이 없어요.', textAlign: TextAlign.center, style: font(13, color: C.textMid)),
            ),
          if (!_loaded) const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
          if (_more) PrimaryButton('더 보기', secondary: true, onPressed: _busy ? null : _next),
        ],
      );
}
