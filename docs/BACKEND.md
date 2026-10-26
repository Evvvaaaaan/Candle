# Candle 백엔드 연동 문서

> Historical `/api/v1` proposal. The current runtime uses the professor's
> token-header contracts documented in [PROFESSOR_BACKEND.md](PROFESSOR_BACKEND.md).
> The cookie/session API paths and runtime descriptions below are retained policy
> references; they are not the API implementation used by the connected tidy page.

기준일: 2026-10-26. 기준 화면은 저장소 루트의 `index.html` 한 파일입니다.

이 문서는 아래 문서들을 하나로 합치고, 현재 `index.html` 기준으로 고친 것입니다.
`BACKEND_INTEGRATION_GUIDE.md`, `BACKEND_DISCUSSION_CHECKLIST.md`, `docs/NAVER_PAY_REWARD.md`,
`docs/DEPLOYMENT.md`, `docs/LEGACY_RUNTIME.md`. 원본은 git 기록에 남아 있습니다.

| 자료 | 용도 |
|---|---|
| [openapi.json](openapi.json) | 요청/응답 필드의 기준. 접두사 `/api/v1` |
| [reference/](reference/) | 예전 버전에서 실제 API를 호출하던 JS. 참고용 |
| 이 문서 | HTML 연동 지점, 서버 규칙, 합의가 필요한 정책 |

`GET /stocks/top-list`, `GET /stocks/{ticker}`, `GET /stocks/logo/{ticker}`는 로컬 `Candle-backend`의
`StockController`에서 구현을 확인했습니다. 나머지 API는 프론트가 제안하는 계약이며 구현이 필요합니다.

---

## 1. HTML 구조 요약

- 화면 19개가 `<section class="screen-view" id="...">`로 한 문서에 들어 있습니다. 주소의 해시(`#home`,
  `#prediction` 등)로 화면을 바꿉니다. 해시가 없으면 로그인(`#signup`) 화면이 열립니다.
- 스크립트는 문서 끝의 `<script>` 하나입니다. 상태는 메모리의 `state` 객체에만 있고 서버 요청은 없습니다.
- 버튼 동작은 `#app`의 클릭 핸들러 하나에서 `data-*` 속성으로 나눕니다.
  `data-route`(화면 이동), `data-direction`(상승/하락), `data-stock-code`(종목 선택), `data-product`(교환 상품),
  `data-legal`(약관 보기), `data-reward-ad`(광고 안내창), `data-claim`(보상 수령) 등입니다.
- `localStorage`는 튜토리얼을 봤는지(`candle.tutorial.seen`) 하나만 저장합니다.
- 이미지와 폰트는 `<script id="embedded-assets">` 안에 data URI로 들어 있습니다. 외부 파일 요청이 없습니다.

## 2. HTML 연동 지점

### 2.1 서버 요청으로 바꿀 곳

서버가 필요한 동작은 모두 `requireServer(동작 이름, 오류 표시 위치)`를 호출합니다. 지금은
"…에는 실제 서버 연결이 필요합니다"라는 안내만 띄웁니다. 이 호출을 실제 API 요청으로 바꾸면 됩니다.

| 화면 | 요소 | 현재 코드 | 연결할 API |
|---|---|---|---|
| 로그인 `#signup` | `[data-login=kakao\|naver\|google\|apple]` | 인증 없이 `#home`으로 이동 | `GET /auth/{provider}/start?returnTo=` 로 이동 |
| 가입 전 확인 `#consent` | `#consent-submit` | `requireServer('약관 동의 제출')` | `POST /legal/agreements` |
| 예측 확인 창 | `#submit-prediction` | `requireServer('예측 접수')` | `POST /predictions` `{stockCode, direction}` |
| 광고 안내 창 | `#start-reward-ad` | `requireServer('광고 재생 및 예측권 지급')` | `POST /ads/sessions` → `launchUrl` 열기 |
| 광고 `#ad` | `#verify-ad` | `requireServer('광고 완료 확인')` | `POST /ads/sessions/verify` `{sessionId}` |
| 예측 내역 `#prediction-history` | `[data-claim]` | **화면에서만 "수령 완료"로 바뀜** | `POST /predictions/claim`. 성공 후 목록 재조회 |
| 미션 `#missions` | `#attendance` | `requireServer('출석 확인 및 보상 지급')` | `POST /missions/attendance` |
| 지급 신청 `#payout` | `#payout-form` 제출 | `requireServer('지급 신청', 'payout-error')` | `POST /reward-claims` |
| 리워드 수령 `#challenge-reward` | `#challenge-reward-form` 제출 | `requireServer('리워드 수령 신청', 'reward-form-error')` | `POST /challenges/ten-wins/claims` |
| 계정 설정 `#settings` | `#logout` | `requireServer('로그아웃')` | `POST /auth/logout` |
| 예측 `#prediction` | `[data-watchlist-toggle]` | `state.watchlist`(메모리)만 바꿈 | `PUT`/`DELETE /watchlist/{stockCode}` |

