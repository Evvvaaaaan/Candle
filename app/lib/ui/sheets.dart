import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../ads/reward_ad.dart';
import '../api/candle_api.dart';
import '../config.dart';
import '../state.dart';
import '../theme.dart';
import 'icons.dart';
import 'widgets.dart';

/// `#reward-ad-dialog`: remaining ad allowance, then the rewarded ad.
Future<void> showRewardAdSheet(BuildContext context, String from) {
  final state = AppScope.read(context);
  return showCandleSheet(context, (sheet) {
    final remaining = state.tickets == null ? null : AppConfig.adLimit - state.tickets!.ad;
    return Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Center(
        child: Container(
          width: 56,
          height: 56,
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(color: C.iconTile, borderRadius: BorderRadius.circular(18)),
          alignment: Alignment.center,
          child: const CandleIcon(Ic.play, color: C.primary, size: 28),
        ),
      ),
      Text('광고 보고 예측권 받기', textAlign: TextAlign.center, style: font(18, weight: FontWeight.w700, height: 26)),
      const SizedBox(height: 6),
      Text('영상 광고를 끝까지 시청하면\n예측권 1장을 받을 수 있어요.',
          textAlign: TextAlign.center, style: font(14, height: 21, color: C.textMid)),
      Container(
        margin: const EdgeInsets.fromLTRB(0, 20, 0, 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(color: C.iconTile, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Text('오늘 남은 참여', style: font(13)),
          const Spacer(),
          Text(remaining == null ? '—' : '$remaining', style: font(13, weight: FontWeight.w700)),
          Text(' / ${AppConfig.adLimit}회', style: font(13, color: C.textMid)),
        ]),
      ),
      Text('광고를 본 뒤 이 화면으로 돌아오면 완료 여부를 확인해요.\n예측은 자동으로 제출되지 않아요.',
          style: font(12, height: 20, color: C.textMid)),
      const SizedBox(height: 18),
      PrimaryButton(
        '광고 시청하기',
        onPressed: remaining == 0
            ? null
            : () {
                Navigator.pop(sheet);
                watchRewardAd(context, from);
              },
      ),
      TextButton(
        onPressed: () => Navigator.pop(sheet),
        style: TextButton.styleFrom(minimumSize: const Size.fromHeight(44), foregroundColor: C.textMid),
        child: Text('나중에 할게요', style: font(13, color: C.textMid)),
      ),
    ]);
  });
}

/// `#tutorial-dialog`: three slides; closing it any way marks it seen.
Future<void> showTutorial(BuildContext context) async {
  final state = AppScope.read(context);
  await showDialog<void>(
    context: context,
    barrierColor: const Color(0x8C0F172A),
    builder: (_) => const _Tutorial(),
  );
  state.tutorialSeen = true;
}

class _Tutorial extends StatefulWidget {
  const _Tutorial();
  @override
  State<_Tutorial> createState() => _TutorialState();
}

class _TutorialState extends State<_Tutorial> {
  final _pages = PageController();
  int _index = 0;

  @override
  void dispose() {
    _pages.dispose();
    super.dispose();
  }

