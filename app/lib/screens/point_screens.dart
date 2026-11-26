import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../api/candle_api.dart';
import '../api/client.dart';
import '../config.dart';
import '../state.dart';
import '../theme.dart';
import '../ui/icons.dart';
import '../ui/legal_sheet.dart';
import '../ui/sheets.dart';
import '../ui/widgets.dart';
import '../validators.dart';

Future<void> _guard(BuildContext context, Future<void> Function() job) async {
  try {
    await job();
  } catch (error) {
    if (context.mounted) report(context, error);
  }
}

Widget _sectionTitle(String text, {Widget? trailing}) => Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 10),
      child: Row(children: [Text(text, style: T.section), const Spacer(), ?trailing]),
    );

Widget _progress(double value) => ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: LinearProgressIndicator(value: value.clamp(0, 1), minHeight: 7, color: C.primary, backgroundColor: C.primaryLight),
    );

class _PointsCard extends StatelessWidget {
  const _PointsCard({this.onHistory, this.icon = false});
  final VoidCallback? onHistory;
  final bool icon;
  @override
  Widget build(BuildContext context) {
    final balance = AppScope.of(context).balance;
    return CandleCard(
      child: SizedBox(
        height: 46,
        child: Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
              Text('보유 포인트', style: T.label),
              Text(balance == null ? '—' : '${fmt(balance)} P', style: T.number),
            ]),
          ),
          if (onHistory != null)
            TextButton(onPressed: onHistory, child: Text('내역 보기 ›', style: font(11, color: C.textMid))),
          if (icon) const IconTile(Ic.coin, size: 48),
        ]),
      ),
    );
  }
}

// ---------------------------------------------------------------- missions

class MissionsScreen extends StatefulWidget {
  const MissionsScreen({super.key});
  @override
  State<MissionsScreen> createState() => _MissionsScreenState();
}

class _MissionsScreenState extends State<MissionsScreen> {
  MissionStatus? _status;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() => _guard(context, () async {
        final s = await AppScope.read(context).api.mission();
        if (mounted) setState(() => _status = s);
      });

