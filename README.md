# Candle 프론트엔드

주식 방향 예측, 예측권, 포인트·리워드 교환을 위한 Vanilla JavaScript 앱입니다. `/`와 `/core-flow.html`은 같은 Core Flow 화면을 엽니다. 데모와 API 모드는 화면 코드를 공유합니다.

```sh
npm ci
npm run dev
# http://127.0.0.1:4173/
```

Node.js 22 이상을 사용합니다. 개발 서버는 로컬 주소에만 열립니다. `config.js`는 공개 런타임 설정이며 비밀키를 넣지 않습니다.

- 로컬 기본 모드: 데모. 실제 로그인·광고·지급은 발생하지 않습니다.
- 로컬 계약 검증: `npm run dev:contract`, `http://127.0.0.1:4174/?mode=api`. 별도 서버 구현을 대신하는 개발 시뮬레이터입니다.
- 실제 서버 연결: `config.js`의 `mode: 'api'`, `apiBaseUrl`을 서버의 `/api/v1` 주소로 설정합니다. 운영 호스트에서 데모 모드는 허용하지 않습니다.
- 운영 빌드: `npm run build`. `dist/`만 배포합니다. 빌드는 항상 API 모드이며 구형 페이지, 데모 어댑터, 테스트 서버를 포함하지 않습니다.

```sh
npm test
npx playwright install chromium
npm run test:e2e
npm run build
# 또는 npm run check
```

브라우저 테스트는 임시 포트의 서버와 독립 브라우저를 생성합니다. macOS에서 Chrome이 있으면 이를 사용하고, 다른 환경에서는 Playwright Chromium을 사용합니다. 결과와 스크린샷은 `test-results/`에 저장됩니다. CI도 같은 검증을 실행합니다.

## 코드와 문서

- `src/js/core-flow.js`: 공통 화면, 라우팅, 비동기 작업 상태.
- `src/js/candle-service.mjs`: API 계약, 서버 데이터 검증, 실제 종목 응답 변환.
- `src/js/api-client.mjs`: 세션 쿠키, CSRF, 타임아웃, 오류, 멱등 키 전송.
- `src/js/demo-service.mjs`: 브라우저 데모 전용 데이터/원장. 운영 빌드 제외.
- [출시 준비 계획과 검증 기록](docs/RELEASE_PLAN.md)
- [백엔드 연동 가이드](BACKEND_INTEGRATION_GUIDE.md)
- [OpenAPI 계약](docs/openapi.json)
- [운영 배포 체크리스트](docs/DEPLOYMENT.md)

`pages/`와 `src/js/services/`는 이전 버전의 자료로 보존합니다. 최신 앱에서는 로드하지 않으며 운영 빌드에 포함하지 않습니다. 이전 `PROJECT_GUIDE.md`의 화면/서비스 설명 대신 이 README와 최신 연동 가이드를 사용하세요.

## 출시 상태

프론트와 계약 시뮬레이터 검증은 실제 운영 백엔드 검증과 다릅니다. 조사한 로컬 백엔드에는 종목 API만 구현되어 있습니다. 인증·약관·예측·광고·지급 API 구현, 실제 제공자 등록, 승인된 운영 정책과 스테이징 검증이 끝나기 전에는 실제 서비스 출시 완료로 간주하지 않습니다.
