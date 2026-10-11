# Candle

주식 방향을 예측하고 예측권·포인트·리워드를 관리하는 모바일 웹 프론트엔드입니다. **Core Flow가 실제 사용자 앱의 진입점**입니다. `/`와 `/core-flow.html`은 같은 앱을 열며, 개발용 화면 선택 메뉴는 없습니다. 로그인, 하단 메뉴와 각 화면의 행동 버튼으로 이동합니다.

화면 디자인과 사용자 흐름은 구현되어 있습니다. **실제 서비스 출시에는 인증·예측·정산·광고·지급 백엔드 연결 및 스테이징 검증이 필요합니다.** 로컬 모의 응답으로 통과한 검사를 실제 제공자 연동 완료로 해석하지 마세요.

## 1. 실행과 배포

Node.js 22 이상을 사용합니다.

```sh
npm ci
npx playwright install chromium
npm run dev
```

`http://127.0.0.1:4173/`에서 확인합니다. 최초 방문은 로그인, 로그인했지만 필수 동의가 남은 사용자는 약관, 가입을 마친 사용자는 홈을 엽니다. 기존 `core-flow.html#signup` 등의 주소도 유지합니다.

| 명령 | 용도 |
|---|---|
| `npm run dev` | 4173 포트. 브라우저에 저장되는 로컬 데이터로 사용자 흐름 확인 |
| `npm run dev:contract` | 4174 포트. HTTP·쿠키·CSRF를 사용하는 로컬 계약 서버 |
| `npm test` | 원장·서비스·API 클라이언트·OpenAPI 계약 검사 |
| `npm run test:e2e` | Chromium에서 화면·사용자 흐름·실패 복구 검사 |
| `npm run build` | `dist/`에 운영용 정적 파일 생성 |
| `npm run check` | 포맷, 단위·계약 검사, 빌드, 브라우저 검사 순서로 실행 |

계약 서버는 `http://127.0.0.1:4174/?mode=api`로 접근합니다. 실제 OAuth나 지급 사업자를 호출하지 않는 **개발용 서버**이며 배포하지 않습니다. 로컬 미리보기의 잔액·종목 가격·광고 타이머·약관 예제는 운영 데이터가 아닙니다. 실제 개인정보를 로컬 지급 폼에 입력하지 마세요.

운영 빌드:

```sh
# 동일 Origin의 /api/v1로 백엔드를 프록시하는 경우
npm run build

# 별도 백엔드 주소를 사용하는 경우: 예시 도메인을 실제 주소로 교체
CANDLE_API_BASE_URL=https://api.example.com/api/v1 npm run build
```

**`dist/`만 배포합니다.** 운영 빌드는 항상 API 모드이고, 로컬 데이터 어댑터·구형 페이지·개발 서버·테스트는 제외합니다. 브라우저 모듈을 그대로 제공하므로 `.mjs`를 JavaScript MIME type으로 제공해야 합니다. 해시 라우팅을 사용하므로 화면별 서버 rewrite는 필요하지 않습니다. `/api/v1` 응답에 HTML fallback을 적용하지 마세요.

루트의 `config.js`는 개발 환경 설정입니다. `mode: 'api'`, `apiBaseUrl`, `requestTimeoutMs`를 설정할 수 있습니다. 빌드는 이 파일을 복사하지 않고 API 모드의 설정을 새로 생성합니다. 로컬 호스트 밖에서는 모의 데이터 모드를 허용하지 않으며, API 장애 시에도 모의 데이터로 대체하지 않습니다. 공개 설정에 OAuth 비밀키나 액세스 토큰을 넣지 마세요.

## 2. 실제 이용 흐름과 화면별 코드

1. 신규 사용자는 간편 로그인 후 필수 약관을 읽고 동의하면 홈으로 이동합니다.
2. 홈 또는 예측 메뉴에서 종목과 상승·하락 방향을 고릅니다. 예측 확인에서 남은 예측권을 확인한 뒤 제출하고 서버 접수 내역을 봅니다.
3. 예측권이 부족하면 예측권 화면에서 광고를 시작합니다. 시청 검증 후 예측권을 다시 조회합니다.
4. 예측 결과에서 확정된 보상을 수령하고 포인트 내역을 확인합니다. 출석 보상은 미션 메뉴에서 받습니다.
5. 상점에서 상품을 선택하고 차감 포인트를 확인합니다. 수령 정보와 지급 동의를 입력한 뒤 신청하면 교환 내역에서 처리 상태를 확인합니다.
6. 내 정보에서 예측·포인트·교환 내역과 약관을 확인하고 로그아웃합니다.