  Future<void> _attend() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final row = await AppScope.read(context).api.attendToday();
      await _load();
      if (mounted) announce(context, '출석 완료! 10P를 받았어요. ${row.streak}일 연속 출석 중이에요.');
    } catch (error) {
      if (mounted) report(context, error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _item({required String icon, required String title, required int reward, required Widget trailing, Widget? progress}) =>
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(children: [
          IconTile(icon),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: font(14, weight: FontWeight.w500, height: 20)),
              if (progress != null) ...[const SizedBox(height: 6), progress],
            ]),
          ),
          const SizedBox(width: 12),
          Text('${fmt(reward)}P', style: font(13, weight: FontWeight.w700, color: C.primary)),
          const SizedBox(width: 10),
          trailing,
        ]),
      );

  Widget _action(String label, {required bool primary, VoidCallback? onTap, Key? key}) => SizedBox(
        height: 34,
        child: TextButton(
          key: key,
          onPressed: onTap,
          style: TextButton.styleFrom(
            backgroundColor: primary ? C.primary : C.surfaceSubtle,
            foregroundColor: primary ? Colors.white : C.textMid,
            disabledBackgroundColor: C.surfaceSubtle,
            disabledForegroundColor: C.textLight,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            shape: const StadiumBorder(),
            textStyle: font(12, weight: FontWeight.w700),
          ),
          child: Text(label),
        ),
      );

  Widget _weekly(MissionItem? item, int fallbackGoal) {
    final goal = item?.goal ?? fallbackGoal;
    final value = item?.progress;
    return Row(children: [
      Expanded(child: _progress(value == null ? 0 : value / goal)),
      const SizedBox(width: 8),
      Text(value == null ? '— / $goal' : '${value.clamp(0, goal)} / $goal', style: font(11, color: C.textMid)),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final s = _status;
    final attended = s?.items['attend']?.done == true;
    final adDone = s?.items['ad']?.done == true;
    return PageBody(
      header: const AppHeader(),
      onRefresh: _load,
      children: [
        const Heading('오늘의 미션', sub: '작은 참여로 포인트를 차곡차곡 모아보세요.'),
        CandleCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Row(children: [
              Text('오늘 받을 수 있는 포인트', style: T.label),
              const Spacer(),
              Text(s == null ? '— / —' : '${s.dailyDone} / ${s.dailyTotal} 완료', style: font(12, color: C.textMid)),
            ]),
            const SizedBox(height: 4),
            Text.rich(TextSpan(children: [
              TextSpan(text: s == null ? '—' : fmt(s.todayRemainingPoint), style: T.number),
              TextSpan(text: 'P', style: font(14, weight: FontWeight.w700)),
            ])),
            const SizedBox(height: 10),
            _progress(s == null ? 0 : s.dailyDone / (s.dailyTotal == 0 ? 1 : s.dailyTotal)),
          ]),
        ),
        _sectionTitle('일일 미션'),
        CandleCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Column(children: [
            _item(
              icon: Ic.calendarCheck,
              title: '출석하기',
              reward: 10,
              trailing: _action(attended ? '완료' : '출석',
                  key: const Key('attendance'), primary: !attended, onTap: attended || _busy || s == null ? null : _attend),
            ),
            const Divider(color: C.border, height: 1),
            _item(
              icon: Ic.play,
              title: '광고 예측권 받기',
              reward: 10,
              trailing: _action(adDone ? '완료' : '하기', primary: false, onTap: () => context.go('/pass')),
            ),
          ]),
        ),
        _sectionTitle('주간 미션'),
        CandleCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Column(children: [
            _item(icon: Ic.calendarCheck, title: '이번 주 5일 출석', reward: 100, trailing: const SizedBox.shrink(), progress: _weekly(s?.items['week-attend'], 5)),
            const Divider(color: C.border, height: 1),
            _item(icon: Ic.circleCheck, title: '이번 주 예측 3회 적중', reward: 150, trailing: const SizedBox.shrink(), progress: _weekly(s?.items['week-hit'], 3)),
          ]),
        ),
      ],
    );
  }
}

// ---------------------------------------------------------------- challenge

class _ChallengeIcon extends StatelessWidget {
  const _ChallengeIcon();
  @override
  Widget build(BuildContext context) => Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(color: C.amberBg, borderRadius: BorderRadius.circular(18)),
        alignment: Alignment.center,
        child: const CandleIcon(Ic.trophy, color: C.amber, size: 28),
      );
}

class ChallengeScreen extends StatelessWidget {
  const ChallengeScreen({super.key});
  @override
  Widget build(BuildContext context) => PageBody(
        header: const PageHeader('', fallback: '/home'),
        children: [
          const Heading('10연승 챌린지', sub: '연속으로 예측에 성공하고 리워드에 도전하세요.'),
          CandleCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const _ChallengeIcon(),
              const SizedBox(height: 14),
              Text('10연승 달성자 중 최고 적중률 1명', style: T.label),
              const SizedBox(height: 2),
              Text('100만원 리워드', style: font(26, weight: FontWeight.w800, height: 34)),
              const SizedBox(height: 6),
              Text('10연승에 성공한 참여자 중\n적중률이 가장 높은 1명에게 리워드를 지급합니다.', style: font(13, height: 21, color: C.textMid)),
            ]),
          ),
          const SizedBox(height: 12),
          CandleCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('참여 안내', style: T.section),
              const SizedBox(height: 10),
              for (final (n, text) in const [
                (1, '종목을 선택하고 상승·하락을 예측하세요.'),
                (2, '예측 결과를 확인하며 10연승에 도전하세요.'),
                (3, '10연승 달성자 중 적중률이 가장 높은 1명이 리워드를 받습니다.'),
              ])
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: const BoxDecoration(color: C.primaryLight, shape: BoxShape.circle),
                      alignment: Alignment.center,
                      child: Text('$n', style: font(12, weight: FontWeight.w700, color: C.primary)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(child: Text(text, style: font(13, height: 21))),
                  ]),
                ),
              const SizedBox(height: 8),
              Text('적중률은 도전한 예측 수 중 성공한 예측 수의 비율이며, 10연승 달성만으로 지급이 확정되지는 않습니다.',
                  style: font(12, height: 18, color: C.textMid)),
            ]),
          ),
          const SizedBox(height: 16),
          PrimaryButton('당첨 확인 · 리워드 수령', onPressed: () => context.push('/challenge-reward')),
          const SizedBox(height: 8),
          PrimaryButton('예측하러 가기', secondary: true, onPressed: () => context.go('/stock-select')),
          const SizedBox(height: 8),
          PrimaryButton('내 예측 결과 확인', secondary: true, onPressed: () => context.push('/prediction-history')),
        ],
      );
}