  Widget _slide(List<Widget> children) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: children),
      );

  @override
  Widget build(BuildContext context) {
    final title = font(22, weight: FontWeight.w700, height: 29.9, spacing: -0.02);
    final desc = font(14, height: 23, color: C.textMid);
    final rules = font(12, height: 18, color: C.textMid);
    final bold = font(12, height: 18, weight: FontWeight.w700, color: C.textDark);
    return Dialog(
      backgroundColor: C.surface,
      insetPadding: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420, maxHeight: 520),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Align(
            alignment: Alignment.centerRight,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(0, 8, 8, 0),
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text('건너뛰기', style: font(14, color: C.textMid)),
              ),
            ),
          ),
          SizedBox(
            height: 330,
            child: PageView(
              controller: _pages,
              onPageChanged: (i) => setState(() => _index = i),
              children: [
                _slide([
                  Text('10', style: font(64, weight: FontWeight.w700, height: 64, color: C.primary, spacing: -0.03)),
                  const SizedBox(height: 12),
                  Text('10일 연속 예측 성공', style: title, textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  Text('매일 상승·하락을 맞히면 보상이 쌓여요.', style: desc, textAlign: TextAlign.center),
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(top: 16),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(color: C.surfaceSubtle, borderRadius: BorderRadius.circular(12)),
                    child: Text.rich(TextSpan(style: rules, children: [
                      const TextSpan(text: '하루 '),
                      TextSpan(text: '10회', style: bold),
                      const TextSpan(text: '까지 참여할 수 있어요.\n적중률 '),
                      TextSpan(text: '50% 초과', style: bold),
                      const TextSpan(text: '면 연승이 유지돼요.'),
                    ])),
                  ),
                ]),
                _slide([
                  Container(
                    width: 56,
                    height: 56,
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(color: C.iconTile, borderRadius: BorderRadius.circular(18)),
                    alignment: Alignment.center,
                    child: const CandleIcon(Ic.play, color: C.primary, size: 28),
                  ),
                  Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: C.upBg, borderRadius: BorderRadius.circular(999)),
                    child: Text('리스크 0%', style: font(12, weight: FontWeight.w700, color: C.up)),
                  ),
                  Text.rich(
                    TextSpan(style: title, children: const [
                      TextSpan(text: '광고 시청 → 예측 →\n'),
                      TextSpan(text: '100만원', style: TextStyle(color: C.primary)),
                    ]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text('접속하면 하루 1장의 예측권이 지급돼요.\n광고 15초만 보면 예측권을 더 받을 수 있어요.',
                      style: desc, textAlign: TextAlign.center),
                ]),
                _slide([
                  const Row(children: [
                    Expanded(child: DirectionCard(up: true, selected: true, height: 72)),
                    SizedBox(width: 10),
                    Expanded(child: DirectionCard(up: false, selected: true, height: 72)),
                  ]),
                  const SizedBox(height: 20),
                  Text('다음 거래일 종가, 오를까요 내릴까요?', style: title, textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  Text('오늘 종가와 비교해요.\n매일 09:00부터 15:30까지 참여할 수 있어요.',
                      style: desc, textAlign: TextAlign.center),
                ]),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
            child: Column(children: [
              PagerDots(
                count: 3,
                index: _index,
                onTap: (i) => _pages.animateToPage(i, duration: const Duration(milliseconds: 280), curve: Curves.easeOut),
              ),
              const SizedBox(height: 16),
              PrimaryButton(
                _index == 2 ? '시작하기' : '다음',
                onPressed: () => _index == 2
                    ? Navigator.pop(context)
                    : _pages.nextPage(duration: const Duration(milliseconds: 280), curve: Curves.easeOut),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

/// `#last-result-dialog`: the latest scored day's results, once per date.
Future<void> maybeShowLastResult(BuildContext context) async {
  final state = AppScope.read(context);
  final rows = await state.api.predictions();
  final settled = rows.where((r) => r.status != 'pending' && r.roundDate != null).toList();
  if (settled.isEmpty || !context.mounted) return;
  final date = (settled.map((r) => r.roundDate!).toList()..sort()).last;
  if (state.lastResultSeen == date) return;
  final day = settled.where((r) => r.roundDate == date).toList();
  final hits = day.where((r) => r.status == 'hit').length;
  final goHistory = await showCandleSheet<bool>(context, (sheet) => _LastResult(day: day, date: date, hits: hits));
  state.lastResultSeen = date;
  if (goHistory == true && context.mounted) context.push('/prediction-history');
}

class _LastResult extends StatefulWidget {
  const _LastResult({required this.day, required this.date, required this.hits});
  final List<PredictionRow> day;
  final String date;
  final int hits;
  @override
  State<_LastResult> createState() => _LastResultState();
}

class _LastResultState extends State<_LastResult> {
  int _index = 0;

  Widget _card(PredictionRow item) {
    final rate = item.rate == null ? '—' : rateText(item.rate!);
    final rateColor = item.result == answerUp ? C.up : item.result == answerDown ? C.down : null;
    final down = item.answer == answerDown;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(border: Border.all(color: C.border), borderRadius: BorderRadius.circular(16)),
      child: Column(children: [
        SummaryRow('종목', item.topicTitle),
        SummaryRow('내 예측', down ? '하락' : '상승', valueColor: down ? C.down : C.up),
        SummaryRow('실제 등락', rate, valueColor: rateColor),
        SummaryRow('결과', item.status == 'hit' ? '적중' : '미적중'),
        SummaryRow('보상', item.rewarded ? '+${fmt(item.point)}P (수령 완료)' : '+${fmt(item.point)}P'),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) => Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('지난 예측 결과', style: font(18, weight: FontWeight.w700, height: 26)),
        const SizedBox(height: 12),
        SizedBox(
          height: 222,
          child: PageView(
            onPageChanged: (i) => setState(() => _index = i),
            children: [for (final item in widget.day) Padding(padding: const EdgeInsets.symmetric(horizontal: 2), child: _card(item))],
          ),
        ),
        if (widget.day.length > 1) ...[const SizedBox(height: 10), Center(child: PagerDots(count: widget.day.length, index: _index))],
        const SizedBox(height: 12),
        Text(
          '${widget.date.replaceAll('-', '.')} 결과 · ${widget.day.length}개 중 ${widget.hits}개 적중. 보상은 예측 내역에서 받을 수 있어요.',
          style: font(12, height: 20, color: C.textMid),
        ),
        const SizedBox(height: 18),
        PrimaryButton('확인', onPressed: () => Navigator.pop(context, false)),
        TextButton(
          onPressed: () => Navigator.pop(context, true),
          style: TextButton.styleFrom(minimumSize: const Size.fromHeight(44)),
          child: Text('내역 보기', style: font(13, color: C.textMid)),
        ),
      ]);
}
