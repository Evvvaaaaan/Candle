# Candle 변경 이력

최신 항목이 위에 있습니다. 자세한 내용은 git 기록을 참고하세요.

## 2026-10-26 — 전달 후 화면 다듬기

- 진입 경로가 없던 접수 내역(`#submitted`)과 결과(`#result`) 화면을 삭제했습니다. 화면은 19개입니다.
  지난 예측 결과 창의 "내 예측 결과 확인"은 예측 내역으로 이동합니다.
- 포인트 상점을 라디오 목록과 하단 고정 "교환하기" 버튼으로 바꿨습니다. 3만 원권을 추가해 상품은 5개이고,
  잔액보다 비싼 상품은 비활성화하고 부족한 포인트를 표시합니다.
- 예측권 화면의 광고 참여 현황을 광고 카드 안의 진행 막대로 합치고, 광고 하루 한도를 10회로 올렸습니다.
- 포인트 내역의 빈 상태를 예시 7건으로 바꾸고 전체/적립/사용 탭을 금액 부호로 나눴습니다. 사용 금액은 빨간색으로 표시합니다.
- 섹션 제목을 16px로 줄이고, 미션 상태 라벨을 빼고, 포인트 카드 배경을 `--surface`로 바꿨습니다.
- `README.md`, `docs/BACKEND.md`를 위 변경에 맞게 고쳤습니다.

## 2026-10-26 — 전달용 정리

백엔드 전달을 위해 `index.html` 하나만 남기고 정리했습니다.

- 앱은 `index.html` 하나입니다. 내용이 같던 `core-flow.html`은 삭제했습니다.
- 삭제: 예전 프로토타입(`pages/`, `src/`), 개발 도구(`scripts/`, `tests/`, `.github/`, `package.json`, `config.js`), 사용하지 않는 `Candle.png`.
- 문서 통합
  - `README.md`: 기존 README, `PROJECT_GUIDE.md`, `docs/BRAND_ASSETS.md`
  - `docs/BACKEND.md`: `BACKEND_INTEGRATION_GUIDE.md`, `BACKEND_DISCUSSION_CHECKLIST.md`, `docs/NAVER_PAY_REWARD.md`, `docs/DEPLOYMENT.md`, `docs/LEGACY_RUNTIME.md`
  - `docs/RELEASE_PLAN.md`, `docs/verification.json`, `docs/screenshots/`는 예전 점검 기록이라 삭제했습니다.
- `docs/BACKEND.md`에 HTML 연동 지점(`requireServer` 호출, `data-server-value` 자리, 고정 목록)을 정리했습니다.
- `docs/openapi.json`을 현재 화면에 맞췄습니다. 적중 통계(`predictionCount`, `wonCount`), 미션 진행도(`period`, `progress`, `goal`), 관심종목 API(`/watchlist`)를 추가했습니다.
- 예전 API 호출 코드(`api-client.mjs`, `candle-service.mjs`, `challenge-reward.mjs`)는 `docs/reference/`에 참고용으로 남겼습니다.
- `landing/`의 체험하기 링크를 `index.html`로 바꿨습니다.
- 예측 판정 기준을 "오늘 종가 대비 다음 거래일 종가"로 정하고, 튜토리얼의 "오늘 종가, 오를까요 내릴까요?" 문구를 이에 맞게 고쳤습니다.

## 2026-10-23 ~ 10-26 — 화면 다듬기

- Core Flow를 이미지·폰트까지 들어간 단일 HTML로 만들었습니다.
- 첫 방문 튜토리얼, 관심종목 탭과 책갈피, 홈 종목 카드 안의 상승/하락 버튼을 추가했습니다.
- 교환 내역을 포인트 내역의 사용 탭으로 합쳤습니다.
- 홈 연승 카드와 보상 카드, 결과 카드 상태 배지, 예측 확인 창, 화면별 헤더를 정리했습니다.
- 상승은 초록, 하락은 빨강으로 바꾸고 "승률"을 "적중률"로 통일했습니다.
- 현재·최고 연승을 계약에 추가해 내 정보에 표시했습니다. 일일 "예측 완료" 미션은 뺐습니다.

## 2026-10-11 ~ 10-12 — Core Flow와 백엔드 인수 준비

- 화면 23개 구성의 Core Flow(`core-flow.html`)를 만들고 API 연동 계약(`docs/openapi.json`)을 작성했습니다.
- 10연승 네이버페이 리워드 수령 화면과 지급 계약을 추가했습니다.
- 네이버페이 공식 로고를 적용하고, 홈 연승 안내와 광고 배너를 복원했습니다.
- 서비스 소개 페이지(`landing/`)를 추가했습니다.

## 2026-09-30 — 백엔드 협의 체크리스트

- 출시 전에 백엔드·기획·운영이 정할 정책 목록을 작성했습니다. (현재 `docs/BACKEND.md` 8장)

## 2026-05-28 ~ 05-31 — Flutter → HTML/CSS/JS 재구성

- React+Capacitor → Flutter로 전환했던 프로젝트를 Vanilla HTML/CSS/JS 멀티 페이지(`pages/`)로 다시 만들었습니다.
- 백엔드(Spring Boot) 연동을 위해 서비스 레이어(`src/js/services/`)를 분리했습니다.
- 포인트 스토어, 약관·개인정보, FAQ 페이지를 추가했습니다.

## 2026-05-08 ~ 05-18 — 프로젝트 시작

- 주식 예측 챌린지 앱으로 시작했습니다. Capacitor/React 웹 결과물을 정리하고 Flutter만 남겼습니다.
