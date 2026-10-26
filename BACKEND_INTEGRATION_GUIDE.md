# Candle 백엔드 연동 가이드

> Current professor handoff: [html/README.md](html/README.md). Edit `html/*.html`
> and use `html/default/custom.js` (`func_ajax`, `Authorization`, `RefreshToken`).
> The `/api/v1` cookie-based proposal below is historical and is not used by the
> new page-based frontend. Its endpoints must not be assumed to exist on the
> professor's server.

2026-10-11 기준 최신 진입점은 `/core-flow.html`이며 `/`에서 연결됩니다. 기존 `src/js/services/api.js`의 `USE_MOCK` 값을 바꾸는 방법은 최신 앱에 적용되지 않습니다. UI는 `candle-service.mjs` 또는 `demo-service.mjs`에서 받은 동일한 모델을 사용합니다.

## 실제 구현 확인과 제안 계약

로컬 `Candle-backend/src/main/java/com/example/candlebackend/controller/StockController.java`에서 확인한 경로:

| 경로 | 상태 |
|---|---|
| `GET /api/v1/stocks/top-list` | 구현 확인, 프론트가 그대로 사용 |
| `GET /api/v1/stocks/{ticker}` | 구현 확인, 현재 화면은 목록 응답 사용 |
| `GET /api/v1/stocks/logo/{ticker}` | 구현 확인, 현재 화면에서는 요청하지 않음 |
| 그 외 아래 계약 | 백엔드 구현을 확인하지 못함. 구현/합의 필요 |

종목 DTO의 `ticker`, `name`, `currentPrice`, `changeRate`를 변환합니다. 가격과 등락률 문자열을 파싱하며 잘못된 응답을 임의 가격으로 바꾸지 않습니다. 기존 DTO에 시장 구분이 없으면 ‘국내 주식’을 표시합니다. 실제 차트나 참여 비율은 제공되는 API가 없어 운영 화면에 허구의 차트를 표시하지 않습니다.

[docs/openapi.json](docs/openapi.json)이 요청/응답 필드의 기준입니다. JSON 직접 응답을 기준으로 하며 `{ success: true, data: ... }` 응답도 지원합니다. 원장·목록 데이터의 정렬은 서버에서 최신순으로 합니다. 초기 목록은 20개를 권장하며 `nextCursor`가 있으면 이전 내역 조회 버튼을 표시합니다. `/predictions/today`에는 오늘의 모든 접수 내역과 최근 결과를 함께 포함해 같은 종목 중복 제출 여부가 누락되지 않아야 합니다.

## 연결 순서

1. `npm ci`, `npm run dev:contract`로 계약 예제를 실행합니다. `http://127.0.0.1:4174/?mode=api`에서 로그인/약관/예측/교환을 확인합니다. 이 서버는 로컬 테스트용이며 운영에 배포하지 않습니다.
2. 실제 서버에 OpenAPI의 제안 경로를 구현합니다. 먼저 세션·약관, 이후 조회 API, 마지막으로 상태 변경 API를 연결합니다.
3. `config.js`를 `mode: 'api'`, `apiBaseUrl: 'https://staging.example/api/v1'`로 설정합니다. 스테이징에서 승인한 정확한 프론트 Origin을 CORS에 등록합니다.
4. 실제 계정으로 로그인, 약관, 예측, 서버 정산, 광고 완료 검증, 교환 실패/취소 및 중복 요청을 검증합니다.
5. `CANDLE_API_BASE_URL=https://api.example/api/v1 npm run build` 후 `dist/`만 배포합니다. 기본은 동일 출처 `/api/v1`입니다.

프론트는 API 실패 시 데모로 전환하지 않습니다. 세션/초기 조회 실패는 오류·재시도 화면, 변경 요청 실패는 현재 화면의 오류 안내를 표시합니다. 성공 응답 뒤 조회가 실패하면 완료 여부를 숨기지 않고 재조회하도록 안내합니다.

## 인증과 가입

