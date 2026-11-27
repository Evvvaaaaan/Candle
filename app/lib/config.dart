import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

/// Build-time settings. Override with `--dart-define=KEY=value`.
abstract final class AppConfig {
  /// Backend origin without the `/api` suffix.
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://candle.seohamin.com',
  );

  /// Shows the temporary login form without the hidden gesture.
  /// Debug builds always show it; never pass this for a store build.
  static const _showDevLogin = bool.fromEnvironment('SHOW_DEV_LOGIN');
  static bool get showDevLogin => kDebugMode || _showDevLogin;

  static const privacyUrl = String.fromEnvironment(
    'PRIVACY_URL',
    defaultValue: 'https://candleapp.kr/privacy',
  );

  // Release builds use Candle's AdMob units; debug and profile builds use
  // Google's public test units so development never serves (or clicks) real ads.
  static const _rewardedAndroid = String.fromEnvironment(
    'ADMOB_REWARDED_ANDROID',
    defaultValue: kReleaseMode ? 'ca-app-pub-1786329512393630/3765977778' : 'ca-app-pub-3940256099942544/5224354917',
  );
  static const _rewardedIos = String.fromEnvironment(
    'ADMOB_REWARDED_IOS',
    defaultValue: kReleaseMode ? 'ca-app-pub-1786329512393630/1331386120' : 'ca-app-pub-3940256099942544/1712485313',
  );
  static String get rewardedAdUnit =>
      Platform.isIOS ? _rewardedIos : _rewardedAndroid;

  /// Social providers appear only when their keys are configured.
  static const kakaoNativeAppKey = String.fromEnvironment('KAKAO_NATIVE_APP_KEY');
  static const naverClientId = String.fromEnvironment('NAVER_CLIENT_ID');
  static const googleServerClientId = String.fromEnvironment('GOOGLE_SERVER_CLIENT_ID');
  static const googleIosClientId = String.fromEnvironment('GOOGLE_IOS_CLIENT_ID');

  /// Daily ad-ticket limit enforced by the server (`/api/heart/count` ad ≤ 10).
  static const adLimit = 10;
}
