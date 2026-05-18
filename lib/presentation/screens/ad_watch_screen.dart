import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../bloc/prediction/prediction_bloc.dart';

enum _AdStep { before, watching, success }

class AdWatchScreen extends StatefulWidget {
  const AdWatchScreen({super.key});

  @override
  State<AdWatchScreen> createState() => _AdWatchScreenState();
}

class _AdWatchScreenState extends State<AdWatchScreen>
    with TickerProviderStateMixin {
  _AdStep _step = _AdStep.before;
  int _countdown = 15;
  Timer? _timer;

  late AnimationController _unlockController;
  late Animation<double> _unlockScale;

  @override
  void initState() {
    super.initState();
    _unlockController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _unlockScale = Tween<double>(begin: 0.6, end: 1).animate(
      CurvedAnimation(parent: _unlockController, curve: Curves.elasticOut),
    );
  }

  @override
  void dispose() {
    _timer?.cancel();
    _unlockController.dispose();
    super.dispose();
  }

  void _startWatching() {
    setState(() {
      _step = _AdStep.watching;
      _countdown = 15;
    });
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_countdown <= 1) {
        t.cancel();
        _onAdComplete();
      } else {
        setState(() => _countdown--);
      }
    });
  }

  void _onAdComplete() {
    context.read<PredictionBloc>().add(const PredictionAdWatchConfirmed());
    setState(() => _step = _AdStep.success);
    _unlockController.forward();
    Future.delayed(const Duration(milliseconds: 1100), () {
      if (mounted) context.go('/stock-search');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Stack(
              children: [
                if (_step == _AdStep.watching) _AdOverlay(countdown: _countdown),
                _buildContent(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    return switch (_step) {
      _AdStep.before => _BeforeAdView(onStart: _startWatching),
      _AdStep.watching => _WatchingAdView(countdown: _countdown),
      _AdStep.success => _SuccessView(
          unlockScale: _unlockScale,
          controller: _unlockController,
        ),
    };
  }
}

class _BeforeAdView extends StatelessWidget {
  const _BeforeAdView({required this.onStart});
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 16),
          Align(
            alignment: Alignment.centerLeft,
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios),
              onPressed: () => context.pop(),
              padding: EdgeInsets.zero,
            ),
          ),
          const Spacer(flex: 2),
          Container(
            width: 80,
            height: 80,
            decoration: const BoxDecoration(
              color: AppColors.primaryLight,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.lock_outline,
              size: 40,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 28),
          Text('광고 시청 후 예측 가능', style: AppTextStyles.headlineLarge),
          const SizedBox(height: 12),
          Text(
            '15초 광고를 시청하면\n오늘의 주가 예측에 참여할 수 있어요',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.backgroundTertiary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              '오늘 예측 0 / 1',
              style: AppTextStyles.labelSmall,
            ),
          ),
          const Spacer(flex: 3),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: onStart,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.play_arrow, color: Colors.white),
                  const SizedBox(width: 8),
                  Text(
                    '광고 보고 예측하기',
                    style: AppTextStyles.labelLarge.copyWith(color: Colors.white, fontSize: 16),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _WatchingAdView extends StatelessWidget {
  const _WatchingAdView({required this.countdown});
  final int countdown;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _CircularCountdown(
            value: countdown / 15,
            countdown: countdown,
          ),
          const SizedBox(height: 32),
          Text('광고 시청 중...', style: AppTextStyles.headlineMedium),
          const SizedBox(height: 8),
          Text(
            '${countdown}초 후 예측권이 지급됩니다',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _AdOverlay extends StatelessWidget {
  const _AdOverlay({required this.countdown});
  final int countdown;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 16,
      right: 16,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.black.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          '${countdown}초',
          style: const TextStyle(color: Colors.white, fontSize: 13),
        ),
      ),
    );
  }
}

class _CircularCountdown extends StatelessWidget {
  const _CircularCountdown({required this.value, required this.countdown});
  final double value;
  final int countdown;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 120,
      height: 120,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size(120, 120),
            painter: _CircularProgressPainter(progress: value),
          ),
          Text(
            '$countdown',
            style: AppTextStyles.displayMedium.copyWith(
              color: AppColors.primary,
              fontSize: 36,
            ),
          ),
        ],
      ),
    );
  }
}

class _CircularProgressPainter extends CustomPainter {
  _CircularProgressPainter({required this.progress});
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 8;

    final bgPaint = Paint()
      ..color = AppColors.border
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8;

    canvas.drawCircle(center, radius, bgPaint);

    final fgPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      fgPaint,
    );
  }

  @override
  bool shouldRepaint(_CircularProgressPainter old) => old.progress != progress;
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({
    required this.unlockScale,
    required this.controller,
  });
  final Animation<double> unlockScale;
  final AnimationController controller;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ScaleTransition(
            scale: unlockScale,
            child: Container(
              width: 80,
              height: 80,
              decoration: const BoxDecoration(
                color: AppColors.up,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.lock_open,
                size: 40,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 24),
          FadeTransition(
            opacity: controller,
            child: Text('예측권 획득!', style: AppTextStyles.headlineLarge),
          ),
          const SizedBox(height: 8),
          FadeTransition(
            opacity: controller,
            child: Text(
              '종목을 선택하러 이동합니다',
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
