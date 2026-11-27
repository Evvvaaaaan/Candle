# 백엔드 요청 사항 (Flutter 앱 출시용)

## 1. 회원 탈퇴 API (App Store 심사 필수) — 완료

서버 커밋 3ed8e1c의 `PUT /api/user/withdraw`(본문 `{ "withdraw": "사유" }`, 선택)를
계정·약관 화면 › 회원 탈퇴에 연결했습니다. 서버가 Apple 연결 해지까지 처리합니다.

남은 확인: 진행 중인 교환 신청(process 0)이나 10연승 리워드 신청이 있을 때의 처리 방침.

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

**현재 막힘 (2026-11-27):** AdMob 콘솔에서 `https://candle.seohamin.com/v1/api/reward/callback`을
등록하려고 "URL 확인"을 누르면 서버가 **HTTP 400**을 돌려 등록되지 않습니다(테스트 사용자 ID·맞춤 데이터를 넣어도 동일).
AdMob의 확인 요청에도 `200`을 돌려주도록 고쳐 주세요. 서명 검증은 유지하되, 확인 요청의 `user_id`가
실제 회원이 아니어도 400을 내지 않아야 합니다.
고쳐지면 아래 두 광고 단위의 고급 설정 › 서버 측 확인에 URL을 등록합니다.

| 플랫폼 | 앱 ID | 보상형 광고 단위 ID |
|---|---|---|
| iOS | `ca-app-pub-1786329512393630~2330828368` | `ca-app-pub-1786329512393630/1331386120` |
| Android | `ca-app-pub-1786329512393630~7232956203` | `ca-app-pub-1786329512393630/3765977778` |