화면 구현은 `src/js/screens/`의 독립 모듈입니다. URL의 `#` 뒤 이름이 라우트 ID입니다. 각 모듈은 `render(context)`로 화면을 만들며, API 호출이나 포인트 계산을 직접 수행하지 않습니다.

| 주소 | 화면 파일 | 진입·역할 |
|---|---|---|
| `#signup` | [signup.mjs](src/js/screens/signup.mjs) | 비로그인 진입, 서버가 활성화한 간편 로그인 제공자 |
| `#consent` | [consent.mjs](src/js/screens/consent.mjs) | 필수 동의가 필요한 계정의 가입 단계 |
| `#home` | [home.mjs](src/js/screens/home.mjs) | 10연승 안내·포인트·광고·종목·방향 선택 |
| `#challenge` | [challenge.mjs](src/js/screens/challenge.mjs) | 10연승 달성자 대상 추첨 리워드 안내 |
| `#stock-select` | [stock-select.mjs](src/js/screens/stock-select.mjs) | 종목 변경, 검색·시장 필터 |
| `#prediction` | [prediction.mjs](src/js/screens/prediction.mjs) | 방향과 예측권 확인 |
| `#confirm` | [confirm.mjs](src/js/screens/confirm.mjs) | 제출 직전 확인 |
| `#submitted` | [submitted.mjs](src/js/screens/submitted.mjs) | 서버에 접수된 예측 표시 |
| `#pass` | [pass.mjs](src/js/screens/pass.mjs) | 기본·광고 예측권, 광고 참여 한도 |
| `#ad` | [ad.mjs](src/js/screens/ad.mjs) | 광고 열기, 완료 검증 |
| `#result` | [result.mjs](src/js/screens/result.mjs) | 확정 결과 및 보상 수령 |
| `#missions` | [missions.mjs](src/js/screens/missions.mjs) | 출석·활동 미션 |
| `#shop` | [shop.mjs](src/js/screens/shop.mjs) | 교환 상품과 보유 포인트 |
| `#exchange` | [exchange.mjs](src/js/screens/exchange.mjs) | 상품·잔액 확인 |
| `#payout` | [payout.mjs](src/js/screens/payout.mjs) | 수령 정보 및 동의 입력 |
| `#history` | [history.mjs](src/js/screens/history.mjs) | 교환 접수·진행·지급 상태 |
| `#profile` | [profile.mjs](src/js/screens/profile.mjs) | 회원 및 내역 메뉴 |
| `#prediction-history` | [prediction-history.mjs](src/js/screens/prediction-history.mjs) | 예측 내역, 이전 내역 조회 |
| `#wallet` | [wallet.mjs](src/js/screens/wallet.mjs) | 포인트 원장, 이전 내역 조회 |
| `#settings` | [settings.mjs](src/js/screens/settings.mjs) | 약관·로그아웃 |
| `#legal` | [legal.mjs](src/js/screens/legal.mjs) | 선택한 약관 또는 지급 동의 본문 |
| `#splash` | [splash.mjs](src/js/screens/splash.mjs) | 기존 시작 링크를 위한 브랜드 화면; 기본 진입에서는 생략 |

비로그인 보호 경로는 로그인으로, 필수 동의 미완료 계정은 약관으로 이동합니다. URL만 입력해서 선택 정보가 필요한 확인·지급 화면에 접근하면 종목/상품 선택을 안내합니다. 수령 정보는 화면 메모리에만 보관하므로 새로고침 시 재입력해야 합니다.