class ChallengeRewardScreen extends StatefulWidget {
  const ChallengeRewardScreen({super.key});
  @override
  State<ChallengeRewardScreen> createState() => _ChallengeRewardScreenState();
}

class _ChallengeRewardScreenState extends State<ChallengeRewardScreen> {
  final _id = TextEditingController();
  final _confirm = TextEditingController();
  final _agreed = [false, false, false];
  String _status = '수령 자격을 확인하고 있어요.';
  String? _error;
  bool _busy = false;
  bool _closed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _detail());
  }

  @override
  void dispose() {
    _id.dispose();
    _confirm.dispose();
    super.dispose();
  }

  static String _claimText(StreakClaim c) =>
      const {
        200: '당첨되어 리워드 지급이 완료되었어요.',
        300: '이번 챌린지에는 선정되지 않았어요.',
      }[c.process] ??
      (c.process == 0 ? '수령 신청이 접수되었어요. (최고 ${c.bestStreak}연승 · 적중률 ${c.hitRate}%)' : '수령 신청 내역을 확인해 주세요.');

  Future<void> _detail() => _guard(context, () async {
        final api = AppScope.read(context).api;
        final streak = await api.streak();
        final claim = await api.myClaim();
        if (!mounted) return;
        setState(() {
          if (claim != null) {
            _status = _claimText(claim);
          } else if (streak.achieved) {
            _status = '최고 ${streak.best}연승을 달성했어요! 아래에서 수령 신청을 해 주세요.';
          } else {
            _status = '현재 ${streak.current}연승 · 최고 ${streak.best}연승이에요. 10연승을 달성하면 신청할 수 있어요.';
          }
          _closed = claim != null && claim.process != 0;
        });
      });

  Future<void> _submit() async {
    final error = naverIdError(_id.text, _confirm.text, agreed: !_agreed.contains(false));
    setState(() => _error = error);
    if (error != null || _busy) return;
    setState(() => _busy = true);
    try {
      final claim = await AppScope.read(context).api.claim(_id.text.trim());
      if (!mounted) return;
      setState(() {
        if (claim != null) _status = _claimText(claim);
        _error = '수령 신청이 접수되었어요. 심사 후 안내해 드릴게요.';
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.status == 409) {
        setState(() => _error = '10연승을 달성한 뒤에 신청할 수 있어요.');
      } else if (e.status == 400) {
        setState(() => _error = '올바른 네이버 ID를 입력해 주세요.');
      } else {
        report(context, e);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _check(int i, String label, {String? termKey}) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        InkWell(
          onTap: () => setState(() => _agreed[i] = !_agreed[i]),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              SizedBox(
                width: 24,
                height: 24,
                child: Checkbox(value: _agreed[i], onChanged: (v) => setState(() => _agreed[i] = v ?? false)),
              ),
              const SizedBox(width: 10),
              Expanded(child: Text(label, style: font(13, height: 21))),
            ]),
          ),
        ),
        if (termKey != null)
          Padding(
            padding: const EdgeInsets.only(left: 34),
            child: GestureDetector(
              onTap: () => showLegalSheet(context, termKey),
              child: Text('동의 내용 보기', style: font(12, color: C.primary)),
            ),
          ),
      ]);

  @override
  Widget build(BuildContext context) => PageBody(
        header: const PageHeader('', fallback: '/challenge'),
        children: [
          const Heading('10연승 리워드', sub: '당첨 확인부터 수령 신청까지 한곳에서'),
          CandleCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const _ChallengeIcon(),
              const SizedBox(height: 14),
              Text('10연승 달성자 중 최고 적중률 1명', style: T.label),
              Text('리워드 수령 안내', style: T.section),
              const SizedBox(height: 6),
              Text.rich(TextSpan(children: [
                TextSpan(text: '1,000,000', style: font(32, weight: FontWeight.w800, height: 40, color: C.primary)),
                TextSpan(text: '원 리워드', style: font(14, weight: FontWeight.w700, color: C.primary)),
              ])),
              const SizedBox(height: 8),
              Text(_status, key: const Key('reward-status'), style: font(13, height: 20, color: C.textMid)),
            ]),
          ),
          const SizedBox(height: 12),
          CandleCard(
            child: Column(children: [
              Row(children: [
                SvgPicture.asset('assets/images/npay-symbol.svg', width: 44, height: 44),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('네이버페이 포인트', style: font(14, weight: FontWeight.w700)),
                    Text('네이버 ID로 직접 적립', style: T.small),
                  ]),
                ),
              ]),
              const SizedBox(height: 10),
              const SummaryRow('지급 포인트', '1,000,000P'),
            ]),
          ),
          const SizedBox(height: 12),
          CandleCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Text('수령 정보', style: T.section),
              const SizedBox(height: 12),
              Text('포인트를 받을 네이버 ID', style: font(12, weight: FontWeight.w500, color: C.textMid)),
              const SizedBox(height: 6),
              TextField(
                key: const Key('reward-recipient'),
                controller: _id,
                maxLength: 100,
                autocorrect: false,
                enableSuggestions: false,
                textCapitalization: TextCapitalization.none,
                decoration: const InputDecoration(counterText: ''),
                onChanged: (_) => setState(() => _error = null),
              ),
              const SizedBox(height: 4),
              Text('닉네임이 아닌 네이버 로그인 ID를 입력해 주세요. 계정 확인은 지급 심사 시 진행됩니다.', style: T.small),
              const SizedBox(height: 12),
              Text('네이버 ID 다시 입력', style: font(12, weight: FontWeight.w500, color: C.textMid)),
              const SizedBox(height: 6),
              TextField(
                key: const Key('reward-confirm'),
                controller: _confirm,
                maxLength: 100,
                autocorrect: false,
                enableSuggestions: false,
                decoration: const InputDecoration(counterText: ''),
                onChanged: (_) => setState(() => _error = null),
              ),
              const SizedBox(height: 8),
              _check(0, '수령 정보 수집·이용 동의 (필수)', termKey: 'reward-collection'),
              _check(1, '개인정보 제3자 제공 동의 (필수)', termKey: 'reward-provision'),
              _check(2, '입력한 본인 네이버 계정의 네이버페이 이용약관 동의를 완료했으며, 지급 안내를 확인했습니다.'),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: font(12, height: 18, color: C.formError)),
              ],
              const SizedBox(height: 12),
              PrimaryButton('수령 신청하기', onPressed: _busy || _closed ? null : _submit),
              const SizedBox(height: 8),
              Text('10연승을 달성한 경우에만 신청할 수 있습니다. 당첨자는 심사 후 개별 안내됩니다.', style: T.small),
            ]),
          ),
          const SizedBox(height: 12),
          PrimaryButton('챌린지 안내', secondary: true, onPressed: () => context.canPop() ? context.pop() : context.go('/challenge')),
        ],
      );
}

