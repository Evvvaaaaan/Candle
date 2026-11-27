# Candle (Flutter)

주식 종목의 다음 거래일 방향을 예측하고 포인트를 받는 Candle의 네이티브 앱입니다.
웹 버전(`../html`, 배포본 `https://candle.seohamin.com`)의 화면과 API 계약을 그대로 옮겼습니다.
배포본 원본은 `reference/web/`에 있습니다.

## 실행

```sh
flutter pub get
flutter run --dart-define-from-file=dart_defines.json   # 운영 서버 https://candle.seohamin.com
```

`--dart-define-from-file=dart_defines.json`을 빼면 소셜 로그인 버튼이 숨겨집니다(Apple 제외).

디버그 빌드에서는 회원가입 화면에 **개발용 임시 로그인**이 보입니다.
출시 빌드에서는 숨겨지며, 로고를 7번 누르면 펼쳐집니다(스토어 심사용).

## 빌드 설정 (`--dart-define`)

| 이름 | 기본값 | 설명 |
|---|---|---|
| `API_BASE_URL` | `https://candle.seohamin.com` | 백엔드 origin (`/api` 제외) |
| `ADMOB_REWARDED_ANDROID` / `ADMOB_REWARDED_IOS` | Google 테스트 광고 단위 | 보상형 광고 단위 ID |
| `PRIVACY_URL` | `https://candleapp.kr/privacy` | 설정 화면의 개인정보 처리방침 링크 |
| `SHOW_DEV_LOGIN` | 꺼짐 | 출시 빌드에서도 임시 로그인을 처음부터 표시. 스토어 빌드에는 넣지 않음 |

## 소셜 로그인 키

키는 git에서 제외되는 파일 세 개에 있습니다. 새 PC에서는 각 `.example` 파일을 복사해 값을 채웁니다.

| 파일 | 내용 |
|---|---|
| `dart_defines.json` | `KAKAO_NATIVE_APP_KEY`, `NAVER_CLIENT_ID`, `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_SERVER_CLIENT_ID` — 버튼 표시와 SDK 초기화 |
| `ios/Flutter/Secrets.xcconfig` | iOS Info.plist용(카카오·Google URL scheme, 네이버 키, `NAVER_URL_SCHEME=candlenaverlogin`) |
| `android/secrets.properties` | Android 카카오 scheme, 네이버 키 |

Google 클라이언트 비밀번호와 Apple `AuthKey_*.p8`는 서버용이라 앱에 넣지 않습니다.

서버에 보내는 값(`POST /api/user/{provider}`): kakao·naver `{accessToken}`, google `{token: idToken, accessToken}`, apple `{authorizationCode, identityToken}`.

AdMob은 **출시 빌드에서만 Candle의 실제 ID**를 쓰고, 디버그 빌드는 Google 테스트 ID를 씁니다(개발 중 실제 광고 클릭 방지).

- 광고 단위: `lib/config.dart` (`kReleaseMode`로 분기, `--dart-define=ADMOB_REWARDED_IOS/ANDROID`로 덮어쓰기 가능)
- 앱 ID: Android `android/app/build.gradle.kts`의 release `admobAppId`, iOS `ios/Flutter/Release.xcconfig`의 `GAD_APPLICATION_ID`

예측권 지급은 서버의 AdMob SSV 콜백으로 이루어집니다. 콜백 등록 상태는 [docs/backend-requests.md](docs/backend-requests.md)를 보세요.

## 출시 빌드

**Android**

- `android/key.properties`(git 제외)가 업로드 키스토어 `~/.candle-keys/candle-upload.jks`를 가리킵니다.
- 키스토어와 비밀번호는 반드시 따로 백업하세요. 잃어버리면 Play 업데이트를 할 수 없습니다.
- `key.properties`가 없으면 출시 빌드가 디버그 키로 서명되고, Play Console이 이를 거부합니다.

```sh
flutter build appbundle --release --dart-define-from-file=dart_defines.json
# build/app/outputs/bundle/release/app-release.aab
```

**iOS** (Team `6BZLQ5S936`, 번들 `com.jeondowon.candle`, iOS 15+)

Xcode › Settings › Accounts에 해당 팀의 Apple 계정을 추가해야 서명됩니다.
App ID에는 Sign in with Apple 기능이 켜져 있어야 합니다.

```sh
flutter build ipa --release --dart-define-from-file=dart_defines.json
```

이 Mac(macOS 27)의 `lipo`는 `-verify_arch`에 아키텍처를 하나만 받습니다. 그래서 `flutter build ios --simulator`는 실패합니다.
시뮬레이터에서는 `flutter run -d <시뮬레이터 ID>`를 쓰세요. 실기기·스토어 빌드는 arm64 하나만 빌드하므로 영향이 없습니다.

## 테스트

```sh
flutter analyze
flutter test                     # API 계약·세션 갱신·검증 규칙·화면 흐름 (네트워크 없음)
flutter drive --driver=test_driver/integration_test.dart \
  --target=integration_test/screens_test.dart -d <device> \
  --dart-define=TEST_USERNAME=<id> --dart-define=TEST_PASSWORD=<pw>
                                 # 실제 앱으로 로그인 후 모든 화면 스크린샷 → screenshots/
```

## 백엔드 요청 사항

회원 탈퇴 API, 소셜 토큰 검증, AdMob SSV: [docs/backend-requests.md](docs/backend-requests.md)