- `GET /auth/session`: 비로그인은 HTTP 200 + `user:null`; 로그인 상태는 `user.id`, `nickname`, `consentRequired`, `csrfToken`, 활성 `providers`를 반환합니다.
- `GET /auth/{provider}/start?returnTo=...`: 서버가 제공자 OAuth를 시작합니다. 서버가 state/nonce 및 필요한 PKCE 검증, 계정 연결, 콜백을 처리합니다. `returnTo`는 등록한 프론트 주소만 허용합니다.
- 완료 후 HttpOnly·Secure 세션 쿠키를 발급하고 프론트로 돌아옵니다. 토큰을 URL/localStorage/sessionStorage에 넣지 않습니다. 프론트는 `credentials: include`로 요청합니다.
- `GET /legal/agreements/current`: 약관 ID/필수 여부/제목/버전/본문. 본문은 HTML 실행 없이 텍스트로 표시합니다. 서버에서 승인된 본문을 제공해야 합니다.
- `POST /legal/agreements`: 사용자가 체크한 ID·버전·동의 여부를 전송합니다. 서버가 필수 누락/구버전을 거부하고 동의 시각을 기록합니다.
- `POST /auth/logout`: 서버 세션 폐기와 쿠키 만료. 프론트는 사용자 데이터와 보류 키를 지우고 로그인 화면으로 이동합니다.

모든 변경 요청은 `X-CSRF-Token`과 `Idempotency-Key`를 전송합니다. CSRF 토큰은 `/auth/session` 응답에서 메모리로만 보관합니다. 서버도 CSRF·Origin을 검증해야 합니다. 외부 Origin을 쓰면 `Access-Control-Allow-Credentials: true`와 정확한 Origin, GET/POST/OPTIONS 및 위 헤더를 허용해야 합니다. 로컬 백엔드의 현재 wildcard CORS만으로 쿠키 인증을 연결할 수 없습니다. 가능하면 동일 출처 리버스 프록시를 사용하세요.

