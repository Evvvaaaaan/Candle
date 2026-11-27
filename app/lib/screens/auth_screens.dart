import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../auth/social_login.dart';
import '../config.dart';
import '../state.dart';
import '../theme.dart';
import '../ui/icons.dart';
import '../ui/legal_sheet.dart';
import '../ui/widgets.dart';

/// `index.html`: logo for two seconds, then home with a session or signup.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    final state = AppScope.read(context);
    Future.wait([
      Future<void>.delayed(const Duration(seconds: 2)),
      if (state.status == AuthStatus.unknown) state.restore(),
    ]).then((_) {
      if (!mounted) return;
      context.go(state.status == AuthStatus.signedIn ? '/home' : '/signup');
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Column(children: [
            Expanded(
              child: Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(26),
                    child: Image.asset('assets/images/candle-logo.png', width: 112, height: 112),
                  ),
                  const SizedBox(height: 12),
                  Text('Candle', style: font(32, weight: FontWeight.w700, height: 40, spacing: -0.025)),
                  const SizedBox(height: 10),
                  Text('오늘의 선택이 내일의 포인트로', style: font(16, height: 24)),
                ]),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 20),
              child: Text('시장 예측 리워드 서비스', style: font(11, height: 16, color: C.textMid)),
            ),
          ]),
        ),
      );
}

/// `signup.html`. Social buttons are wired in the last phase; the temporary
/// login is always visible in debug builds and opens in release builds only
/// after tapping the logo seven times (for store review).
class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key, this.showDevLogin});

  /// Defaults to [AppConfig.showDevLogin] (debug builds or SHOW_DEV_LOGIN).
  final bool? showDevLogin;
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _username = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  late bool _devOpen = widget.showDevLogin ?? AppConfig.showDevLogin;
  int _logoTaps = 0;

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _exchange(String provider, Map<String, Object?> credentials) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await AppScope.read(context).signIn(provider, credentials);
      if (mounted) context.go('/consent');
    } catch (error) {
      if (mounted) report(context, error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _tempLogin() async {
    final username = _username.text.trim();
    if (username.isEmpty) return announce(context, 'ID를 입력해 주세요.');
    await _exchange('temp', {'username': username, 'password': _password.text});
    _password.clear();
  }

  Future<void> _social(String provider) async {
    if (_busy) return;
    final Map<String, Object?>? credentials;
    try {
      credentials = await socialCredentials(provider);
    } on UnsupportedError {
      if (mounted) announce(context, '소셜 로그인은 준비 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    } catch (_) {
      if (mounted) announce(context, '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    if (credentials == null || !mounted) return; // cancelled
    await _exchange(provider, credentials);
  }

  /// Buttons only for providers that can sign in on this build.
  List<Widget> get _providers => [
        if (AppConfig.kakaoNativeAppKey.isNotEmpty)
          _AuthButton('카카오로 계속하기', 'kakao.svg', C.kakao, C.textDark, onTap: () => _social('kakao')),
        if (AppConfig.naverClientId.isNotEmpty)
          _AuthButton('네이버로 계속하기', 'naver.svg', C.naver, Colors.white, onTap: () => _social('naver')),
        if (AppConfig.googleServerClientId.isNotEmpty)
          _AuthButton('Google로 계속하기', 'google.svg', C.surface, C.textDark, onTap: () => _social('google')),
        // Apple needs a web service ID on Android; offer it on iOS only.
        if (defaultTargetPlatform == TargetPlatform.iOS)
          _AuthButton('Apple로 계속하기', 'apple.png', Colors.black, Colors.white, onTap: () => _social('apple')),
      ];

  void _tapLogo() {
    if (_devOpen || ++_logoTaps < 7) return;
    setState(() => _devOpen = true);
  }

  // Brand and title on top; sign-in buttons pinned to the bottom. Scrolls when
  // the keyboard or the temp login form needs more room.
  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          // Clamping: no iOS bounce when everything already fits.
          child: CustomScrollView(physics: const ClampingScrollPhysics(), slivers: [
            SliverFillRemaining(
              hasScrollBody: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                GestureDetector(
                  key: const Key('signup-logo'),
                  onTap: _tapLogo,
                  behavior: HitTestBehavior.opaque,
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.asset('assets/images/candle-logo.png', width: 32, height: 32),
                    ),
                    const SizedBox(width: 9),
                    Text('Candle', style: font(20, weight: FontWeight.w700, color: C.primary)),
                  ]),
                ),
                const SizedBox(height: 40),
                Text('로그인', textAlign: TextAlign.center, style: font(28, weight: FontWeight.w700, height: 38, spacing: -0.025)),
                const SizedBox(height: 8),
                Text('오늘의 시장을 예측하고\n포인트를 모아보세요.',
                    textAlign: TextAlign.center, style: font(14, height: 22, color: C.textMid)),
                const SizedBox(height: 40),
                const Spacer(),
                if (_providers.isNotEmpty) ...[
                  Text('간편 로그인', textAlign: TextAlign.center, style: font(11, weight: FontWeight.w500, height: 16, color: C.textMid)),
                  const SizedBox(height: 10),
                  for (final p in _providers) p,
                ],
                if (_devOpen) ...[
                  const SizedBox(height: 16),
                  CandleCard(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Text('개발용 임시 로그인', style: font(13, weight: FontWeight.w700)),
                      const SizedBox(height: 12),
                      Text('ID', style: font(12, weight: FontWeight.w500, color: C.textMid)),
                      const SizedBox(height: 6),
                      TextField(
                        key: const Key('temp-username'),
                        controller: _username,
                        autocorrect: false,
                        enableSuggestions: false,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 10),
                      Text('Password', style: font(12, weight: FontWeight.w500, color: C.textMid)),
                      const SizedBox(height: 6),
                      TextField(
                        key: const Key('temp-password'),
                        controller: _password,
                        obscureText: true,
                        onSubmitted: (_) => _tempLogin(),
                      ),
                      const SizedBox(height: 12),
                      PrimaryButton('임시로그인', onPressed: _busy ? null : _tempLogin),
                    ]),
                  ),
                ],
                Padding(
                  padding: const EdgeInsets.fromLTRB(0, 12, 0, 16),
                  child: Text('처음 이용하는 경우 다음 단계에서 필수 약관을 확인합니다.',
                      textAlign: TextAlign.center, style: font(11, height: 17, color: C.textLight)),
                ),
                ]),
              ),
            ),
          ]),
        ),
      );
}