스크립트에는 `[data-more]`(이전 내역 조회)와 `#retry-reward`(당첨 및 수령 자격 확인) 처리도 있지만, 해당 버튼은
아직 HTML에 없습니다. 목록 페이지 이동과 리워드 상태 재조회가 필요하면 버튼을 추가하고 같은 속성·ID를 붙이면 됩니다.

입력 검증은 이미 HTML에 있습니다. 지급 신청은 `010` + 8자리 번호와 2~40자 이름을 검사하고,
리워드 수령은 네이버 ID 재입력 일치와 필수 동의를 검사합니다. 검증을 통과한 뒤 `requireServer`가 호출됩니다.

### 2.2 서버 값으로 채울 곳

`data-server-value` 속성이 붙은 요소에는 **디자인용 예시 값**이 들어 있습니다. 실제 값으로 바꿔야 합니다.

| 속성 값 | 위치 | 예시 값 | 데이터 출처 |
|---|---|---|---|
| `balance` | 홈, 상점, 교환 확인, 내 정보, 포인트 내역 (5곳) | `12,450 P` | `GET /wallet` → `balance` |
| `tickets` | 홈, 예측, 예측권 (3곳) | `3회` | `GET /prediction-tickets` → `free + ad` |
| `streak` | 홈 연승 카드 | `7` | `GET /predictions/today` → `streak` |
| `streak-remaining` | 홈 연승 카드 | `3` | `10 - streak` (0 미만이면 0) |
| `price`, `change` | 홈 선택 종목 카드 | `71,200원`, `+1.28%` | `GET /stocks/top-list` |

속성이 없지만 예시 값이 들어 있는 곳도 있습니다.

| 화면 | 예시 내용 | 데이터 출처 |
|---|---|---|
| 예측, 예측권 | 기본 무료 `1회`, 광고 예측권 `2장`, 광고 카드의 `오늘 2 / 10회`와 진행 막대(20%) | `GET /prediction-tickets` → `free`, `ad`, `adCount`, `adLimit` |
| 광고 안내 창 | 오늘 남은 참여 `8 / 10회` | `adLimit - adCount` / `adLimit` |
| 예측 화면, 예측 확인 창 | 조회 가격 `71,200원 +1.28%` | `GET /stocks/top-list` |
| 내 정보 | 현재 연승 `7`, 최고 연승 `42`, 적중률 `63%`, `24회 중 15회 적중` | `GET /predictions/today` → `streak`, `bestStreak`, `predictionCount`, `wonCount` |
| 내 정보 | 닉네임 자리의 "서버 연결 필요" | `GET /auth/session` → `user.nickname` |
| 미션 | 오늘 `0 / 2 완료`·`0 P`, 미션 4개의 포인트와 진행도(`0 / 5`, `0 / 3`) | `GET /missions` |
| 예측 내역 | 종목 4건(결과 대기, 적중, 수령 완료, 미적중) | `GET /predictions/history` |
| 지난 예측 결과 창 | 삼성전자 · 상승 · 적중 · `+15P` | `GET /predictions/today`의 최근 결과(`today: false`) |
| 포인트 내역 | 예시 7건(적립 4, 사용 2, 환급 1) | `GET /wallet/transactions` |
| 약관 보기 `#legal` | "서버 연결 필요" | `GET /legal/agreements/current` → `body` |

