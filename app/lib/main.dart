import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart' show MobileAds;
import 'package:kakao_flutter_sdk_user/kakao_flutter_sdk_user.dart' show KakaoSdk;
import 'package:shared_preferences/shared_preferences.dart';

import 'api/candle_api.dart';
import 'api/client.dart';
import 'config.dart';
import 'router.dart';
import 'state.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  unawaited(MobileAds.instance.initialize());
  if (AppConfig.kakaoNativeAppKey.isNotEmpty) KakaoSdk.init(nativeAppKey: AppConfig.kakaoNativeAppKey);
  final state = AppState(
    api: CandleApi(ApiClient(baseUrl: AppConfig.apiBaseUrl, tokens: SecureTokenStore())),
    prefs: await SharedPreferences.getInstance(),
  );
  runApp(CandleApp(state: state));
}

class CandleApp extends StatefulWidget {
  const CandleApp({super.key, required this.state});
  final AppState state;
  @override
  State<CandleApp> createState() => _CandleAppState();
}

class _CandleAppState extends State<CandleApp> {
  late final GoRouter _router = buildRouter(widget.state);

  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AppScope(
        state: widget.state,
        child: MaterialApp.router(
          title: 'Candle',
          debugShowCheckedModeBanner: false,
          theme: candleTheme(),
          routerConfig: _router,
          locale: const Locale('ko', 'KR'),
          builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
            value: SystemUiOverlayStyle.dark,
            child: child!,
          ),
        ),
      );
}
