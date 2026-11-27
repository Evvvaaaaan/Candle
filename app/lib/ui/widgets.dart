import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../api/client.dart';
import '../theme.dart';
import 'icons.dart';

final _number = NumberFormat.decimalPattern('ko_KR');
String fmt(num value) => _number.format(value);
String rateText(num rate) => '${rate > 0 ? '+' : ''}$rate%';

/// Message for a failed request, or null when it should stay silent
/// (common.js `report`).
String? reportMessage(Object error) {
  final status = error is ApiException ? error.status : null;
  if (status == -1) return null;
  if (status == 409) return '중복되거나 현재 상태에서 처리할 수 없는 요청입니다.';
  if (const [401, 403, 406].contains(status)) return '로그인이 필요합니다. 다시 로그인해 주세요.';
  return '서버 요청을 완료하지 못했습니다. 다시 시도해 주세요.';
}

/// Bottom alert box (common.js `announce`).
void announce(BuildContext context, String message) {
  final messenger = ScaffoldMessenger.maybeOf(context);
  if (messenger == null) return;
  messenger
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      behavior: SnackBarBehavior.floating,
      elevation: 0,
      backgroundColor: Colors.transparent,
      padding: EdgeInsets.zero,
      margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
      duration: const Duration(seconds: 5),
      content: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: C.errorBg,
          border: Border.all(color: C.errorBorder),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(message, style: font(12, height: 19.2, color: C.errorText)),
      ),
    ));
}

void report(BuildContext context, Object error) {
  final message = reportMessage(error);
  if (message != null && context.mounted) announce(context, message);
}

class CandleCard extends StatelessWidget {
  const CandleCard({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.onTap, this.color});
  final Widget child;
  final EdgeInsets padding;
  final VoidCallback? onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(16);
    return Material(
      color: color ?? C.surface,
      shape: RoundedRectangleBorder(borderRadius: radius, side: const BorderSide(color: C.border)),
      clipBehavior: Clip.antiAlias,
      child: InkWell(onTap: onTap, child: Padding(padding: padding, child: child)),
    );
  }
}

class PrimaryButton extends StatelessWidget {
  const PrimaryButton(this.label, {super.key, required this.onPressed, this.secondary = false, this.height = 52});
  final String label;
  final VoidCallback? onPressed;
  final bool secondary;
  final double height;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return SizedBox(
      width: double.infinity,
      height: height,
      child: TextButton(
        onPressed: onPressed,
        style: TextButton.styleFrom(
          backgroundColor: !enabled ? C.surfaceSubtle : (secondary ? C.primaryLight : C.primary),
          foregroundColor: !enabled ? C.textLight : (secondary ? C.primary : Colors.white),
          disabledBackgroundColor: C.surfaceSubtle,
          disabledForegroundColor: C.textLight,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: T.button,
        ),
        child: Text(label),
      ),
    );
  }
}

class IconTile extends StatelessWidget {
  const IconTile(this.icon, {super.key, this.color = C.primary, this.background = C.iconTile, this.size = 40});
  final String icon;
  final Color color;
  final Color background;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(12)),
        alignment: Alignment.center,
        child: CandleIcon(icon, color: color, size: 22),
      );
}

/// Back button + title (`.transaction-header`). Pops when possible,
/// otherwise goes to [fallback].
class PageHeader extends StatelessWidget {
  const PageHeader(this.title, {super.key, required this.fallback, this.trailing});
  final String title;
  final String fallback;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 52,
        child: Padding(
          padding: const EdgeInsets.only(left: 10, right: 18),
          child: Row(children: [
            IconButton(
              tooltip: '이전 화면',
              onPressed: () => context.canPop() ? context.pop() : context.go(fallback),
              icon: SvgPicture.asset('assets/images/chevron-left.svg', width: 24, height: 24),
            ),
            Expanded(child: Text(title, style: T.headerTitle)),
            ?trailing,
          ]),
        ),
      );
}

/// Brand + account icon (`.app-header`).
class AppHeader extends StatelessWidget {
  const AppHeader({super.key});

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 52,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18),
          child: Row(children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.asset('assets/images/candle-logo.png', width: 27, height: 27),
            ),
            const SizedBox(width: 8),
            Text('Candle', style: font(18, weight: FontWeight.w700, color: C.brand)),
            const Spacer(),
            Transform.translate(
              offset: const Offset(8, 0),
              child: IconButton(
                tooltip: '내 정보',
                onPressed: () => context.push('/profile'),
                icon: const CandleIcon(Ic.person, color: C.textMid),
              ),
            ),
          ]),
        ),
      );
}

/// Scrollable page body with the web app's 18px side inset.
class PageBody extends StatelessWidget {
  const PageBody({super.key, required this.children, this.header, this.bottom, this.onRefresh});
  final List<Widget> children;
  final Widget? header;
  final Widget? bottom;
  final Future<void> Function()? onRefresh;

  @override
  Widget build(BuildContext context) {
    Widget list = ListView(
      padding: const EdgeInsets.fromLTRB(18, 8, 18, 24),
      physics: const AlwaysScrollableScrollPhysics(),
      children: children,
    );
    if (onRefresh != null) list = RefreshIndicator(onRefresh: onRefresh!, child: list);
    return SafeArea(
      bottom: false,
      child: Column(children: [
        ?header,
        Expanded(child: list),
        if (bottom != null)
          SafeArea(top: false, child: Padding(padding: const EdgeInsets.fromLTRB(18, 8, 18, 12), child: bottom)),
      ]),
    );
  }
}