| 코드 | 책임 |
|---|---|
| [core-flow.html](core-flow.html) | 앱의 HTML 진입점 |
| [src/js/screens/index.mjs](src/js/screens/index.mjs) | 라우트·제목·화면 모듈 등록 |
| [src/js/core-flow.js](src/js/core-flow.js) | 세션 보호, 공통 컴포넌트, 이벤트, 변경 요청과 새로고침 |
| [src/js/ui/icons.mjs](src/js/ui/icons.mjs) | 기존 내비게이션과 선 굵기를 맞춘 공통 SVG 아이콘 |
| [src/js/ui/results-list.mjs](src/js/ui/results-list.mjs) | 결과·예측 내역이 공유하는 목록 |
| [src/js/candle-service.mjs](src/js/candle-service.mjs) | 백엔드 경로, 응답 검증, 종목 DTO 변환 |
| [src/js/api-client.mjs](src/js/api-client.mjs) | 쿠키·CSRF·멱등 키·타임아웃·오류 코드 |
| [src/css/core-flow.css](src/css/core-flow.css) | 전체 화면·버튼·반응형·safe area 스타일 |
| `src/js/demo-service.mjs`, `prediction-ledger.mjs` | 로컬 개발 전용 어댑터와 원장; 운영 산출물 제외 |

내부 `demo` 식별자와 저장 키는 기존 로컬 기록 호환용입니다. 서비스 화면에는 해당 이름이나 화면 선택 패널을 표시하지 않습니다. 과거 `pages/`, `src/js/services/api.js`는 현재 앱 경로에 연결되지 않습니다. 구형 `USE_MOCK` 설정을 바꿔도 이 앱에는 적용되지 않습니다.

네이버페이 상품 로고는 공식 배포 SVG를 사용합니다. 출처·원본 파일·사용 위치와 출시 전 제휴 검수 확인은 [브랜드 자산 기록](docs/BRAND_ASSETS.md)에 정리했습니다.

### 홈의 연승 안내와 광고 영역

기존 Core Flow 디자인의 순서인 **10연승 안내, 포인트 카드, AD 배너, 종목 카드**를 유지합니다. 백엔드 미연결을 이유로 이 영역을 화면에서 삭제하지 않습니다.

- 연승 문구는 기존 디자인의 ‘10연승하고 100만원 리워드에 도전’과 ‘달성자 중 추첨’을 유지합니다. 클릭하면 `#challenge` 안내를 열고 예측·결과 화면으로 이동할 수 있습니다. 현재 연승 수나 당첨 여부를 임의로 만들거나, 포인트 교환 신청을 연승 리워드 신청으로 취급하지 않습니다.
- 실제 연승 판정, 추첨 회차·기간·선정 인원, 신청 자격·지급 상태는 백엔드에서 제공해야 합니다. 현재 상세 화면은 안내이며 추첨/지급 처리는 구현되어 있지 않습니다. 출시 전에 운영 정책과 API를 확정해야 합니다.
- AD 배너는 기존 파란 그라데이션과 ‘하루 1분, 금융 감각을 키우는 습관’ 문구를 유지합니다. 현재 광고주는 Candle 자체이고 클릭하면 예측 화면으로 이동합니다. 클릭만으로 예측권이나 포인트를 지급하지 않습니다.
- 외부 광고 도입 시 광고 소재·광고주 표시·랜딩 주소·노출/클릭 집계 계약을 연결해야 합니다. 홈페이지 배너와 `/ads/sessions`의 보상형 영상 광고는 별개입니다. 광고 사업자가 미정이어도 배너의 자리와 디자인은 보존합니다.

## 3. 백엔드 팀: 먼저 확인할 구현 범위

연동 계약의 기준은 [docs/openapi.json](docs/openapi.json)입니다. 요청/응답의 정확한 타입·필수값·예제·오류 구조가 들어 있습니다. [상세 연동 가이드](BACKEND_INTEGRATION_GUIDE.md)도 함께 확인하세요.

로컬 `Candle-backend` 소스에서 구현을 확인한 것은 주식 조회 컨트롤러입니다. 프론트가 사용하는 `GET /api/v1/stocks/top-list` 외의 아래 인증·포인트·예측·지급 경로는 **제안 계약이며 실제 백엔드 구현 완료를 확인하지 않았습니다.** 프론트의 성공 화면이나 계약 서버 응답만으로 구현 여부를 판단하면 안 됩니다.

