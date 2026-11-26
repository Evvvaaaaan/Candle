# 백엔드 요청 사항 (Flutter 앱 출시용)

## 1. 회원 탈퇴 API (App Store 심사 필수)

App Store 가이드라인 5.1.1(v)에 따라 앱 안에서 탈퇴를 시작할 수 있어야 합니다.
배포본 API에는 탈퇴 엔드포인트가 없어 앱에 넣지 못했습니다.

제안 형식:

- `DELETE /api/user` (인증 헤더 `Authorization` 필요)
- 성공하면 `200` 또는 `204`를 돌려줍니다. 계정과 토큰을 무효화하고, 개인정보를 처리방침에 따라 삭제하거나 비식별화합니다.
- 소셜 계정 연결 해제
  - Apple: 서버에서 Apple `revoke` API를 호출해야 합니다(Apple 요구사항). Key ID `DLVJ36S9WS`, Team `6BZLQ5S936`의 `.p8` 키를 씁니다.
  - 카카오·네이버·Google: 각 서비스의 연결 끊기 API를 호출하는 것을 권장합니다.
- 진행 중인 교환 신청(process 0)이나 10연승 리워드 신청이 있을 때의 처리 방침도 정해 주세요.

엔드포인트가 생기면 앱의 계정·약관 화면에 "회원 탈퇴"(확인 대화상자 포함)를 연결하겠습니다.

## 2. 소셜 로그인 토큰 검증

앱은 `POST /api/user/{provider}`로 아래 값을 보냅니다. 웹과 같은 형식입니다.

| provider | body | 서버에서 확인할 점 |
|---|---|---|
| `kakao` | `{accessToken}` | 카카오 앱 ID 1668199의 토큰 |
| `naver` | `{accessToken}` | 네이버 클라이언트 ID `j1S8...`의 토큰 |
| `google` | `{token, accessToken}` | `token`은 ID 토큰입니다. 받는 쪽(audience)이 **iOS 클라이언트**(`...-70ime5...`) 또는 **웹 클라이언트**(`...-fdgpc4...`)여야 하므로 두 값을 모두 허용해야 합니다. |
| `apple` | `{authorizationCode, identityToken}` | `identityToken`의 받는 쪽(audience)은 번들 ID `com.jeondowon.candle`입니다. |

## 3. AdMob 보상형 광고 SSV

앱은 `ServerSideVerificationOptions(userId: <GET /api/user의 id>, customData: <화면명>)`을 넣어 광고를 띄웁니다.
실제 AdMob 광고 단위에 SSV 콜백 URL(`/v1/api/reward/callback`)을 등록해야 예측권이 지급됩니다.
테스트 광고 ID로는 이 콜백이 오지 않습니다.