### 2.3 HTML에 고정된 목록

서버 데이터로 바꿀지 결정이 필요한 목록입니다.

| 목록 | 현재 HTML | 연동 방법 |
|---|---|---|
| 종목 40개 | `#stock-select-list`의 버튼. 코스피 20(`data-stock-top`), 코스닥 20 | `GET /stocks/top-list`로 버튼을 생성하고 같은 `data-stock-*` 속성을 붙이면 기존 검색·필터가 그대로 동작 |
| 교환 상품 5개 | `#shop`의 `[data-product]` 라디오 버튼. 네이버페이 5천·1만·3만·5만·10만 원권. 예시 잔액 12,450P 기준으로 3만 원권부터 `disabled`와 `17,550P 부족`이 고정되어 있음 | `GET /rewards/catalog`로 생성. `data-product-amount`, `data-product-points`, `data-product-title` 유지. `balance`보다 `points`가 큰 상품은 `disabled`로 만들고 부족분을 `.product-state`에 표시 |
| 가입 약관 3개 | `#consent`의 `[data-agreement=age\|terms\|privacy]` | `GET /legal/agreements/current`의 `id`와 맞춤 |
| 약관 제목 | 스크립트의 `legalTitles` (`age`, `terms`, `privacy`, `reward`) | 같은 API의 `title` |

종목 검색은 HTML에 있는 목록 안에서만 걸러냅니다. 목록 밖 종목을 검색하려면 검색 API가 따로 필요합니다.

### 2.4 참고 코드 (`docs/reference/`)

예전 버전에서 쓰던 API 호출 코드입니다. 예전 화면 구조에 맞춰 작성했기 때문에 그대로 붙일 수는 없지만,
요청 방식은 위 계약과 같습니다.

| 파일 | 내용 |
|---|---|
| `api-client.mjs` | `fetch` 래퍼. `credentials: 'include'`, 12초 타임아웃, `X-CSRF-Token`/`Idempotency-Key` 헤더, `{success, data}` 응답 풀기, 오류 코드별 사용자 문구 |
| `candle-service.mjs` | 액션별 API 경로(`mutations`), 응답 검증, 초기 조회 7개 병렬 요청, 로그인 시작 URL |
| `challenge-reward.mjs` | `GET /challenges/ten-wins/reward` 응답 검증 |

`candle-service.mjs`의 로그인 콜백 주소는 `index.html`로 고쳐 두었습니다.

---

## 3. 인증과 가입

- `GET /auth/session`: 비로그인이면 HTTP 200 + `user: null`입니다. 로그인 상태면 `user.id`, `nickname`,
  `consentRequired`, `csrfToken`, 활성 `providers`를 반환합니다.
- `GET /auth/{provider}/start?returnTo=...`: 서버가 OAuth를 시작합니다. state/nonce, 필요한 경우 PKCE,
  계정 연결, 콜백은 서버가 처리합니다. `returnTo`는 등록된 프론트 주소만 허용합니다.
  화면에는 카카오, 네이버, Google, Apple 버튼 4개가 있습니다.
- 완료되면 HttpOnly·Secure 세션 쿠키를 발급하고 프론트로 돌려보냅니다. 토큰을 URL, `localStorage`,
  `sessionStorage`에 넣지 않습니다. 프론트는 `credentials: 'include'`로 요청합니다.
- `consentRequired: true`이면 `#consent`, 아니면 `#home`으로 보냅니다.
- `GET /legal/agreements/current`: 약관 ID, 필수 여부, 제목, 버전, 본문. 본문은 HTML로 실행하지 않고
  텍스트로 표시합니다.
- `POST /legal/agreements`: 사용자가 체크한 ID·버전·동의 여부를 보냅니다. 서버가 필수 누락이나 구버전을
  거부하고 동의 시각을 기록합니다.
- `POST /auth/logout`: 서버 세션을 폐기하고 쿠키를 만료합니다. 프론트는 화면 데이터를 지우고 `#signup`으로 이동합니다.

