# 배포와 실제 출시 점검

## 산출물 생성

```sh
npm ci
npm run check
# 별도 API Origin을 쓰는 경우
CANDLE_API_BASE_URL=https://api.example.com/api/v1 npm run build
```

`dist/`만 정적 호스팅에 업로드한다. 소스 저장소 루트, `pages/`, 테스트 서버를 웹 루트로 배포하지 않는다. 빌드는 항상 API 모드를 설정한다. API 요청에 프론트 HTML을 반환하는 SPA fallback을 적용하면 안 된다. `/api/v1`은 실제 서버로 프록시하고 나머지 자산은 정적 파일로 제공한다. 별도 번들러나 Node 운영 서버는 필요하지 않다.

로컬 검증은 배포 승인이 아니다. 이 작업에서는 GitHub push까지만 수행하며 외부 사이트 배포는 수행하지 않는다.

## 호스팅 설정

- HTTPS를 사용한다. `crypto.randomUUID()`와 인증/개인정보 요청은 보안 컨텍스트에서 동작해야 한다.
- `config.js`, HTML, JavaScript/CSS는 재검증하도록 `Cache-Control: no-cache`를 적용한다. 이전 탭이 옛 스타일을 계속 쓰던 문제를 방지한다.
- `dist/_headers`는 이를 지원하는 정적 호스팅용 예시다. 다른 서버에서는 `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` 및 CSP 지시문을 직접 설정한다. `_headers` 파일 존재만으로 모든 호스팅에 적용되지는 않는다.
- API는 개인정보 응답에 `Cache-Control: no-store`를 설정한다. 세션 쿠키는 HttpOnly·Secure 및 로그인 제공자/호스트 구성에 맞는 SameSite를 사용한다.
- 쿠키가 포함되는 교차 출처 요청은 정확한 Origin과 credentials, GET/POST/OPTIONS, `Content-Type`, `Idempotency-Key`, `X-CSRF-Token`을 허용한다. 가능하면 같은 Origin의 `/api/v1` 프록시를 사용한다.
- CSP 예시는 임베딩, base URL 변경, object 실행을 제한한다. 전체 script-src 정책은 현재 inline 진입점 리다이렉트와 스타일, 외부 Google Fonts를 고려해 호스트에서 해시/nonce와 허용 Origin을 구성한 뒤 검증한다.
- Google Fonts가 차단돼도 시스템 글꼴로 표시된다. 실제 배포 지역에서 네트워크 성능을 측정한 뒤 폰트 자체 호스팅 여부를 결정한다.

## 스테이징에서 반드시 검증할 실제 흐름

1. 신규/기존 계정 로그인, 제공자 취소/실패, 세션 만료, 로그아웃 후 뒤로가기.
2. 필수 약관 누락/구버전 거절과 서버 동의 기록.
3. 개장/마감/휴장/자정, 중복 탭, 서로 다른 기기의 같은 종목 동시 제출.
4. 정답/오답/보합/무효 결과와 중복 수령 방지, 원장과 잔액 일치.
5. 광고 취소/실패/만료/완료 콜백 지연, 중복 콜백, 하루 제한.
6. 교환 부족 잔액/품절/수령 정보 오류/동시 신청/타임아웃 후 재시도, 지급 실패 및 환불 원장.
7. 실제 Android/iOS WebView의 쿠키·외부 로그인·광고 복귀·키보드·safe area·접근성. 현재 자동 테스트는 Chromium이며 실기기 검증을 대신하지 않는다.
8. 승인된 약관, 개인정보 처리/삭제 요청 창구, 고객 문의 및 장애 대응 책임자.

## 복구

프론트 배포 버전과 백엔드 계약 버전을 함께 기록한다. 장애 시 직전 검증된 `dist` 산출물로 롤백하고, 지급·예측을 재전송해 복구하지 않는다. 서버의 멱등 키와 원장으로 처리 여부를 먼저 조회한다. 데모 모드를 운영 장애 대응용으로 켜지 않는다.
