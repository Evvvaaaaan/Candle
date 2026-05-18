import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

enum _Step { celebration, form, success }

class RewardClaimScreen extends StatefulWidget {
  const RewardClaimScreen({super.key});

  @override
  State<RewardClaimScreen> createState() => _RewardClaimScreenState();
}

class _RewardClaimScreenState extends State<RewardClaimScreen>
    with TickerProviderStateMixin {
  _Step _step = _Step.celebration;
  bool _agreed = false;
  final _phoneController = TextEditingController();
  final _nameController = TextEditingController();
  late final AnimationController _fadeController;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..forward();

    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() => _step = _Step.form);
      }
    });
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _phoneController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _agreed && _phoneController.text.isNotEmpty && _nameController.text.isNotEmpty;

  void _handleSubmit() {
    if (!_canSubmit) return;
    setState(() => _step = _Step.success);
  }

  String _getExpectedDate() {
    final date = DateTime.now().add(const Duration(days: 3));
    return '${date.month}월 ${date.day}일';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 400),
              child: switch (_step) {
                _Step.celebration => _CelebrationView(key: const ValueKey('celebration')),
                _Step.form => _FormView(
                    key: const ValueKey('form'),
                    phoneController: _phoneController,
                    nameController: _nameController,
                    agreed: _agreed,
                    canSubmit: _canSubmit,
                    onAgreeTap: () => setState(() => _agreed = !_agreed),
                    onSubmit: _handleSubmit,
                    onChanged: () => setState(() {}),
                  ),
                _Step.success => _SuccessView(
                    key: const ValueKey('success'),
                    expectedDate: _getExpectedDate(),
                  ),
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _CelebrationView extends StatelessWidget {
  const _CelebrationView({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: double.infinity,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.success.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.emoji_events, size: 60, color: AppColors.success),
          ),
          const SizedBox(height: 24),
          ShaderMask(
            shaderCallback: (bounds) => const LinearGradient(
              colors: [AppColors.up, AppColors.success],
            ).createShader(bounds),
            child: const Text(
              '10연승 달성!',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            '축하합니다!\n40만원 리워드 신청 자격이 생겼어요',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 16,
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w500,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }
}

class _FormView extends StatelessWidget {
  const _FormView({
    super.key,
    required this.phoneController,
    required this.nameController,
    required this.agreed,
    required this.canSubmit,
    required this.onAgreeTap,
    required this.onSubmit,
    required this.onChanged,
  });

  final TextEditingController phoneController;
  final TextEditingController nameController;
  final bool agreed;
  final bool canSubmit;
  final VoidCallback onAgreeTap;
  final VoidCallback onSubmit;
  final VoidCallback onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header
        Container(
          color: AppColors.background,
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios, size: 20),
                onPressed: () => context.pop(),
              ),
              Text('리워드 신청', style: AppTextStyles.headlineMedium),
            ],
          ),
        ),
        const Divider(height: 1, color: AppColors.border),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 120),
            child: Column(
              children: [
                // 금액 헤더
                Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.up, AppColors.success],
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.up.withValues(alpha: 0.25),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: const Text(
                        '400,000원',
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          fontFamily: 'Courier',
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text('네이버페이로 전액 지급', style: AppTextStyles.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      '신청 후 1-3 영업일 내 지급됩니다',
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // 안내
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.upLight,
                    border: Border.all(color: AppColors.up),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.info_outline, color: AppColors.up, size: 18),
                      const SizedBox(width: 12),
                      Expanded(
                        child: RichText(
                          text: TextSpan(
                            style: AppTextStyles.bodySmall.copyWith(color: AppColors.textPrimary),
                            children: const [
                              TextSpan(
                                text: '네이버페이 간편송금',
                                style: TextStyle(fontWeight: FontWeight.w700),
                              ),
                              TextSpan(
                                text: '으로 지급됩니다. 네이버페이 앱에서 수신 확인 후 본인 계좌로 출금 가능합니다.',
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                // 입력 폼
                _InputField(
                  label: '휴대폰 번호 (네이버페이 연결 번호)',
                  hint: '01012345678 (- 없이 입력)',
                  controller: phoneController,
                  icon: Icons.smartphone,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  maxLength: 11,
                  helperText: '네이버페이에 등록된 휴대폰 번호를 입력해주세요.',
                  onChanged: onChanged,
                ),
                const SizedBox(height: 16),
                _InputField(
                  label: '이름 (실명 확인용)',
                  hint: '홍길동',
                  controller: nameController,
                  icon: Icons.person_outline,
                  helperText: '본인 확인을 위해 실명을 입력해주세요.',
                  onChanged: onChanged,
                ),
                const SizedBox(height: 20),
                // 네이버페이 안내
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    border: Border.all(color: AppColors.primary),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.payments_outlined, color: AppColors.primary, size: 20),
                          const SizedBox(width: 8),
                          Text('네이버페이 지급 안내', style: AppTextStyles.titleMedium),
                        ],
                      ),
                      const SizedBox(height: 12),
                      _BulletItem('세금 없이 전액 40만원이 지급됩니다.'),
                      _BulletItem('신청 후 1-3 영업일 내 네이버페이로 입금됩니다.'),
                      _BulletItem('네이버페이 앱에서 수신 확인 후 본인 계좌로 출금 가능합니다.'),
                      const Divider(height: 20, color: AppColors.border),
                      Text(
                        '* 네이버페이 간편송금은 소득세법상 과세 대상이 아니므로 세금이 부과되지 않습니다.',
                        style: AppTextStyles.labelSmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        // 하단 고정 버튼
        Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          decoration: const BoxDecoration(
            color: AppColors.background,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Column(
            children: [
              GestureDetector(
                onTap: onAgreeTap,
                child: Row(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: agreed ? AppColors.primary : AppColors.background,
                        border: Border.all(
                          color: agreed ? AppColors.primary : AppColors.textTertiary,
                        ),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: agreed
                          ? const Icon(Icons.check, size: 14, color: Colors.white)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '개인정보 수집 및 이용, 네이버페이 지급 안내에 동의합니다.',
                        style: AppTextStyles.bodyMedium,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: canSubmit ? onSubmit : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    disabledBackgroundColor: AppColors.border,
                    foregroundColor: Colors.white,
                    disabledForegroundColor: AppColors.textTertiary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    '40만원 리워드 신청하기',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '* 부정한 방법으로 참여가 적발될 경우 지급이 취소되며 계정이 정지됩니다.',
                style: AppTextStyles.labelSmall.copyWith(color: AppColors.error),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InputField extends StatelessWidget {
  const _InputField({
    required this.label,
    required this.hint,
    required this.controller,
    required this.icon,
    required this.helperText,
    required this.onChanged,
    this.keyboardType,
    this.inputFormatters,
    this.maxLength,
  });

  final String label;
  final String hint;
  final TextEditingController controller;
  final IconData icon;
  final String helperText;
  final VoidCallback onChanged;
  final TextInputType? keyboardType;
  final List<TextInputFormatter>? inputFormatters;
  final int? maxLength;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.labelSmall.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          maxLength: maxLength,
          onChanged: (_) => onChanged(),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, color: AppColors.textTertiary, size: 20),
            filled: true,
            fillColor: AppColors.backgroundSecondary,
            counterText: '',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('• ', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
            Expanded(
              child: Text(helperText, style: AppTextStyles.labelSmall),
            ),
          ],
        ),
      ],
    );
  }
}

class _BulletItem extends StatelessWidget {
  const _BulletItem(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '✓  ',
            style: TextStyle(color: AppColors.up, fontWeight: FontWeight.w700, fontSize: 13),
          ),
          Expanded(
            child: Text(text, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textPrimary)),
          ),
        ],
      ),
    );
  }
}

