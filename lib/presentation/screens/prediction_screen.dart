import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/format_utils.dart';
import '../../domain/entities/prediction.dart';
import '../../domain/entities/stock.dart';
import '../bloc/prediction/prediction_bloc.dart';

class PredictionScreen extends StatefulWidget {
  const PredictionScreen({super.key, required this.stock});
  final Stock stock;

  @override
  State<PredictionScreen> createState() => _PredictionScreenState();
}

class _PredictionScreenState extends State<PredictionScreen> {
  late Timer _timer;
  Duration _remaining = _calcRemaining();
  PredictionDirection? _selected;
  bool _submitted = false;

  static Duration _calcRemaining() {
    final now = DateTime.now();
    final deadline = DateTime(now.year, now.month, now.day + 1, 9);
    final diff = deadline.difference(now);
    return diff.isNegative ? Duration.zero : diff;
  }

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      setState(() => _remaining = _calcRemaining());
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  void _onSelect(PredictionDirection direction) {
    if (_submitted) return;
    setState(() {
      _selected = direction;
      _submitted = true;
    });

    context.read<PredictionBloc>().add(
          PredictionSubmitted(
            ticker: widget.stock.ticker,
            stockName: widget.stock.name,
            direction: direction,
          ),
        );

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) context.go('/home');
    });
  }

  @override
  Widget build(BuildContext context) {
    final stock = widget.stock;
    final changeColor = stock.isUp ? AppColors.up : AppColors.down;

    return Scaffold(
      backgroundColor: AppColors.backgroundSecondary,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Column(
              children: [
                _Header(remaining: _remaining),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        // 종목 정보 카드
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 12,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(stock.name, style: AppTextStyles.headlineMedium),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppColors.backgroundTertiary,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      stock.ticker,
                                      style: AppTextStyles.labelSmall,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Text(
                                FormatUtils.price(stock.currentPrice),
                                style: AppTextStyles.mono.copyWith(fontSize: 28),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(
                                    stock.isUp
                                        ? Icons.trending_up
                                        : Icons.trending_down,
                                    color: changeColor,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    FormatUtils.changeRate(stock.changeRate),
                                    style: AppTextStyles.labelLarge.copyWith(
                                      color: changeColor,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          '오늘 종가는?',
                          style: AppTextStyles.headlineMedium,
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: _PredictionButton(
                                direction: PredictionDirection.up,
                                label: '상승',
                                icon: Icons.trending_up,
                                color: AppColors.up,
                                selected: _selected,
                                disabled: _submitted,
                                onTap: () => _onSelect(PredictionDirection.up),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _PredictionButton(
                                direction: PredictionDirection.down,
                                label: '하락',
                                icon: Icons.trending_down,
                                color: AppColors.down,
                                selected: _selected,
                                disabled: _submitted,
                                onTap: () => _onSelect(PredictionDirection.down),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.remaining});
  final Duration remaining;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios, size: 20),
            onPressed: () => context.pop(),
            padding: EdgeInsets.zero,
          ),
          const SizedBox(width: 4),
          Text('오늘의 예측', style: AppTextStyles.titleLarge),
          const Spacer(),
          Row(
            children: [
              const Icon(
                Icons.timer_outlined,
                size: 14,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 4),
              Text(
                FormatUtils.countdown(remaining),
                style: AppTextStyles.mono.copyWith(
                  fontSize: 13,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PredictionButton extends StatelessWidget {
  const _PredictionButton({
    required this.direction,
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.disabled,
    required this.onTap,
  });

  final PredictionDirection direction;
  final String label;
  final IconData icon;
  final Color color;
  final PredictionDirection? selected;
  final bool disabled;
  final VoidCallback onTap;

  bool get _isSelected => selected == direction;
  bool get _isOther => selected != null && selected != direction;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 140,
        decoration: BoxDecoration(
          color: _isSelected
              ? color.withValues(alpha: 0.12)
              : _isOther
                  ? AppColors.backgroundSecondary
                  : color.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _isSelected ? color : AppColors.border,
            width: _isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _isSelected ? Icons.check_circle : icon,
              color: _isOther ? AppColors.textTertiary : color,
              size: 36,
            ),
            const SizedBox(height: 10),
            Text(
              label,
              style: AppTextStyles.titleLarge.copyWith(
                color: _isOther ? AppColors.textTertiary : color,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