class Heading extends StatelessWidget {
  const Heading(this.title, {super.key, this.sub});
  final String title;
  final String? sub;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 4, bottom: 16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: T.heading),
          if (sub != null) ...[const SizedBox(height: 4), Text(sub!, style: T.sub)],
        ]),
      );
}

/// One row of a menu card: icon tile, title/subtitle, chevron.
class MenuRow extends StatelessWidget {
  const MenuRow({super.key, required this.icon, required this.title, this.sub, required this.onTap, this.iconColor = C.primary, this.iconBg = C.iconTile});
  final String icon;
  final String title;
  final String? sub;
  final VoidCallback onTap;
  final Color iconColor, iconBg;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 64),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(children: [
              IconTile(icon, color: iconColor, background: iconBg),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title, style: font(14, weight: FontWeight.w500, height: 20)),
                  if (sub != null) Text(sub!, style: T.small),
                ]),
              ),
              const CandleIcon(Ic.chevron, color: C.textLight, size: 20),
            ]),
          ),
        ),
      );
}

/// Bottom sheet shell (`.reward-ad-dialog`): top radius 24, drag handle.
Future<R?> showCandleSheet<R>(BuildContext context, WidgetBuilder builder) => showModalBottomSheet<R>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: C.surface,
      barrierColor: const Color(0x730F172A),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 18),
                decoration: BoxDecoration(color: C.border, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            Flexible(child: builder(context)),
          ]),
        ),
      ),
    );

class SummaryRow extends StatelessWidget {
  const SummaryRow(this.label, this.value, {super.key, this.valueColor});
  final String label;
  final String value;
  final Color? valueColor;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(children: [
          Text(label, style: font(13, color: C.textMid)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(value,
                textAlign: TextAlign.right,
                style: font(14, weight: FontWeight.w700, color: valueColor ?? C.textDark)),
          ),
        ]),
      );
}

/// Bottom tab bar (`.bottom-nav`). [active] is null on screens that show the
/// bar without a selected tab.
class BottomNav extends StatelessWidget {
  const BottomNav({super.key, required this.active});
  final String? active;

  static const _tabs = [
    ('home', '홈', Ic.home, '/home'),
    ('predict', '예측', Ic.predict, '/stock-select'),
    ('missions', '미션', Ic.calendarCheck, '/missions'),
    ('shop', '상점', Ic.bag, '/shop'),
  ];

  @override
  Widget build(BuildContext context) => Container(
        decoration: const BoxDecoration(color: C.surface, border: Border(top: BorderSide(color: C.border))),
        // 12px below the tabs only when there is no home indicator inset.
        child: SafeArea(
          top: false,
          minimum: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
            child: Row(children: [
              for (final (key, label, icon, path) in _tabs)
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: Material(
                      color: key == active ? C.primaryLight : C.surface,
                      borderRadius: BorderRadius.circular(12),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(12),
                        onTap: () => context.go(path),
                        child: Semantics(
                          selected: key == active,
                          button: true,
                          child: SizedBox(
                            height: 56,
                            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                              CandleIcon(icon, color: key == active ? C.primary : C.textLight),
                              const SizedBox(height: 4),
                              Text(label,
                                  style: font(11,
                                      height: 16,
                                      weight: key == active ? FontWeight.w500 : FontWeight.w400,
                                      color: key == active ? C.primary : C.textLight)),
                            ]),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ]),
          ),
        ),
      );
}

/// Up/down choice card (`.direction-card`). Up is green, down is red.
class DirectionCard extends StatelessWidget {
  const DirectionCard({super.key, required this.up, this.selected = false, this.onTap, this.height = 80});
  final bool up;
  final bool selected;
  final VoidCallback? onTap;
  final double height;

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(16);
    final tint = up ? C.upBg : C.downBg;
    return Opacity(
      opacity: onTap == null && !selected ? 0.55 : 1,
      child: Material(
        color: selected ? tint : C.surface,
        shape: RoundedRectangleBorder(
          borderRadius: radius,
          side: selected
              ? BorderSide(color: up ? C.upBorder : C.downBorder, width: 2)
              : const BorderSide(color: C.border),
        ),
        child: InkWell(
          key: Key(up ? 'direction-up' : 'direction-down'),
          borderRadius: radius,
          onTap: onTap,
          child: SizedBox(
            height: height,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: selected ? (up ? const Color(0xFFD0EEE0) : const Color(0xFFFEE2E2)) : tint,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: SvgPicture.asset('assets/images/${up ? 'arrow-up' : 'arrow-down'}.svg', width: 18, height: 18),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(up ? '상승' : '하락', style: font(14, weight: FontWeight.w500, height: 20)),
                    Text(up ? '오를 것 같아요' : '내릴 것 같아요', style: font(12, height: 18, color: C.textMid)),
                  ]),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

/// Dots under a horizontal pager (`.tutorial-dot`): the active dot widens.
class PagerDots extends StatelessWidget {
  const PagerDots({super.key, required this.count, required this.index, this.onTap});
  final int count;
  final int index;
  final ValueChanged<int>? onTap;
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
        for (var i = 0; i < count; i++)
          GestureDetector(
            onTap: onTap == null ? null : () => onTap!(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: i == index ? 20 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: i == index ? C.primary : C.borderMid,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
          ),
      ]);
}