// ---------------------------------------------------------------- shop / exchange / payout

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});
  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _guard(context, () => AppScope.read(context).refreshBalance()));
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final balance = state.balance;
    final selected = state.product;
    final affordable = balance != null && selected.points <= balance;
    return PageBody(
      header: const AppHeader(),
      onRefresh: () => _guard(context, () => state.refreshBalance()),
      bottom: PrimaryButton('${fmt(selected.amount)}원 교환하기', onPressed: affordable ? () => context.push('/exchange') : null),
      children: [
        const Heading('포인트 상점', sub: '보유 포인트로 교환을 신청하세요.'),
        _PointsCard(onHistory: () => context.push('/wallet?tab=use')),
        _sectionTitle('네이버페이 포인트로 교환', trailing: Text('1P = 1원', style: font(12, color: C.textMid))),
        CandleCard(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(children: [
            for (final p in products)
              Builder(builder: (context) {
                final enabled = balance != null && p.points <= balance;
                final isSelected = p.id == selected.id;
                final note = balance == null ? '조회 필요' : p.points > balance ? '${fmt(p.points - balance)}P 부족' : '';
                return InkWell(
                  onTap: enabled ? () => state.chooseProduct(p) : null,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Row(children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: isSelected && enabled ? C.primary : C.borderMid, width: isSelected && enabled ? 6 : 1.5),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text('${fmt(p.amount)}원',
                              style: font(15, weight: FontWeight.w700, color: enabled ? C.textDark : C.textLight)),
                          Text('${fmt(p.points)}P 차감', style: font(12, color: C.textMid)),
                        ]),
                      ),
                      if (note.isNotEmpty) Text(note, style: font(12, color: C.textLight)),
                    ]),
                  ),
                );
              }),
          ]),
        ),
      ],
    );
  }
}