모든 변경 요청은 `X-CSRF-Token`과 `Idempotency-Key`를 보냅니다. CSRF 토큰은 `/auth/session` 응답에서 받아
메모리에만 둡니다. 서버도 CSRF와 Origin을 검증해야 합니다.

다른 Origin에서 API를 제공하면 `Access-Control-Allow-Credentials: true`, 정확한 Origin, GET/POST/PUT/DELETE/OPTIONS,
`Content-Type`·`Idempotency-Key`·`X-CSRF-Token` 헤더를 허용해야 합니다. wildcard CORS로는 쿠키 인증이 되지 않습니다.
가능하면 같은 Origin의 `/api/v1` 리버스 프록시를 권장합니다.

## 4. API 목록

| 기능 | 조회 | 변경 |
|---|---|---|
| 세션 | `GET /auth/session` | `POST /auth/logout` |
| 약관 | `GET /legal/agreements/current` | `POST /legal/agreements` |
| 종목 | `GET /stocks/top-list` (구현됨) | - |
| 관심종목 | `GET /watchlist` | `PUT`/`DELETE /watchlist/{stockCode}` |
| 예측 | `GET /predictions/today`, `GET /predictions/history?cursor=&limit=20` | `POST /predictions` `{stockCode, direction}` |
| 예측권 | `GET /prediction-tickets` | 예측·광고 처리 때 서버가 갱신 |
| 결과 수령 | 예측 목록의 `status`, `points`, `claimed` | `POST /predictions/claim` `{predictionId}` |
| 포인트 | `GET /wallet`, `GET /wallet/transactions?cursor=&limit=20` | 서버 원장에서만 계산 |
| 출석·미션 | `GET /missions` | `POST /missions/attendance` `{}` |
| 교환 상품 | `GET /rewards/catalog` | 운영자 관리 |
| 교환 신청 | `GET /reward-claims?cursor=&limit=20` | `POST /reward-claims` `{rewardId, recipient: {phone, name}, agreementVersion}` |
| 보상형 광고 | - | `POST /ads/sessions`, `POST /ads/sessions/verify` `{sessionId}` |
| 10연승 리워드 | `GET /challenges/ten-wins/reward` | `POST /challenges/ten-wins/claims` |

- 응답은 JSON 직접 응답이 기준이고 `{ success: true, data: ... }` 형태도 처리합니다.
- 목록은 서버에서 최신순으로 정렬합니다. 첫 페이지는 20개를 권장하고, `nextCursor`가 있으면 이전 내역 조회 버튼(`[data-more]`)을 보여줍니다.
- `/predictions/today`에는 오늘 접수한 예측 전부와 최근 결과를 함께 넣습니다. 같은 종목 중복 제출을 화면에서 판단할 수 있어야 합니다.
- 포인트 내역의 전체/적립/사용 탭은 `amount`의 부호로 나눕니다. 교환 신청 내역도 사용 탭에 표시합니다.
- 종목 DTO의 `ticker`, `name`, `currentPrice`, `changeRate`를 사용합니다. 가격·등락률은 문자열로 오며,
  파싱에 실패하면 임의 값으로 채우지 않습니다. 시장 구분이 없으면 '국내 주식'으로 표시합니다.

## 5. 기능별 서버 규칙

### 5.1 예측

- **판정 기준**: 오늘 09:00~15:30에 예측을 받고, **다음 거래일 종가가 오늘 종가보다 올랐는지 내렸는지**로
  판정합니다. 금요일이나 휴장 전날에 한 예측은 다음 거래일(예: 월요일) 종가로 판정합니다.
- 예측 화면의 "조회 가격"은 참고용입니다. 판정 기준 가격은 서버가 확정한 오늘 종가입니다.
- 마감은 기기 시계가 아니라 서버 `serverTime`, `closesAt`, `status`로 판단합니다. 최종 판정도 서버가 합니다.
- 예측 저장과 예측권 차감은 한 트랜잭션입니다.
- 이미 제출함(`ALREADY_PREDICTED`), 마감(`PREDICTION_CLOSED`), 예측권 부족(`INSUFFICIENT_TICKETS`)을 다른 오류 코드로 구분합니다.
- 휴장, 거래정지, 상장폐지, 데이터 오류일 때의 `VOID` 처리와 예측권·포인트 복구 규칙을 정해야 합니다.
- `predictionCount`, `wonCount`는 결과가 확정된 예측만 셉니다. `VOID`는 제외합니다.