### 연결 순서

1. `/auth/session`, `/legal/agreements/current`를 먼저 연결합니다. 앱 초기화 시 두 경로를 함께 요청합니다.
2. 로그인 제공자 시작 경로와 콜백, 필수 약관 저장을 연결합니다.
3. 로그인·동의 완료 후 필요한 7개 조회 경로를 모두 연결합니다. 일부가 실패하면 앱은 초기 데이터 오류·재시도 화면을 표시합니다.
4. 예측·출석·수령·교환·광고 변경 경로를 연결합니다. 각 변경 후 서버 데이터를 다시 읽습니다.
5. 스테이징에서 쿠키, CORS, 중복 요청, 마감, 지급 및 광고 실패 흐름을 검증합니다.

### 필수 조회 API

모든 경로의 접두사는 `/api/v1`입니다.

| 메서드·경로 | 응답에서 사용하는 핵심 데이터 | 확인사항 |
|---|---|---|
| `GET /auth/session` | `providers`, `user`, `csrfToken` | 비로그인은 HTTP 200, `user:null`. 로그인 시 `id`, `nickname`, `consentRequired` 및 CSRF 토큰 필수 |
| `GET /legal/agreements/current` | `items[{id,title,version,body,required}]` | 필수 항목 포함. 승인된 본문을 일반 텍스트로 제공 |
| `GET /stocks/top-list` | `[{ticker,name,currentPrice,changeRate}]` | 기존 Spring DTO. 6자리 코드와 유효한 가격·등락률 필요 |
| `GET /prediction-tickets` | `free`, `ad`, `adCount`, `adLimit` | 모두 0 이상의 정수, 사용/잔여 한도 일치 |
| `GET /predictions/today` | `status`, `serverTime`, `closesAt`, `items`, `nextCursor` | 오늘 제출한 모든 종목 포함. 중복 제출 판단에 사용 |
| `GET /wallet` | `balance`, `items`, `nextCursor` | 잔액 및 최신 포인트 원장 |
| `GET /missions` | `attended`, `streak`, `items[{title,points,complete}]` | 보상 지급 상태를 서버가 계산 |
| `GET /rewards/catalog` | `items[{id,title,points,amount,available,deliveryNotice,agreementVersion,agreementBody}]` | 품절 여부, 실제 지급 안내, 동의 버전 |
| `GET /reward-claims` | `items[{id,title,points,status,createdAt}]`, `nextCursor` | 접수와 실제 지급 완료를 구분 |

이전 내역은 `/predictions/history`, `/wallet/transactions`, `/reward-claims`에 `cursor`와 `limit=20`을 전달합니다. 최신순으로 반환하고 마지막 페이지의 `nextCursor`는 `null`입니다. 프론트는 ID로 중복 항목을 제외합니다.

예측 항목은 `id`, `stockCode`, `stockName`, `direction(up/down)`, `ticket(free/ad)`, `status(PENDING/WON/LOST/VOID)`, `today`, `points`, `claimed`를 포함합니다. 회차 상태는 `OPEN/CLOSED/SCHEDULED`입니다. 서버 시각과 마감 시각은 타임존을 포함한 ISO 문자열이어야 합니다. 포인트 원장 항목은 `id`, `title`, 정수 `amount`, `createdAt`입니다.

### 인증 및 변경 API

| 메서드·경로 | 요청 본문 또는 쿼리 | 완료 기준 |
|---|---|---|
| `GET /auth/{provider}/start` | `returnTo` 쿼리 | OAuth 완료 후 허용된 프론트 주소로 복귀, 세션 쿠키 발급 |
| `POST /legal/agreements` | `agreements:[{id,version,accepted}]` | 필수·버전 확인 후 회원 `consentRequired:false` |
| `POST /predictions` | `{stockCode,direction}` | 응답 `id`, 접수 내역과 예측권 차감 |
| `POST /predictions/claim` | `{predictionId}` | 결과 중복 수령 방지, 원장 증가 |
| `POST /missions/attendance` | `{}` | 일자별 출석 한 번, 보상 원장 반영 |
| `POST /reward-claims` | `{rewardId,recipient:{phone,name},agreementVersion}` | 응답 `id`, 접수 내역과 잔액 차감 |
| `POST /ads/sessions` | `{}` | 응답 `id`, HTTPS `launchUrl` |
| `POST /ads/sessions/verify` | `{sessionId}` | 제공자 콜백 확인 후 `status:"VERIFIED"` |
| `POST /auth/logout` | `{}` | 서버 세션 폐기와 쿠키 만료 |