class _SuccessView extends StatelessWidget {
  const _SuccessView({super.key, required this.expectedDate});
  final String expectedDate;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle_outline, size: 80, color: AppColors.up),
          const SizedBox(height: 24),
          Text('신청이 완료되었습니다!', style: AppTextStyles.displayMedium),
          const SizedBox(height: 8),
          Text(
            '영업일 기준 72시간 내 처리될 예정입니다.\n예상 완료일: $expectedDate',
            textAlign: TextAlign.center,
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 40),
          // 진행 상태 스텝
          _StepIndicator(),
          const SizedBox(height: 48),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton.icon(
              onPressed: () => context.go('/home'),
              icon: const Icon(Icons.home_outlined),
              label: const Text(
                '홈으로 돌아가기',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.share_outlined),
              label: const Text(
                '친구에게 자랑하기',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary, width: 2),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StepIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.backgroundSecondary,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StepBubble(label: '신청완료', state: _StepState.done),
          _StepLine(active: true),
          _StepBubble(label: '검토중', state: _StepState.active),
          _StepLine(active: false),
          _StepBubble(label: '지급완료', state: _StepState.pending),
        ],
      ),
    );
  }
}

enum _StepState { done, active, pending }

class _StepBubble extends StatelessWidget {
  const _StepBubble({required this.label, required this.state});
  final String label;
  final _StepState state;

  @override
  Widget build(BuildContext context) {
    final Color bgColor;
    final Color textColor;
    final Widget child;

    switch (state) {
      case _StepState.done:
        bgColor = AppColors.up;
        textColor = AppColors.up;
        child = const Icon(Icons.check, size: 16, color: Colors.white);
      case _StepState.active:
        bgColor = AppColors.background;
        textColor = AppColors.primary;
        child = Text('2', style: TextStyle(color: textColor, fontWeight: FontWeight.w700));
      case _StepState.pending:
        bgColor = AppColors.backgroundSecondary;
        textColor = AppColors.textTertiary;
        child = Text('3', style: TextStyle(color: textColor, fontWeight: FontWeight.w700));
    }

    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: bgColor,
            shape: BoxShape.circle,
            border: state == _StepState.active
                ? Border.all(color: AppColors.primary, width: 2)
                : null,
          ),
          child: Center(child: child),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: textColor,
          ),
        ),
      ],
    );
  }
}

class _StepLine extends StatelessWidget {
  const _StepLine({required this.active});
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 20),
        color: active ? AppColors.primary : AppColors.border,
      ),
    );
  }
}
