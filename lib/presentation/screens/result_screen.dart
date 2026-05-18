import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/utils/format_utils.dart';
import '../../domain/entities/prediction.dart';
import '../bloc/prediction/prediction_bloc.dart';

enum _ResultStep { locked, revealing, done }

class ResultScreen extends StatefulWidget {
  const ResultScreen({super.key});

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen>
    with SingleTickerProviderStateMixin {
  _ResultStep _step = _ResultStep.locked;
  late AnimationController _flashController;
  late Animation<double> _flashOpacity;

  @override
  void initState() {
    super.initState();
    _flashController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _flashOpacity = Tween<double>(begin: 1, end: 0).animate(
      CurvedAnimation(parent: _flashController, curve: Curves.easeOut),
    );
  }

  @override
  void dispose() {
    _flashController.dispose();
    super.dispose();
  }

  void _onWatchAd() {
    setState(() => _step = _ResultStep.revealing);
    context
        .read<PredictionBloc>()
        .add(const PredictionResultRequested());
  }

  void _onResultLoaded() {
    _flashController.forward().then((_) {
      setState(() => _step = _ResultStep.done);
    });
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<PredictionBloc, PredictionState>(
      listener: (context, state) {
        if (state is PredictionResultLoaded && _step == _ResultStep.revealing) {
          _onResultLoaded();
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.backgroundSecondary,
        body: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 448),
              child: Stack(
                children: [
                  _buildContent(),
                  if (_step == _ResultStep.revealing)
                    FadeTransition(
                      opacity: _flashOpacity,
                      child: Container(
                        color: Colors.white,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    return switch (_step) {
      _ResultStep.locked => _LockedView(onWatchAd: _onWatchAd),
      _ResultStep.revealing => const _RevealingView(),
      _ResultStep.done => BlocBuilder<PredictionBloc, PredictionState>(
          builder: (context, state) {
            if (state is PredictionResultLoaded) {
              return _ResultView(prediction: state.prediction);
            }
            return const _RevealingView();
          },
        ),
    };
  }
}

class _LockedView extends StatelessWidget {
  const _LockedView({required this.onWatchAd});
  final VoidCallback onWatchAd;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          _ResultHeader(),
          const Spacer(flex: 2),
          const Icon(Icons.lock, size: 64, color: AppColors.textTertiary),
          const SizedBox(height: 24),
          Text('결과 확인', style: AppTextStyles.headlineLarge),
          const SizedBox(height: 12),
          Text(
            '광고를 시청하면\n오늘의 예측 결과를 확인할 수 있어요',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
          const Spacer(flex: 3),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: onWatchAd,
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
                    '광고 보고 결과 확인',
                    style: AppTextStyles.labelLarge.copyWith(
                      color: Colors.white,
                      fontSize: 16,
                    ),
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

class _RevealingView extends StatelessWidget {
  const _RevealingView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppColors.primary),
          SizedBox(height: 24),
          Text('결과 확인 중...'),
        ],
      ),
    );
  }
}

class _ResultView extends StatelessWidget {
  const _ResultView({required this.prediction});
  final Prediction prediction;

  bool get _isSuccess => prediction.status == PredictionStatus.correct;

  @override
  Widget build(BuildContext context) {
    final color = _isSuccess ? AppColors.up : AppColors.down;

    return Column(
      children: [
        _ResultHeader(),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _ResultIcon(isSuccess: _isSuccess),
                const SizedBox(height: 24),
                Text(
                  _isSuccess ? '예측 성공!' : '예측 실패',
                  style: AppTextStyles.headlineLarge.copyWith(color: color),
                ),
                const SizedBox(height: 20),
                _PredictionCompareCard(prediction: prediction),
                const SizedBox(height: 16),
                if (_isSuccess) _StreakCard(streak: prediction.streak ?? 0),
                if (!_isSuccess) _FailCard(),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => context.go('/home'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          side: const BorderSide(color: AppColors.border),
                        ),
                        child: Text('홈으로', style: AppTextStyles.labelLarge),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => context.go('/ranking'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          '랭킹 보기',
                          style: AppTextStyles.labelLarge.copyWith(
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ResultHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios, size: 20),
            onPressed: () => context.go('/home'),
            padding: EdgeInsets.zero,
          ),
          const SizedBox(width: 4),
          Text('예측 결과', style: AppTextStyles.titleLarge),
        ],
      ),
    );
  }
}

class _ResultIcon extends StatefulWidget {
  const _ResultIcon({required this.isSuccess});
  final bool isSuccess;

  @override
  State<_ResultIcon> createState() => _ResultIconState();
}

class _ResultIconState extends State<_ResultIcon>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scale = Tween<double>(begin: 0.5, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
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
    final color = widget.isSuccess ? AppColors.up : AppColors.down;
    final icon = widget.isSuccess ? Icons.check_circle : Icons.cancel;

    return ScaleTransition(
      scale: _scale,
      child: Container(
        width: 88,
        height: 88,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 52, color: color),
      ),
    );
  }
}

class _PredictionCompareCard extends StatelessWidget {
  const _PredictionCompareCard({required this.prediction});
  final Prediction prediction;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(
            prediction.stockName,
            style: AppTextStyles.titleMedium,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _CompareItem(
                  label: '내 예측',
                  value: prediction.direction == PredictionDirection.up
                      ? '상승'
                      : '하락',
                  color: prediction.direction == PredictionDirection.up
                      ? AppColors.up
                      : AppColors.down,
                ),
              ),
              Container(width: 1, height: 40, color: AppColors.border),
              Expanded(
                child: _CompareItem(
                  label: '실제 결과',
                  value: prediction.resultPrice != null
                      ? FormatUtils.price(prediction.resultPrice!)
                      : '-',
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CompareItem extends StatelessWidget {
  const _CompareItem({
    required this.label,
    required this.value,
    required this.color,
  });
  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: AppTextStyles.labelSmall),
        const SizedBox(height: 4),
        Text(
          value,
          style: AppTextStyles.titleMedium.copyWith(color: color),
        ),
      ],
    );
  }
}

class _StreakCard extends StatelessWidget {
  const _StreakCard({required this.streak});
  final int streak;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.upLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.up.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.local_fire_department, color: AppColors.up, size: 24),
          const SizedBox(width: 8),
          Text(
            '$streak일 연속 성공!',
            style: AppTextStyles.titleMedium.copyWith(color: AppColors.up),
          ),
        ],
      ),
    );
  }
}

class _FailCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.downLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.down.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          const Icon(Icons.refresh, color: AppColors.down, size: 24),
          const SizedBox(height: 8),
          Text(
            '스트릭이 리셋되었어요',
            style: AppTextStyles.titleMedium.copyWith(color: AppColors.down),
          ),
          const SizedBox(height: 4),
          Text(
            '내일 다시 도전해보세요!',
            style: AppTextStyles.bodySmall,
          ),
        ],
      ),
    );
  }
}
