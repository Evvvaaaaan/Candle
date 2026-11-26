import 'dart:io' show Platform;

import 'package:flutter/services.dart';
import 'package:flutter_naver_login/flutter_naver_login.dart';
import 'package:flutter_naver_login/interface/types/naver_login_status.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:kakao_flutter_sdk_user/kakao_flutter_sdk_user.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../config.dart';

/// Provider credentials in the body format `/api/user/{provider}` expects
/// (reference/web/js/auth.js). Returns null when the user cancels.
Future<Map<String, Object?>?> socialCredentials(String provider) => switch (provider) {
      'kakao' => _kakao(),
      'naver' => _naver(),
      'google' => _google(),
      'apple' => _apple(),
      _ => throw UnsupportedError(provider),
    };

/// `{accessToken}`. Uses KakaoTalk when installed, otherwise the Kakao account page.
Future<Map<String, Object?>?> _kakao() async {
  try {
    final token = await isKakaoTalkInstalled()
        ? await UserApi.instance.loginWithKakaoTalk()
        : await UserApi.instance.loginWithKakaoAccount();
    return {'accessToken': token.accessToken};
  } on PlatformException catch (e) {
    if (e.code == 'CANCELED') return null;
    rethrow;
  } on KakaoAuthException catch (e) {
    if (e.error == AuthErrorCause.accessDenied) return null;
    rethrow;
  }
}

/// `{accessToken}`.
Future<Map<String, Object?>?> _naver() async {
  final result = await FlutterNaverLogin.logIn();
  if (result.status != NaverLoginStatus.loggedIn) {
    // A cancel arrives as loggedOut on Android and as an error
    // ("Login cancelled by user") on iOS.
    if (result.status == NaverLoginStatus.loggedOut ||
        (result.errorMessage ?? '').toLowerCase().contains('cancel')) {
      return null;
    }
    throw StateError('Naver login failed');
  }
  final token = await FlutterNaverLogin.getCurrentAccessToken();
  if (token.accessToken.isEmpty) throw StateError('Naver returned no access token');
  return {'accessToken': token.accessToken};
}

Future<void>? _googleReady;

/// `{token, accessToken}`: the ID token and an OAuth access token.
Future<Map<String, Object?>?> _google() async {
  final google = GoogleSignIn.instance;
  await (_googleReady ??= google.initialize(
    clientId: Platform.isIOS && AppConfig.googleIosClientId.isNotEmpty ? AppConfig.googleIosClientId : null,
    serverClientId: AppConfig.googleServerClientId,
  ));
  try {
    const scopes = ['email', 'profile'];
    final account = await google.authenticate(scopeHint: scopes);
    final idToken = account.authentication.idToken;
    if (idToken == null) throw StateError('Google returned no ID token');
    final auth = await account.authorizationClient.authorizationForScopes(scopes) ??
        await account.authorizationClient.authorizeScopes(scopes);
    return {'token': idToken, 'accessToken': auth.accessToken};
  } on GoogleSignInException catch (e) {
    if (e.code == GoogleSignInExceptionCode.canceled) return null;
    rethrow;
  }
}

/// `{authorizationCode, identityToken}`.
Future<Map<String, Object?>?> _apple() async {
  try {
    final c = await SignInWithApple.getAppleIDCredential(
      scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName],
    );
    final identityToken = c.identityToken;
    if (identityToken == null) throw StateError('Apple returned no identity token');
    return {'authorizationCode': c.authorizationCode, 'identityToken': identityToken};
  } on SignInWithAppleAuthorizationException catch (e) {
    if (e.code == AuthorizationErrorCode.canceled) return null;
    rethrow;
  }
}
