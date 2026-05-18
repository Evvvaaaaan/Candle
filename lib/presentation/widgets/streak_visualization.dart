import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/format_utils.dart';
import '../../domain/entities/prediction.dart';

class StreakVisualization extends StatefulWidget {
  const StreakVisualization({
    super.key,
    required this.streak,
    required this.history,
  });

  final int streak;
  final List<DayHistory> history;

  @override
  State<StreakVisualization> createState() => _StreakVisualizationState();
}

class _StreakVisualizationState extends State<StreakVisualization>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<int> _streakAnim;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _streakAnim = IntTween(begin: 0, end: widget.streak).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOut),
    );
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        AnimatedBuilder(
          animation: _streakAnim,
          builder: (_, __) => Text(
            '${_streakAnim.value}일 연속',
            style: AppTextStyles.displayLarge.copyWith(
              color: AppColors.primary,
              fontSize: 40,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '예측 성공!',
          style: AppTextStyles.titleMedium.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 20),
        _HistoryDots(history: widget.history),
      ],
    );
  }
}

class _HistoryDots extends StatelessWidget {
  const _HistoryDots({required this.history});
  final List<DayHistory> history;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: history.map((day) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Column(
            children: [
              _DotIndicator(state: day.state),
              const SizedBox(height: 4),
              Text(
                FormatUtils.shortDate(day.date),
                style: AppTextStyles.labelSmall.copyWith(fontSize: 10),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _DotIndicator extends StatelessWidget {
  const _DotIndicator({required this.state});
  final DayState state;

  @override
  Widget build(BuildContext context) {
    final (color, icon) = switch (state) {
      DayState.success => (AppColors.up, Icons.check),
      DayState.fail => (AppColors.down, Icons.close),
      DayState.pending => (AppColors.primary, Icons.circle),
      DayState.future => (AppColors.border, Icons.circle_outlined),
    };

    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: state == DayState.future
            ? AppColors.backgroundSecondary
            : color.withValues(alpha: 0.15),
        shape: BoxShape.circle,
        border: Border.all(color: color, width: 1.5),
      ),
      child: Icon(icon, size: 14, color: color),
    );
  }
}