### 5.2 보상형 광고와 예측권

- 홈·예측권 화면의 `[data-reward-ad]` 버튼은 하단 안내창(`#reward-ad-dialog`)을 엽니다. "광고 시청하기"를 누르면
  `POST /ads/sessions`로 세션을 만들고 HTTPS `launchUrl`을 엽니다. 팝업이 막히면 직접 열기 링크를 제공합니다.
- 광고 제공자 콜백은 서버가 검증합니다. 사용자가 돌아오면 `POST /ads/sessions/verify`가 `status: VERIFIED`를
  반환해야 예측권을 다시 읽고 예측 화면으로 돌아갑니다. 예측을 자동 제출하지 않습니다.
- 확인 지연이나 네트워크 실패는 `#verify-ad`("시청 완료 다시 확인")로 다시 확인합니다.
- 클라이언트 타이머나 버튼 클릭만으로 보상을 지급하지 않습니다. 광고 완료, 예측권 발급, 중복 방지는 하나의
  멱등 트랜잭션입니다.
- 광고 SDK가 외부 링크 방식을 지원하지 않으면 `#start-reward-ad`와 `launchUrl` 계약을 네이티브 SDK 브리지로
  바꾸고 실기기에서 검증해야 합니다. 광고 사업자는 아직 정해지지 않았습니다.
- 홈의 AD 배너(`.home-ad-slot`, "오늘의 브랜드 · Candle")는 Candle 자체 홍보이며 종목 선택으로 이동합니다. 보상형 광고(`/ads/sessions`)와 별개이며
  클릭해도 보상을 주지 않습니다.

### 5.3 포인트와 교환

- 잔액만 저장하지 말고 원장(변경 이력)으로 관리합니다. 권장 원장 타입: `PREDICTION_REWARD`, `STREAK_BONUS`,
  `AD_REWARD`, `MISSION_REWARD`, `REWARD_EXCHANGE`, `EXCHANGE_CANCEL`, `ADMIN_ADJUSTMENT`, `EXPIRATION`.
- 결과 수령과 포인트 적립, 교환 접수와 포인트 차감은 각각 원자적 트랜잭션입니다.
- `rewardId`의 가격, 재고, 수령 동의 버전은 서버가 다시 확인합니다. 화면의 금액은 지급 근거가 아닙니다.
- 수령인 이름·번호는 폼 메모리에만 두고 브라우저 저장소나 로그에 남기지 않습니다. HTML은 `#payout` 화면을
  벗어나면 폼을 비웁니다.
- 지급 상태: `REQUESTED`, `PROCESSING`, `PAID`, `FAILED`, `REJECTED`, `CANCELED`.
- 개인정보는 전송·저장 구간에서 보호하고, 조회 응답은 마스킹하며, 관리자 접근 이력을 남깁니다.

### 5.4 10연승 리워드 (네이버페이)

화면 문구 기준 정책은 **"10연승 달성자 중 최고 적중률 1명에게 100만원"**입니다. 10연승만으로 지급이 확정되지 않습니다.
홈의 챌린지 버튼 → `#challenge` → "당첨 확인 · 리워드 수령" → `#challenge-reward` 순서로 들어가고,
내 정보의 "10연승 리워드"에서도 들어갑니다. 일반 포인트 교환(`/reward-claims`)과 별개이며 앱 포인트를 차감하지 않습니다.

`GET /challenges/ten-wins/reward`는 수령 화면에 들어갈 때만 따로 조회합니다. 초기 조회 7개에 넣지 않아서,
이 API가 없어도 다른 화면은 동작합니다.