class _AuthButton extends StatelessWidget {
  const _AuthButton(this.label, this.image, this.background, this.foreground, {required this.onTap});
  final String label, image;
  final Color background, foreground;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final asset = 'assets/images/$image';
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: background,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: background == C.surface ? C.border : background),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: SizedBox(
            height: 48,
            child: Stack(alignment: Alignment.center, children: [
              Positioned(
                left: 16,
                child: image.endsWith('.svg')
                    ? SvgPicture.asset(asset, width: 18, height: 18)
                    : Image.asset(asset, width: 18, height: 18),
              ),
              Text(label, style: font(14, weight: FontWeight.w500, color: foreground)),
            ]),
          ),
        ),
      ),
    );
  }
}

/// `consent.html`: three required agreements, recorded with `/api/term/consent`.
class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key});
  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  static const _items = [
    ('age', '만 14세 이상입니다 (필수)'),
    ('terms', '서비스 이용약관 동의 (필수)'),
    ('privacy', '개인정보 처리방침 동의 (필수)'),
  ];
  final _checked = <String>{};
  bool _busy = false;

  bool get _all => _checked.length == _items.length;

  Future<void> _submit() async {
    if (_busy || !_all) return;
    setState(() => _busy = true);
    try {
      await AppScope.read(context).api.consent([for (final (key, _) in _items) if (_checked.contains(key)) key]);
      if (mounted) context.go('/home?tutorial=1');
    } catch (error) {
      if (mounted) report(context, error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: SafeArea(
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Align(
              alignment: Alignment.centerRight,
              child: IconButton(
                tooltip: '닫기',
                onPressed: () => context.go('/signup'),
                icon: const CandleIcon(Ic.close, color: C.textDark),
              ),
            ),
            Expanded(
              child: ListView(padding: const EdgeInsets.symmetric(horizontal: 24), children: [
                const SizedBox(height: 24),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Image.asset('assets/images/candle-logo.png', width: 76, height: 76),
                ),
                const SizedBox(height: 24),
                Text('고객님,\n환영합니다!', style: font(24, weight: FontWeight.w500, height: 37.2, spacing: -0.02)),
                const SizedBox(height: 56),
                _CheckRow(
                  key: const Key('agree-all'),
                  label: '약관 전체동의',
                  bold: true,
                  value: _all ? true : (_checked.isEmpty ? false : null),
                  onChanged: () => setState(() {
                    if (_all) {
                      _checked.clear();
                    } else {
                      _checked.addAll([for (final (key, _) in _items) key]);
                    }
                  }),
                ),
                const Divider(color: C.border, height: 9),
                for (final (key, label) in _items)
                  SizedBox(
                    height: 56,
                    child: Row(children: [
                      Expanded(
                        child: _CheckRow(
                          key: Key('agree-$key'),
                          label: label,
                          value: _checked.contains(key),
                          onChanged: () => setState(() => _checked.contains(key) ? _checked.remove(key) : _checked.add(key)),
                        ),
                      ),
                      IconButton(
                        tooltip: legalTitles[key],
                        onPressed: () => showLegalSheet(context, key),
                        icon: const CandleIcon(Ic.chevron, color: C.textLight, size: 20),
                      ),
                    ]),
                  ),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
              child: SizedBox(
                height: 52,
                child: TextButton(
                  key: const Key('consent-submit'),
                  onPressed: _all && !_busy ? _submit : null,
                  style: TextButton.styleFrom(
                    backgroundColor: C.primary,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: C.disabled,
                    disabledForegroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    textStyle: T.button,
                  ),
                  child: const Text('다음'),
                ),
              ),
            ),
          ]),
        ),
      );
}

class _CheckRow extends StatelessWidget {
  const _CheckRow({super.key, required this.label, required this.value, required this.onChanged, this.bold = false});
  final String label;
  final bool? value;
  final VoidCallback onChanged;
  final bool bold;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: onChanged,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Row(children: [
            SizedBox(
              width: 24,
              height: 24,
              child: Checkbox(
                value: value,
                tristate: true,
                onChanged: (_) => onChanged(),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(label, style: font(13, height: 21, weight: bold ? FontWeight.w500 : FontWeight.w400)),
            ),
          ]),
        ),
      );
}
