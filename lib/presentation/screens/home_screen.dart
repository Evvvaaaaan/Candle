import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/format_utils.dart';
import '../../domain/entities/prediction.dart';
import '../widgets/bottom_nav.dart';
import '../widgets/candle_logo.dart';
import '../widgets/streak_visualization.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late Timer _timer;
  Duration _remaining = _calcRemaining();

  // 예측 가능 시간: 오후 6시 ~ 익일 오전 9시
  static Duration _calcRemaining() {
    final now = DateTime.now();
    final DateTime deadline;
    if (now.hour < 9) {
      deadline = DateTime(now.year, now.month, now.day, 9);
    } else {
      deadline = DateTime(now.year, now.month, now.day + 1, 9);
    }
    final diff = deadline.difference(now);
    return diff.isNegative ? Duration.zero : diff;
  }

  // Mock 데이터: 실제 연동 시 BLoC으로 교체
  final int _streak = 7;
  final List<DayHistory> _history = _buildMockHistory();

  static List<DayHistory> _buildMockHistory() {
    final today = DateTime.now();
    return List.generate(10, (i) {
      final date = today.subtract(Duration(days: 9 - i));
      final DayState state;
      if (i < 7) {
        state = i % 3 == 0 ? DayState.fail : DayState.success;
      } else if (i == 7) {
        state = DayState.pending;
      } else {
        state = DayState.future;
      }
      return DayHistory(date: date, state: state);
    });
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundSecondary,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Column(
              children: [
                _AppBar(),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        _StreakCard(
                          streak: _streak,
                          history: _history,
                        ),
                        const SizedBox(height: 16),
                        _PredictionStatusCard(remaining: _remaining),
                      ],
                    ),
                  ),
                ),
                const BottomNav(currentIndex: 0),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AppBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          const CandleLogoBrand(),
          const Spacer(),
          IconButton(
            icon: Stack(
              children: [
                const Icon(Icons.notifications_outlined, size: 24),
                Positioned(
                  right: 0,
                  top: 0,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.down,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ],
            ),
            onPressed: () {},
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}

class _StreakCard extends StatelessWidget {
  const _StreakCard({required this.streak, required this.history});
  final int streak;
  final List<DayHistory> history;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
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
      child: StreakVisualization(streak: streak, history: history),
    );
  }
}

class _PredictionStatusCard extends StatelessWidget {
  const _PredictionStatusCard({required this.remaining});
  final Duration remaining;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.3),
        ),
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
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.warning,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '오늘의 예측 미완료',
                style: AppTextStyles.titleMedium,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                Icons.timer_outlined,
                size: 16,
                color: AppColors.textSecondary,
              ),
              const SizedBox(width: 6),
              Text(
                '마감까지 ',
                style: AppTextStyles.bodySmall,
              ),
              Text(
                FormatUtils.countdown(remaining),
                style: AppTextStyles.mono.copyWith(
                  color: AppColors.primary,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () => context.push('/ad-watch'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: Text(
                '지금 예측하기',
                style: AppTextStyles.labelLarge.copyWith(color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