성공 응답은 JSON 객체 또는 `{success:true,data:...}`를 지원합니다. ID를 필요로 하는 생성 경로는 빈 응답을 반환하지 마세요. 실패는 적절한 HTTP 상태와 `{"success":false,"error":{"code":"INSUFFICIENT_POINTS"}}` 형태의 안정된 코드를 반환합니다. 원문 예외 메시지는 사용자에게 노출하지 않습니다.

### 인증·원장·실패 처리 확인사항

- 세션 쿠키는 서버가 발급하며 운영에서는 HttpOnly·Secure와 배포 구조에 맞는 SameSite를 설정합니다. 프론트는 `credentials: include`를 사용합니다. 토큰을 URL이나 브라우저 저장소로 전달하지 않습니다.
- 모든 POST에는 `X-CSRF-Token`과 `Idempotency-Key`가 포함됩니다. CSRF 토큰은 `/auth/session`에서 받아 메모리에만 보관합니다. 서버의 CSRF·Origin 검증도 필요합니다.
- 다른 Origin이면 정확한 프론트 Origin, credentials, GET/POST/OPTIONS, Content-Type 및 위 두 헤더를 CORS에 허용하세요. 현재 백엔드의 wildcard 설정만으로 쿠키 인증이 연결되지는 않습니다.
- 같은 사용자·키·본문은 기존 처리 결과를 반환해야 합니다. 같은 키에 다른 본문은 `IDEMPOTENCY_CONFLICT`로 거부합니다. 키 외에도 사용자/종목/회차, 출석일, 결과 수령의 고유 제약이 필요합니다.
- 예측 접수와 예측권 차감, 결과 수령과 포인트 적립, 교환 접수와 잔액 차감은 각각 한 트랜잭션으로 처리합니다. 클라이언트 잔액·가격·마감 표시를 권한 근거로 사용하지 않습니다.
- 네트워크 결과가 불확실하면 프론트는 같은 탭에서 보류 키를 유지하고 수동 재시도에 재사용합니다. 지급 재시도 키에는 상품 ID만 남기며 이름·전화번호는 저장하지 않습니다. 수령 정보가 달라지면 서버가 충돌을 확인해야 합니다.
- 401은 보호 화면을 비우고 로그인으로 이동합니다. 주요 업무 코드는 `PREDICTION_CLOSED`, `ALREADY_PREDICTED`, `INSUFFICIENT_TICKETS`, `INSUFFICIENT_POINTS`, `ALREADY_CLAIMED`, `AD_NOT_VERIFIED`, `AD_UNAVAILABLE`, `AGREEMENT_REQUIRED`, `VALIDATION_ERROR`, `RATE_LIMITED`입니다.
- 교환 상태는 `REQUESTED/PROCESSING/PAID/FAILED/REJECTED/CANCELED`를 지원합니다. 실패·취소 시 포인트 환불과 사업자 중복 발송 방지는 서버에서 처리해야 합니다.
- 수령 폼은 현재 `010` + 8자리 전화번호와 2~40자 이름을 요구합니다. 최종 지급 사업자의 요구사항과 대조하세요. 브라우저에 수령 정보를 영구 저장하거나 로깅하지 않습니다.
- 광고는 HTTPS 외부 창을 열고 복귀 후 완료를 확인합니다. 서버가 제공자 콜백을 검증해야 합니다. 네이티브 광고 SDK를 선택하면 브리지와 실기기 복귀 처리를 추가해야 하며, 현재 외부 링크 구현이 SDK 연동을 대신하지 않습니다.

## 4. 출시 전에 사용자·팀이 정해야 할 항목

아래 항목은 임의로 만들 수 없어 미확정 상태로 남깁니다. 결정되면 해당 설정·API·화면에 반영해야 합니다. **키·비밀값은 채팅이나 프론트 저장소에 넣지 않고 백엔드의 비밀값 관리 환경에 등록하세요.**

