import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../bloc/auth/auth_bloc.dart';
import '../widgets/candle_logo.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          context.go('/home');
        } else if (state is AuthNicknameRequired) {
          context.go('/nickname');
        } else if (state is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Stack(
              children: [
                const _BackgroundDecoration(),
                _LoginContent(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BackgroundDecoration extends StatelessWidget {
  const _BackgroundDecoration();

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: CustomPaint(painter: _GradientCurvePainter()),
    );
  }
}

class _GradientCurvePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          AppColors.primary.withValues(alpha: 0.05),
          AppColors.primaryLight.withValues(alpha: 0.3),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path()
      ..moveTo(0, size.height * 0.35)
      ..quadraticBezierTo(
        size.width * 0.5,
        size.height * 0.15,
        size.width,
        size.height * 0.25,
      )
      ..lineTo(size.width, 0)
      ..lineTo(0, 0)
      ..close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_GradientCurvePainter old) => false;
}

class _LoginContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          const Spacer(flex: 2),
          _AnimatedHeader(),
          const Spacer(flex: 3),
          _KakaoLoginButton(),
          const SizedBox(height: 16),
          _TermsNotice(),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _AnimatedHeader extends StatefulWidget {
  @override
  State<_AnimatedHeader> createState() => _AnimatedHeaderState();
}

class _AnimatedHeaderState extends State<_AnimatedHeader>
    with TickerProviderStateMixin {
  late final List<AnimationController> _controllers;
  late final List<Animation<double>> _anims;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      3,
      (i) => AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 600),
      ),
    );
    _anims = _controllers
        .map(
          (c) => Tween<double>(begin: 0, end: 1).animate(
            CurvedAnimation(parent: c, curve: Curves.easeOut),
          ),
        )
        .toList();

    for (var i = 0; i < _controllers.length; i++) {
      Future.delayed(Duration(milliseconds: i * 150), _controllers[i].forward);
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        FadeTransition(
          opacity: _anims[0],
          child: const CandleLogo(size: 64),
        ),
        const SizedBox(height: 16),
        FadeTransition(
          opacity: _anims[1],
          child: Text(
            'Candle',
            style: AppTextStyles.displayMedium.copyWith(
              letterSpacing: -1,
            ),
          ),
        ),
        const SizedBox(height: 8),
        FadeTransition(
          opacity: _anims[2],
          child: Text(
            '내 예측이 곧 수익이 되는 공간',
            style: AppTextStyles.bodyMedium.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ),
      ],
    );
  }
}

class _KakaoLoginButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          final isLoading = state is AuthLoading;
          return SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: isLoading ? null : () => _onKakaoLogin(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.kakao,
                foregroundColor: AppColors.kakaoText,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 0,
              ),
              child: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.chat_bubble, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          '카카오로 시작하기',
                          style: AppTextStyles.labelLarge.copyWith(
                            color: AppColors.kakaoText,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
            ),
          );
        },
      ),
    );
  }

  void _onKakaoLogin(BuildContext context) {
    // TODO: Kakao SDK로 accessToken 획득 후 전달
    // KakaoSDK.instance.login().then((token) =>
    //   context.read<AuthBloc>().add(AuthLoginRequested(token.accessToken)));
    //
    // 개발 중 테스트용 mock:
    context.read<AuthBloc>().add(
          const AuthLoginRequested('mock-kakao-access-token'),
        );
  }
}

class _TermsNotice extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Text(
            '서비스 이용을 위해 본인인증이 필요합니다',
            style: AppTextStyles.labelSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  minimumSize: Size.zero,
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                ),
                child: Text(
                  '이용약관',
                  style: AppTextStyles.labelSmall.copyWith(
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
              Text(' · ', style: AppTextStyles.labelSmall),
              TextButton(
                onPressed: () {},
                style: TextButton.styleFrom(
                  minimumSize: Size.zero,
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                ),
                child: Text(
                  '개인정보처리방침',
                  style: AppTextStyles.labelSmall.copyWith(
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