| `status` | 화면 동작 |
|---|---|
| `NOT_ELIGIBLE` | 대상 아님 안내, 입력 폼 없음 |
| `AWAITING_DRAW` | 10연승 달성, 최종 선정 대기 안내 (이름은 예전 추첨 정책에서 유래) |
| `ELIGIBLE` | 당첨 안내, 지급 포인트·신청 기한·세금 안내·수령 입력·필수 동의 |
| `REQUESTED` | 신청 접수와 접수 번호. 지급 완료 문구는 쓰지 않음 |
| `PROCESSING` | 지급 처리 중 |
| `PAID` | 제공자 지급 결과 확인 후 완료 |
| `REJECTED` | 서버의 `statusNote`로 사유와 후속 절차 안내 |
| `EXPIRED` | 신청 기한 종료 |

주요 응답 필드:

- `awardId`: 서버가 발급한 당첨 건 ID. 대상이 없으면 `null`.
- `claimId`: 신청 전 `null`. 접수 이후 상태에서는 필수.
- `amount`: 액면 `1000000`. `payoutPoints`: 세무·운영 정책을 반영한 실제 지급 포인트.
- `method`: `NAVER_ID`(네이버 ID 직접 적립) 또는 `COUPON_SMS`(문자 쿠폰). 서버가 계약에 따라 고정합니다.
  현재 HTML은 `NAVER_ID` 화면만 있습니다.
- `serverTime`, `claimDeadline`, `taxNotice`, `deliveryNotice`, `statusNote`, `agreements`(`collection`, `provision`).

`ELIGIBLE`에는 당첨 ID, 기한, 수집·이용 동의가 필요하고, ID 직접 적립에는 제3자 제공 동의도 필요합니다.
응답이 부족하면 폼을 열지 않습니다. 계약이나 정책이 준비되지 않았으면 503을 반환합니다.

신청 요청 예시:

```json
{
  "awardId": "award-server-id",
  "method": "NAVER_ID",
  "recipient": { "naverId": "example_login_id" },
  "agreements": [
    { "id": "collection", "version": "approved-version", "accepted": true },
    { "id": "provision", "version": "approved-version", "accepted": true }
  ],
  "npayTermsConfirmed": true
}
```

쿠폰 방식은 `recipient: {"phone": "01012345678"}`이며 ID와 번호를 함께 보내지 않습니다. 금액, 회원 ID,
당첨 상태는 클라이언트가 보내지 않습니다. 성공 응답은 `{ "id": "claim-server-id" }`입니다.

서버 처리:

1. 세션·CSRF·Origin, 당첨 건 소유권, 선정 확정, 신청 기한, 세무·본인확인 선행 조건을 다시 검증합니다.
2. 지급 방식, 수령 정보 형식, 약관 버전과 필수 동의를 확인합니다. `npayTermsConfirmed`만으로 계정 검증을 생략하지 않습니다.
3. 당첨 건당 신청 하나만 받도록 고유 제약을 둡니다.
4. 같은 키·같은 본문이면 기존 ID를 반환하고, 본문이 바뀌면 `IDEMPOTENCY_CONFLICT`로 거부합니다.
5. 제공자 응답이나 정산을 확인한 뒤에만 `PAID`로 바꿉니다. 쿠폰은 발행·전달·등록 중 무엇을 `PAID`로 볼지 정합니다.

이 폼에서는 이름, 주소, 계좌번호, 주민등록번호, 신분증, 네이버 비밀번호를 받지 않습니다. 세무 신고에 필요한
정보는 세무 검토 후 별도 보안 절차에서 받습니다. 네이버 로그인으로 받은 서비스별 사용자 식별자는 지급용
네이버 로그인 ID와 같다고 가정하지 않습니다.

오류: `REWARD_NOT_ELIGIBLE`(403), `REWARD_EXPIRED`(409), `ALREADY_CLAIMED`(409), `RECIPIENT_INVALID`(400),
`AGREEMENT_REQUIRED`(400), `IDEMPOTENCY_CONFLICT`(409), `SESSION_EXPIRED`(401).

공식 자료 (2026-10-11 확인):