class _ProductLine extends StatelessWidget {
  const _ProductLine(this.product);
  final Product product;
  @override
  Widget build(BuildContext context) => Row(children: [
        SvgPicture.asset('assets/images/npay-symbol.svg', width: 44, height: 44),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${fmt(product.amount)}원권', style: font(15, weight: FontWeight.w700)),
            Text('네이버페이', style: T.small),
          ]),
        ),
        Text('${fmt(product.points)}P', style: font(14, weight: FontWeight.w700)),
      ]);
}

class ExchangeScreen extends StatelessWidget {
  const ExchangeScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final balance = state.balance;
    final product = state.product;
    final affordable = balance != null && product.points <= balance;
    return PageBody(
      header: const PageHeader('교환 확인', fallback: '/shop'),
      bottom: PrimaryButton('수령 정보 입력', onPressed: affordable ? () => context.push('/payout') : null),
      children: [
        CandleCard(child: _ProductLine(product)),
        const SizedBox(height: 12),
        CandleCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Column(children: [
            SummaryRow('보유 포인트', balance == null ? '—' : '${fmt(balance)} P'),
            SummaryRow(
              '교환 가능 여부',
              balance == null ? '—' : product.points > balance ? '${fmt(product.points - balance)}P 부족' : '교환 가능',
              valueColor: affordable ? C.up : null,
            ),
          ]),
        ),
        const SizedBox(height: 12),
        Text('신청하면 포인트가 바로 차감되고, 관리자 확인 후 입력한 휴대폰 번호로 지급됩니다. 지급이 어려운 경우 포인트는 환급됩니다.',
            style: font(12, height: 18, color: C.textMid)),
      ],
    );
  }
}

class PayoutScreen extends StatefulWidget {
  const PayoutScreen({super.key});
  @override
  State<PayoutScreen> createState() => _PayoutScreenState();
}