참고: [MDN Fetch credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## 조회와 상태 변경

| 기능 | 조회 | 변경 |
|---|---|---|
| 예측 | `/predictions/today`, `/predictions/history?cursor=&limit=20` | `POST /predictions` `{stockCode,direction}` |
| 예측권 | `/prediction-tickets` | 예측·광고 처리와 함께 서버 갱신 |
| 포인트 | `/wallet`, `/wallet/transactions?cursor=&limit=20` | 서버 원장에서만 계산 |
| 결과 수령 | 예측 목록의 `status`, `points`, `claimed` | `POST /predictions/claim` `{predictionId}` |
| 출석·미션 | `/missions` | `POST /missions/attendance` `{}` |
| 교환 상품 | `/rewards/catalog` | 서버/운영자 관리 |
| 교환 내역 | `/reward-claims?cursor=&limit=20` | `POST /reward-claims` `{rewardId,recipient:{phone,name},agreementVersion}` |
| 광고 | `POST /ads/sessions`로 세션과 HTTPS `launchUrl` 발급 | `POST /ads/sessions/verify` `{sessionId}` |

홈과 예측 화면의 보상형 광고 버튼은 현재 화면 위에 하단 안내창을 엽니다. API 모드에서는 사용자가 ‘광고 시청하기’를 누르면 세션을 만들고 외부 HTTPS 창을 엽니다. 팝업 차단 시에는 직접 열기 링크를 제공합니다. 제공자 콜백을 서버가 검증하고, 복귀 시 자동 완료 확인 요청이 `status: VERIFIED`를 반환해야 예측권을 다시 읽고 기존 종목·방향을 유지한 예측 화면으로 돌아갑니다. 확인 지연·네트워크 실패는 수동 재확인으로 복구하며 예측을 자동 제출하지 않습니다. 클라이언트 타이머나 버튼 클릭만으로 보상을 발급하지 마세요. 선택한 광고 SDK가 외부 링크 방식을 지원하지 않는다면 `start-reward-ad` 이벤트와 `adStart`의 `launchUrl` 계약을 해당 네이티브 SDK 브리지로 교체하고 실기기 검증해야 합니다. 광고 사업자 미선정 상태에서 SDK 연동 완료를 의미하지 않습니다.

예측 화면은 서버 `serverTime`, `closesAt`, `status`로 마감을 표시하고 서버가 최종 판정합니다. 기기 시계 대신 로드 후 경과 시간을 사용합니다. 예측 ID·차감 예측권 종류·선택 방향은 서버 목록에서 표시합니다. 출석·미션 포인트 역시 서버 트랜잭션에서 지급해야 합니다.

`rewardId`의 가격·재고·수령 동의 버전은 서버에서 다시 확인합니다. 프론트 금액은 지급 권한의 근거가 아닙니다. 현재 수령 번호 형식은 `010` + 8자리, 이름은 2~40자이며 실제 지급 사업자 계약에 맞게 백엔드와 함께 변경하세요. 이름·번호는 전송용 폼 메모리에만 두고 브라우저 영구 저장소나 로그에 넣지 않습니다. 오류 뒤 현재 폼은 유지되고 화면을 떠나면 지워집니다.

## 멱등성과 실패

- 같은 키/같은 사용자/같은 본문 요청은 같은 결과를 반환합니다. 다른 본문에 같은 키가 오면 `IDEMPOTENCY_CONFLICT`로 거절합니다.
- 예측 저장·예측권 차감, 결과 수령·포인트 원장, 교환 접수·포인트 차감은 각각 원자적 트랜잭션이어야 합니다.
- 네트워크 오류 후 수동 재시도와 같은 탭 새로고침은 보류 중인 키를 재사용합니다. 보류 정보에는 수령인 이름·번호가 없고 상품 ID만 있으므로, 결과가 불확실한 요청의 수령 정보를 바꿔 재시도하면 서버에서 충돌을 거절해야 합니다. 먼저 기존 처리 내역을 확인하세요.
- 서버는 사용자/종목/회차 중복, 사용자/출석일 중복, 보상/수령 중복을 키와 별도로 제한해야 합니다. 서로 다른 탭이나 기기는 다른 키를 만들 수 있습니다.
- 세션 만료 401은 보호 화면을 비우고 로그인을 요청합니다. 포인트 부족·마감·중복은 오류 코드로 전달합니다. 서버의 원문 오류 메시지나 스택을 사용자에게 표시하지 않습니다.

주요 오류 코드: `SESSION_EXPIRED`, `PREDICTION_CLOSED`, `ALREADY_PREDICTED`, `INSUFFICIENT_TICKETS`, `INSUFFICIENT_POINTS`, `ALREADY_CLAIMED`, `AD_NOT_VERIFIED`, `AD_UNAVAILABLE`, `AGREEMENT_REQUIRED`, `VALIDATION_ERROR`, `RATE_LIMITED`, `IDEMPOTENCY_CONFLICT`.

## 실제 백엔드 검증의 남은 범위

자동 테스트의 API 모드는 로컬 계약 시뮬레이터를 사용합니다. Spring 서버 실행, 실제 OAuth 제공자, 광고 서버 콜백, 지급 사업자, 실계정 원장과 네트워크 CORS는 아직 검증하지 않았습니다. 필요한 계약/정책은 [출시 준비 계획](docs/RELEASE_PLAN.md)과 [정책 협의 목록](BACKEND_DISCUSSION_CHECKLIST.md)을 확인하세요.


## 홈 연승 안내와 배너 광고

홈에는 기존 디자인의 10연승 안내와 AD 배너를 항상 유지합니다. 연승 안내의 ‘100만원 리워드’는 ‘달성자 중 추첨’ 조건이며, 현재는 `#challenge` 안내 화면으로 연결됩니다. 사용자 연승 수·자격·당첨 여부를 조회된 일부 예측 목록으로 계산하지 않습니다. 연승 판정/추첨은 서버가 수행해야 하며, 수령 상태 조회·신청의 제안 계약은 아래 추가 절을 따릅니다. 운영 정책과 실제 지급 연동은 별도로 확정해야 합니다. 이 기능은 현재 포인트 상품 교환과 구분해야 합니다.

홈의 AD 배너는 현재 Candle 자체 홍보이며 예측 화면으로 이동합니다. 외부 캠페인 소재와 URL, 광고주 표시, 측정 계약은 추후 연결 대상입니다. 현재 `/ads/sessions`는 예측권을 받는 보상형 광고용이므로 홈페이지 배너 클릭에 연결하거나 보상을 지급하지 마세요. 외부 광고 미연결을 이유로 홈의 배너 UI를 제거하지 않습니다.


## 10연승 네이버페이 리워드 수령 추가 (2026-10-11)

`#challenge-reward`의 당첨 상태/수령 정보/접수·지급 상태를 추가했다. 홈 챌린지와 내 정보에서 접근한다. 기존 `POST /reward-claims`와 구분하며 앱 포인트를 차감하지 않는다.

- `GET /api/v1/challenges/ten-wins/reward`: 화면 진입 때만 조회. 초기 7개 조회에는 포함하지 않음.
- `POST /api/v1/challenges/ten-wins/claims`: 당첨 ID·수령 정보·버전 동의, CSRF 및 멱등 키 필수.
- OpenAPI `ChallengeReward`와 `ChallengeRewardRequest`가 제안 스키마다. 실제 지급 백엔드 구현 여부는 미확인이다.
- 공식 자료, 네이버 ID/전화번호의 구분, 제3자 제공 동의, 서버 자격 검증, 세금·본인확인 선행 처리, 중복 지급 방지는 [네이버페이 리워드 인수 문서](docs/NAVER_PAY_REWARD.md)를 따른다.