- [네이버페이 포인트 제휴](https://npayad.naver.com/point): 기업 지급은 ID 적립과 쿠폰 전달 방식이 있습니다.
- [공식 포인트 소개서](https://npayad.naver.com/api/files/202406-281549585/NAVERPAY_POINT.pdf): ID 방식은 고객 네이버 ID와
  개인정보 제3자 제공 동의가 필요합니다. 본문 표기는 2023.01이므로 한도·수수료·정산일은 계약 담당자에게 확인해야 합니다.
  네이버에 공개 지급 REST API가 있다고 가정하지 않습니다. 위 API는 Candle 자체 백엔드용입니다.
- [국세청 기타소득 원천징수 안내](https://d.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7893&mi=6457): 100만원에 임의로
  세율을 적용하지 않고, 승인된 `taxNotice`와 `payoutPoints`를 서버에서 받습니다.
- 네이버페이 로고는 [공식 로고 가이드](https://developers.pay.naver.com/design/brand/logo)의 원본을 사용했습니다.
  출시 전 제휴 계약과 로고 검수를 확인해야 합니다.

## 6. 멱등성과 오류

- 같은 키·같은 사용자·같은 본문 요청은 같은 결과를 반환합니다. 다른 본문에 같은 키가 오면 `IDEMPOTENCY_CONFLICT`입니다.
- 네트워크 오류 뒤 재시도는 같은 키를 다시 씁니다. 결과가 불확실한 요청에서 수령 정보를 바꿔 재시도하면 서버가 거절해야 합니다.
- 다른 탭이나 기기는 다른 키를 만들 수 있으므로, 서버는 키와 별도로 사용자/종목/회차, 사용자/출석일,
  보상/수령 중복을 제한합니다.
- 세션 만료(401)는 화면을 비우고 로그인을 요청합니다. 서버 원문 오류나 스택을 사용자에게 보여주지 않습니다.
- API가 실패해도 프론트는 데모 데이터로 바꾸지 않습니다. 변경 요청이 성공한 뒤 조회가 실패하면 재조회를 안내합니다.

오류 응답 형식:

```json
{ "success": false, "error": { "code": "PREDICTION_CLOSED", "message": "예측 참여 시간이 마감되었습니다.", "requestId": "req_123" } }
```

주요 오류 코드: `SESSION_EXPIRED`, `PREDICTION_CLOSED`, `ALREADY_PREDICTED`, `INSUFFICIENT_TICKETS`,
`INSUFFICIENT_POINTS`, `ALREADY_CLAIMED`, `AD_NOT_VERIFIED`, `AD_UNAVAILABLE`, `AGREEMENT_REQUIRED`,
`VALIDATION_ERROR`, `RATE_LIMITED`, `IDEMPOTENCY_CONFLICT`. 코드별 사용자 문구는 `reference/api-client.mjs`의 `errorMessage`에 있습니다.

## 7. 호스팅

`index.html`은 정적 파일로 올리면 됩니다. 빌드나 Node 서버가 필요 없습니다. `/api/v1`은 백엔드로 프록시하고,
API 요청에 HTML을 돌려주는 SPA fallback을 걸지 않습니다.

- HTTPS를 사용합니다. `crypto.randomUUID()`와 인증 요청은 보안 컨텍스트가 필요합니다.
- HTML에는 `Cache-Control: no-cache`, 개인정보 API 응답에는 `Cache-Control: no-store`를 둡니다.
- 권장 응답 헤더 (예전 빌드가 Cloudflare Pages용 `_headers`로 만들던 값):

  ```
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'
  ```

- 세션 쿠키는 HttpOnly·Secure, 로그인 제공자와 호스트 구성에 맞는 SameSite를 씁니다.
- 프론트 배포 버전과 백엔드 계약 버전을 함께 기록합니다. 장애 때 지급·예측을 재전송해서 복구하지 않고,
  서버의 멱등 키와 원장으로 처리 여부를 먼저 확인합니다.

## 8. 합의가 필요한 정책

### 8.1 화면 문구끼리 맞지 않는 부분

| 항목 | 현재 HTML | 정할 것 |
|---|---|---|
| 연승 조건 | 튜토리얼에 "적중률 50% 초과면 연승이 유지돼요", "하루 10회까지 참여" | 하루 여러 번 예측할 때 연승 판정 방법 |
| 예측권 | 튜토리얼 "접속하면 하루 1장", 예측권 화면 "기본 무료 1회 · 광고 예측권", 광고 하루 10회 | 기본 지급량, 광고 보상량, 하루 한도, 만료 시각 |
| 리워드 | 홈 "적중률 1위에게 100만원", 챌린지 "10연승 달성자 중 최고 적중률 1명" | 회차, 동률 처리, 중복 수상, 지급 시기 |
| 지급 수단 | 포인트 교환은 휴대폰 번호·이름, 10연승은 네이버 ID | 실제 계약 상품(ID 적립, 쿠폰 등)과 받을 정보 |

### 8.2 출시 전 반드시 정할 것 (P0)

- **로그인**: 카카오·네이버·Google·Apple 중 실제 지원 범위, 같은 이메일 계정 연결 규칙, 신규 사용자 판정,
  세션 수명과 갱신, 탈퇴와 재가입 정책, 앱 WebView의 redirect URI.
- **약관**: 약관 ID·버전·시행일, 동의 기록과 시각, 약관 개정 시 재동의 판단, 선택 동의 철회.
- **예측**: 오픈·마감·결과 공개 시각, 상태(`SCHEDULED`, `OPEN`, `CLOSED`, `SETTLED`, `VOID`), 제출 후 수정 불가.
- **결과와 포인트**: 종가 데이터 제공자와 확정 시각, 보합 처리, 데이터 정정 시 재계산, 적중 포인트(화면 예시 15P)·
  미적중 포인트(화면 예시 5P)·연승 보너스·광고 보상, 포인트 만료와 회수.
- **광고**: 광고 SDK, 서버 측 완료 검증(콜백 또는 서명), 세션 만료, 중복 콜백, 하루 한도, 부정 시청 차단.
- **교환 지급**: 계약 상품, 최소·최대 금액과 교환 비율, 수수료 부담, 실패·재지급, 신청 시 차감 시점, 운영자 검토 조건,
  지급 사업자 webhook 서명 검증, 법무·세무 검토.
- **10연승 리워드**: 선정 회차와 기준, 네이버페이 계약 방식, 100만원의 세전/세후 의미와 제세공과금 부담,
  승인된 동의문, 고객 문의 창구.

### 8.3 베타 전 정할 것 (P1)

- **종목·시세**: 데이터 공급자와 사용 권한, 실시간/지연 표기, 장애 시 처리, 휴장 캘린더 관리 주체.
- **연승·적중률 통계**: 계산식, `VOID` 처리, 최소 참여 횟수.
- **미션**: 출석 연속 일수 초기화 기준, 주간 미션 기간(시작 요일·시각), 미션 포인트.
- **관심종목**: 최대 개수, 상장폐지 종목 처리.
- **닉네임**: 길이·허용 문자, 금칙어, 변경 주기. (현재 HTML에는 닉네임 입력 화면이 없습니다.)

### 8.4 운영·보안

- 로그인, 예측, 광고 보상, 포인트 변경, 지급 신청의 감사 로그.
- API별 rate limit, 비정상 계정·기기 차단.
- 관리자 권한 분리, 지급 승인 2인 확인 여부.
- 개인정보 마스킹, 접근 기록, 백업·복구, 삭제 요청 처리.
- 모니터링: 로그인 실패율, 예측 제출 실패율, 광고 검증 실패율, 원장 불일치, 지급 실패·지연.

## 9. 스테이징에서 확인할 흐름

1. 신규·기존 계정 로그인, 제공자 취소·실패, 세션 만료, 로그아웃 후 뒤로가기.
2. 필수 약관 누락·구버전 거절과 동의 기록.
3. 개장·마감·휴장·자정, 중복 탭, 다른 기기에서 같은 종목 동시 제출.
4. 적중·미적중·보합·무효 결과, 중복 수령 방지, 원장과 잔액 일치.
5. 광고 취소·실패·만료, 완료 콜백 지연, 중복 콜백, 하루 한도.
6. 교환 잔액 부족·품절·수령 정보 오류·동시 신청·타임아웃 후 재시도, 지급 실패와 환불 원장.
7. 10연승 리워드의 상태별 화면, 기한 만료, 중복 신청.
8. Android/iOS WebView의 쿠키, 외부 로그인, 광고 복귀, 키보드, safe area.