| 필요한 결정/자료 | 담당 | 반영 위치·출시 확인 |
|---|---|---|
| 스테이징·운영 프론트/API 도메인, 호스팅 대상 | 프로젝트 책임자·인프라 | API 주소, HTTPS, CORS, 쿠키, OAuth returnTo 허용 목록 |
| 출시할 간편 로그인 제공자, 앱 등록 및 콜백 URL | 프로젝트 책임자·백엔드 | `/auth/session.providers`와 서버 OAuth. 실제 로그인·취소·복귀 검사 |
| 예측 대상·회차·마감·휴장·보합·무효 처리, 보상 정책 | 기획·백엔드 | 예측·정산·예측권 API. 현재 로컬 값은 출시 정책으로 확정된 것이 아님 |
| 광고 사업자 및 웹/네이티브 SDK 방식 | 프로젝트 책임자·앱·백엔드 | 세션 발급, 완료 콜백 검증, 취소·중복·한도 검사 |
| 지급 사업자, 상품, 발송 시점, 실패·취소·환불 기준 | 운영·백엔드 | 상품·지급 API와 안내 문구. 실제 소액 지급·실패 시나리오 검사 |
| 승인된 약관·개인정보·연령 정책, 지급 동의 본문 | 서비스 책임자 | 약관 API. 예제 본문을 운영용으로 배포하지 않음 |
| 고객 문의 주소, 회원 탈퇴·개인정보 삭제 처리 정책/API | 운영·백엔드 | 설정 화면에 실제 문의·탈퇴 동작 추가 필요. 현재는 약관·로그아웃까지 구현 |
| 웹 출시인지 Android/iOS WebView 동시 출시인지 | 프로젝트 책임자·앱 | OAuth·광고 외부 창, 쿠키, 키보드, safe area, 뒤로가기 실기기 검사 |
| 오류 수집 도구·운영 담당·장애 대응 채널 | 운영·개발 | 개인정보 제외한 오류 관측 및 롤백 체계 추가·검증 |

## 5. 인수·출시 검증 체크리스트

- [ ] 실제 백엔드에서 필수 조회 API와 응답 스키마가 모두 일치한다.
- [ ] 신규/기존 로그인, 취소, 필수 동의, 재방문, 로그아웃, 세션 만료를 확인했다.
- [ ] 예측 중복 클릭·탭·기기, 마감 경계, 예측권 소진을 서버에서 거부한다.
- [ ] 정산·수령·출석 후 잔액과 원장이 일치하며 중복 보상이 없다.
- [ ] 광고 취소·완료·지연·중복 콜백에서 예측권이 정확하게 반영된다.
- [ ] 교환 품절·잔액 부족·잘못된 정보·네트워크 중단·재시도·실패 환불을 확인했다.
- [ ] 승인 약관, 고객 문의, 탈퇴/삭제 절차가 최종 제품에 연결되어 있다.
- [ ] 운영 산출물에 로컬 서버·어댑터·비밀값이 없고, 실제 호스트의 캐시·CORS·보안 헤더를 확인했다.
- [ ] 지원 대상 브라우저/실기기에서 화면·터치·키보드·외부 로그인·광고 복귀를 확인했다.
- [ ] 오류 관측, 담당자, 롤백 버전과 배포 기록을 준비했다.

브라우저 자동 검사는 로그인부터 예측·수령·교환까지 실제 버튼으로 진행합니다. 추가로 22개 화면을 10개 화면 크기에서 검사하고, 개발용 문구·메뉴의 부재와 상승 화살표 대비도 확인합니다. API 검사는 로컬 계약 서버를 사용합니다. 실제 OAuth·광고·지급, Safari, Android/iOS 실기기는 별도 인수 검증 대상입니다.

검사 결과는 `test-results/results.json`, 화면 캡처는 `test-results/*.png`에 생성됩니다. 마지막 공유 결과는 [docs/verification.json](docs/verification.json), 배포·복구 절차는 [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), 출시 범위는 [docs/RELEASE_PLAN.md](docs/RELEASE_PLAN.md)를 참조하세요.