class _PayoutScreenState extends State<PayoutScreen> {
  final _phone = TextEditingController();
  final _name = TextEditingController();
  bool _agree = false;
  bool _busy = false;
  bool _phoneTouched = false, _nameTouched = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _name.dispose();
    super.dispose();
  }

  bool get _valid => phoneError(_phone.text) == null && nameError(_name.text) == null && _agree;

  Future<void> _submit() async {
    if (_busy) return;
    setState(() {
      _phoneTouched = _nameTouched = true;
      _error = _agree ? null : '지급 안내 및 개인정보 처리에 동의해 주세요.';
    });
    if (!_valid) return;
    setState(() => _busy = true);
    final state = AppScope.read(context);
    try {
      await state.api.exchange(state.product.id, _name.text.trim(), normalizePhone(_phone.text));
      state.refreshBalance().catchError((_) => 0);
      if (mounted) context.go('/wallet?tab=use&requested=1');
    } on ApiException catch (e) {
      if (!mounted) return;
      if (e.status == 409) {
        setState(() => _error = '보유 포인트가 부족해 신청하지 못했어요.');
      } else if (e.status == 400) {
        setState(() => _error = '입력한 정보를 다시 확인해 주세요.');
      } else {
        report(context, e);
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = AppScope.of(context).product;
    return Scaffold(
      body: PageBody(
        header: const PageHeader('지급 신청', fallback: '/exchange'),
        bottom: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            SizedBox(
              width: 24,
              height: 24,
              child: Checkbox(key: const Key('payout-agree'), value: _agree, onChanged: (v) => setState(() => _agree = v ?? false)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _agree = !_agree),
                child: Text('지급 안내 및 개인정보 처리 동의 (필수)', style: font(13, height: 21)),
              ),
            ),
            IconButton(
              tooltip: '지급 안내 및 개인정보 동의 내용 보기',
              onPressed: () => showLegalSheet(context, 'reward'),
              icon: const CandleIcon(Ic.chevron, color: C.textLight, size: 20),
            ),
          ]),
          const SizedBox(height: 8),
          PrimaryButton('지급 신청하기', onPressed: _valid && !_busy ? _submit : null),
          const SizedBox(height: 8),
          Text('신청 결과는 포인트 내역의 사용 탭에서 확인할 수 있습니다.', textAlign: TextAlign.center, style: T.small),
          if (_error != null) ...[
            const SizedBox(height: 6),
            Text(_error!, textAlign: TextAlign.center, style: font(12, color: C.formError)),
          ],
        ]),
        children: [
          const Heading('수령 정보 입력', sub: '차곡차곡 모은 포인트를 리워드로 받아보세요.'),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFD9E6FB)),
              gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0xFFEDF4FF), Colors.white]),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const CandleIcon(Ic.gift, color: C.primary, size: 18),
                const SizedBox(width: 6),
                Text('포인트 교환', style: font(12, weight: FontWeight.w500, color: C.primary)),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                SvgPicture.asset('assets/images/npay-symbol.svg', width: 48, height: 48),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('네이버페이 ${fmt(product.amount)}원권', style: font(13, color: C.textMid)),
                    Text.rich(TextSpan(children: [
                      TextSpan(text: fmt(product.amount), style: font(28, weight: FontWeight.w800, height: 36)),
                      TextSpan(text: '원', style: font(18, weight: FontWeight.w700)),
                    ])),
                  ]),
                ),
              ]),
              const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider(color: C.border, height: 1)),
              Row(children: [
                Text('사용 포인트', style: font(13, color: C.textMid)),
                const Spacer(),
                Text('${fmt(product.points)}P', style: font(14, weight: FontWeight.w700)),
              ]),
            ]),
          ),
          const SizedBox(height: 12),
          CandleCard(
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              Row(children: [
                const CandleIcon(Ic.person, color: C.primary, size: 18),
                const SizedBox(width: 6),
                Text('받는 분 정보', style: font(14, weight: FontWeight.w700)),
                const Spacer(),
                Text('필수 입력', style: font(11, color: C.textMid)),
              ]),
              const SizedBox(height: 12),
              Text('휴대폰 번호', style: font(12, weight: FontWeight.w500, color: C.textMid)),
              const SizedBox(height: 6),
              TextField(
                key: const Key('phone'),
                controller: _phone,
                keyboardType: TextInputType.phone,
                maxLength: 13,
                decoration: InputDecoration(
                  hintText: '01012345678',
                  counterText: '',
                  errorText: _phoneTouched ? phoneError(_phone.text) : null,
                ),
                onChanged: (_) => setState(() => _phoneTouched = true),
              ),
              const SizedBox(height: 10),
              Text('이름', style: font(12, weight: FontWeight.w500, color: C.textMid)),
              const SizedBox(height: 6),
              TextField(
                key: const Key('name'),
                controller: _name,
                maxLength: 40,
                decoration: InputDecoration(
                  hintText: '받는 분의 이름',
                  counterText: '',
                  errorText: _nameTouched ? nameError(_name.text) : null,
                ),
                onChanged: (_) => setState(() => _nameTouched = true),
              ),
              const SizedBox(height: 12),
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const CandleIcon(Ic.inbox, color: C.textMid, size: 18),
                const SizedBox(width: 6),
                Expanded(child: Text('관리자 확인 후 입력한 휴대폰 번호로 네이버페이 포인트가 지급됩니다.', style: T.small)),
              ]),
            ]),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------- wallet

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key, this.tab = 'all', this.requested = false});
  final String tab;
  final bool requested;
  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  late String _tab = const ['all', 'earn', 'use'].contains(widget.tab) ? widget.tab : 'all';
  final _rows = <RewardRow>[];
  Map<int, int?> _exchanges = const {};
  int? _cursor;
  bool _busy = false, _more = false, _loaded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (widget.requested) announce(context, '교환 신청이 접수되었어요. 관리자 확인 후 지급됩니다.');
      final state = AppScope.read(context);
      _guard(context, () => state.refreshBalance());
      await _guard(context, () async {
        final ex = await state.api.myExchanges();
        if (mounted) setState(() => _exchanges = ex);
      });
      if (mounted) _next();
    });
  }

  Future<void> _next() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final rows = await AppScope.read(context).api.rewards(_cursor);
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

  @override
  Widget build(BuildContext context) {
    final visible = _rows.where((r) => _tab == 'earn' ? r.amount >= 0 : _tab == 'use' ? r.amount < 0 : true).toList();
    return PageBody(
      header: const PageHeader('포인트 내역', fallback: '/profile'),
      children: [
        const _PointsCard(icon: true),
        const SizedBox(height: 16),
        Row(children: [
          for (final (key, label) in const [('all', '전체'), ('earn', '적립'), ('use', '사용')])
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Material(
                color: key == _tab ? C.primary : C.surfaceSubtle,
                borderRadius: BorderRadius.circular(17),
                child: InkWell(
                  borderRadius: BorderRadius.circular(17),
                  onTap: () => setState(() => _tab = key),
                  child: SizedBox(
                    height: 34,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Center(
                        child: Text(label,
                            style: font(13, weight: FontWeight.w700, color: key == _tab ? Colors.white : C.textMid)),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ]),
        const SizedBox(height: 12),
        for (final r in visible)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: CandleCard(
              child: Row(children: [
                IconTile(r.amount >= 0 ? Ic.earned : Ic.spent,
                    color: r.amount >= 0 ? C.primary : C.down, background: r.amount >= 0 ? C.iconTile : C.downBg),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(r.title, style: font(14, weight: FontWeight.w500, height: 20)),
                    Text(r.createdAt.length >= 10 ? r.createdAt.substring(0, 10).replaceAll('-', '.') : r.createdAt, style: T.small),
                  ]),
                ),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  Text.rich(TextSpan(
                    style: font(15, weight: FontWeight.w700, color: r.amount >= 0 ? C.primary : C.down),
                    children: [
                      TextSpan(text: '${r.amount >= 0 ? '+' : ''}${fmt(r.amount)}'),
                      TextSpan(text: 'P', style: font(12, weight: FontWeight.w700, color: r.amount >= 0 ? C.primary : C.down)),
                    ],
                  )),
                  Text(walletLabel(r.code, r.amount, _exchanges), style: T.small),
                ]),
              ]),
            ),
          ),
        if (_loaded && !_busy && visible.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text('포인트 내역이 없습니다.', textAlign: TextAlign.center, style: font(13, color: C.textMid)),
          ),
        if (!_loaded) const Padding(padding: EdgeInsets.all(24), child: Center(child: CircularProgressIndicator())),
        if (_more) PrimaryButton('더 보기', secondary: true, onPressed: _busy ? null : _next),
      ],
    );
  }
}

// ---------------------------------------------------------------- profile / settings

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Streak? _streak;
  String? _nick;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final state = AppScope.read(context);
    await Future.wait([
      _guard(context, () => state.refreshBalance()),
      _guard(context, () async {
        final s = await state.api.streak();
        if (mounted) setState(() => _streak = s);
      }),
      _guard(context, () async {
        final user = await state.api.user();
        final nick = user['nick'];
        if (mounted) setState(() => _nick = nick is String && nick.isNotEmpty ? nick : 'Candle 회원');
      }),
    ]);
  }

  Widget _stat(String value, String label, {String? suffix}) => Expanded(
        child: Column(children: [
          Text.rich(TextSpan(children: [
            TextSpan(text: value, style: T.number),
            if (suffix != null) TextSpan(text: suffix, style: font(13, weight: FontWeight.w700)),
          ])),
          const SizedBox(height: 2),
          Text(label, style: T.label),
        ]),
      );

  @override
  Widget build(BuildContext context) {
    final s = _streak;
    return PageBody(
      header: PageHeader('내 정보',
          fallback: '/home',
          trailing: IconButton(
            tooltip: '계정 · 약관',
            onPressed: () => context.push('/settings'),
            icon: const CandleIcon(Ic.gear, color: C.textMid),
          )),
      onRefresh: _load,
      children: [
        CandleCard(
          child: Row(children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(color: C.iconTile, borderRadius: BorderRadius.circular(18)),
              alignment: Alignment.center,
              child: const CandleIcon(Ic.person, color: C.primary, size: 28),
            ),
            const SizedBox(width: 14),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('반가워요', style: T.label),
              Text(_nick ?? '—', style: font(17, weight: FontWeight.w700, height: 24)),
            ]),
          ]),
        ),
        const SizedBox(height: 12),
        _PointsCard(onHistory: () => context.push('/wallet?tab=all')),
        const SizedBox(height: 12),
        CandleCard(
          child: Column(children: [
            Row(children: [
              _stat(s == null ? '—' : fmt(s.current), '현재 연승'),
              _stat(s == null ? '—' : fmt(s.best), '최고 연승'),
              _stat(s?.hitRate == null ? '—' : '${s!.hitRate!.round()}', '적중률', suffix: '%'),
            ]),
            const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider(color: C.border, height: 1)),
            Row(children: [
              Text('조회된 예측', style: font(12, color: C.textMid)),
              const Spacer(),
              Text(s == null ? '—' : '${fmt(s.settledCount)}회 중 ${fmt(s.hitCount)}회 적중', style: font(13, weight: FontWeight.w700)),
            ]),
          ]),
        ),
        const SizedBox(height: 12),
        CandleCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Column(children: [
            MenuRow(icon: Ic.predict, title: '예측 내역', onTap: () => context.push('/prediction-history')),
            const Divider(color: C.border, height: 1),
            MenuRow(icon: Ic.wallet, title: '포인트 내역', onTap: () => context.push('/wallet')),
            const Divider(color: C.border, height: 1),
            MenuRow(icon: Ic.circleCheck, title: '10연승 리워드', onTap: () => context.push('/challenge-reward')),
            const Divider(color: C.border, height: 1),
            MenuRow(icon: Ic.gear, title: '계정 · 약관', onTap: () => context.push('/settings')),
          ]),
        ),
      ],
    );
  }
}

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context) => PageBody(
        header: const PageHeader('계정 · 약관', fallback: '/profile'),
        children: [
          CandleCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Column(children: [
              for (final key in const ['age', 'terms', 'privacy']) ...[
                MenuRow(icon: Ic.document, title: legalTitles[key]!, onTap: () => showLegalSheet(context, key)),
                const Divider(color: C.border, height: 1),
              ],
              MenuRow(
                icon: Ic.document,
                title: '개인정보 처리방침',
                onTap: () => launchUrl(Uri.parse(AppConfig.privacyUrl), mode: LaunchMode.externalApplication),
              ),
              const Divider(color: C.border, height: 1),
              MenuRow(
                icon: Ic.help,
                title: '튜토리얼 다시 보기',
                onTap: () {
                  AppScope.read(context).tutorialSeen = false;
                  showTutorial(context);
                },
              ),
            ]),
          ),
          const SizedBox(height: 16),
          PrimaryButton('로그아웃', key: const Key('logout'), secondary: true, onPressed: () async {
            await AppScope.read(context).logout();
            if (context.mounted) context.go('/signup');
          }),
        ],
      );
}
