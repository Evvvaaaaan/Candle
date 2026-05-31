# Candle — 프로젝트 실행 가이드

주식 예측 챌린지 앱. Vanilla HTML/CSS/JS MPA — 네이티브 박스앱(WebView 래퍼)으로 Android/iOS 배포.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [폴더 구조](#3-폴더-구조)
4. [로컬 실행](#4-로컬-실행)
5. [화면 목록 및 네비게이션](#5-화면-목록-및-네비게이션)
6. [디자인 시스템](#6-디자인-시스템)
7. [서비스 레이어 구조](#7-서비스-레이어-구조)
8. [유틸리티](#8-유틸리티)
9. [새 기능 추가 방법](#9-새-기능-추가-방법)
10. [백엔드 연동](#10-백엔드-연동)

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 앱 이름 | Candle |
| 목적 | 주식 상승/하락 예측 챌린지, 연승 기록 및 랭킹 경쟁 |
| 아키텍처 | Vanilla HTML/CSS/JS MPA (빌드 도구 없음) |
| 배포 타겟 | Android / iOS — 네이티브 박스앱(WebView 래퍼) |
| 디자인 소스 | Figma Make — `Fi8RXBRiavF4rIOBB0iA6x` |
| 데이터 | 현재 mock 모드, Spring Boot 연동 준비 완료 |

**역사:** React+Capacitor → Flutter → Vanilla HTML/CSS/JS 순으로 전환. 웹퍼블리싱 목적에 맞게 단순화하고, 백엔드 연동 시 최소 수정으로 전환 가능하도록 서비스 레이어를 분리.

---

## 2. 기술 스택

| 영역 | 기술 |
|---|---|
| 마크업 | HTML5 |
| 스타일 | Vanilla CSS (CSS Custom Properties) |
| 스크립트 | Vanilla JavaScript (ES2020, 번들러 없음) |
| 폰트 | Pretendard (한글 UI), DM Mono (숫자/코드) |
| 인증 (예정) | Kakao OAuth SDK |
| 백엔드 (예정) | Spring Boot REST API + JWT |
| 로컬 서버 | Live Server (VS Code 확장) 또는 `npx serve` |

---

## 3. 폴더 구조

```
Candle/
├── index.html                    ← 진입점 (방문 여부에 따라 리다이렉트)
├── pages/                        ← HTML 페이지 15개
│   ├── onboarding.html
│   ├── login.html
│   ├── nickname.html
│   ├── home.html
│   ├── ad-watch.html
│   ├── stock-search.html
│   ├── prediction.html
│   ├── result.html
│   ├── ranking.html
│   ├── history.html
│   ├── point-store.html
│   ├── mypage.html
│   ├── settings.html
│   ├── notification-settings.html
│   └── reward-claim.html
├── src/
│   ├── css/
│   │   ├── base/
│   │   │   ├── reset.css         ← 브라우저 기본 스타일 초기화
│   │   │   └── variables.css     ← CSS 커스텀 프로퍼티 (디자인 토큰)
│   │   └── components/
│   │       ├── layout.css        ← app-wrapper, screen, scroll-area
│   │       ├── header.css        ← 공통 헤더
│   │       ├── bottom-nav.css    ← 하단 탭바, FAB
│   │       ├── button.css        ← 버튼 변형 (primary, kakao, danger 등)
│   │       ├── card.css          ← 카드 컴포넌트
│   │       ├── toggle.css        ← 토글 스위치
│   │       └── modal.css         ← 바텀 시트 모달
│   └── js/
│       ├── utils/
│       │   ├── storage.js        ← localStorage 래퍼
│       │   ├── format.js         ← 숫자/가격/퍼센트/타이머 포맷
│       │   └── router.js         ← 페이지 이동 + 파라미터 전달
│       ├── services/
│       │   ├── api.js            ← fetch 래퍼, USE_MOCK 플래그 (백엔드 전환 포인트)
│       │   ├── auth.service.js   ← 카카오 로그인, 닉네임 확인/설정
│       │   ├── stock.service.js  ← 종목 목록, 시세, 검색
│       │   ├── prediction.service.js ← 예측 제출, 결과, 히스토리
│       │   ├── ranking.service.js    ← 연승/승률 랭킹
│       │   └── user.service.js   ← 프로필 조회/수정
│       └── components/
│           └── bottom-nav.js     ← 하단 탭바 렌더링
└── assets/                       ← 이미지, 아이콘, 폰트
```

---

## 4. 로컬 실행

빌드 단계가 없으므로, 정적 파일 서버로 바로 실행합니다.

### 방법 A — VS Code Live Server (권장)

1. VS Code에서 프로젝트 폴더 열기
2. 우하단 **Go Live** 버튼 클릭 (또는 `index.html` 우클릭 → Open with Live Server)
3. 브라우저에서 `http://127.0.0.1:5500` 자동 오픈

### 방법 B — npx serve

```bash
cd Candle
npx serve .
# → http://localhost:3000
```

### 방법 C — Python 내장 서버

```bash
cd Candle
python3 -m http.server 3000
# → http://localhost:3000
```

> **주의:** `file://` 프로토콜로 직접 열면 ES 모듈 import나 fetch 요청이 CORS 오류로 막힐 수 있습니다. 반드시 로컬 서버를 통해 접근하세요.

### 첫 방문 vs 재방문 시뮬레이션

- **온보딩 화면 재확인:** 개발자 도구 → Application → LocalStorage → `candle_visited` 삭제 후 새로고침
- **홈 화면으로 바로 이동:** `candle_visited` 값이 있는 상태에서 새로고침

---

## 5. 화면 목록 및 네비게이션

### 화면 목록

| 파일 | 화면명 | 주요 기능 |
|---|---|---|
| `index.html` | 진입점 | 최초/재방문 분기 리다이렉트 |
| `pages/onboarding.html` | 온보딩 | 3슬라이드, 스와이프/버튼 이동, 도트 인디케이터 |
| `pages/login.html` | 로그인 | 카카오 로그인 버튼, 차트 배경 SVG |
| `pages/nickname.html` | 닉네임 설정 | 실시간 입력 검증, 중복 확인 |
| `pages/home.html` | 홈 | 연승 카운트업, 달력 스트립, 카운트다운 타이머 |
| `pages/ad-watch.html` | 광고 시청 | before → watching → success 3단계 플로우 |
| `pages/stock-search.html` | 종목 선택 | 스켈레톤 로딩, 실시간 검색 필터 (debounce 300ms) |
| `pages/prediction.html` | 예측 | 상승/하락 선택, 토스트 + 홈 이동 |
| `pages/result.html` | 결과 확인 | locked → revealing → success/fail 4상태, 플래시 효과 |
| `pages/ranking.html` | 랭킹 | 연승/승률 탭 전환, 내 랭킹 sticky 바 |
| `pages/history.html` | 예측 기록 | 예측 이력 목록, 빈 상태 UI |
| `pages/point-store.html` | 포인트 스토어 | 포인트 카드, 교환 옵션, 교환 확인 모달 |
| `pages/mypage.html` | 마이페이지 | 프로필 카드, 통계, 메뉴 |
| `pages/settings.html` | 설정 | 메인/알림/보안/리워드 서브스크린 전환 |
| `pages/notification-settings.html` | 알림 설정 | 토글 컴포넌트, 시간 선택 드롭다운 |
| `pages/reward-claim.html` | 리워드 신청 | 축하 → 폼 입력 → 완료 3단계 |

### 네비게이션 플로우

```
index.html
├── 최초 방문 → onboarding.html → login.html → nickname.html → home.html
└── 재방문   → home.html

home.html
├── 광고 보고 예측하기 → ad-watch.html → stock-search.html
│                                              → prediction.html → home.html
└── 결과 확인 → result.html

하단 탭바: home ↔ ranking ↔ [예측 FAB] ↔ point-store ↔ mypage

mypage.html
├── 보상신청 → reward-claim.html
├── 알림설정 → notification-settings.html
└── 앱 설정  → settings.html
```

---

## 6. 디자인 시스템

모든 디자인 토큰은 `src/css/base/variables.css`에 CSS 커스텀 프로퍼티로 정의되어 있습니다.

### 색상

| 변수 | 값 | 용도 |
|---|---|---|
| `--color-primary` | `#2563EB` | 주요 액션, 버튼 |
| `--color-success` | `#00C896` | 상승, 성공 상태 |
| `--color-danger` | `#FF4D6A` | 하락, 오류, 위험 액션 |
| `--color-warning` | `#F59E0B` | 경고 |
| `--color-text-dark` | `#0F172A` | 주요 텍스트 |
| `--color-text-mid` | `#64748B` | 보조 텍스트 |
| `--color-bg-app` | `#F8FAFC` | 앱 배경 |
| `--color-border` | `#E2E8F0` | 구분선, 테두리 |
| `--color-kakao` | `#FEE500` | 카카오 버튼 |

### 타이포그래피

| 변수 | 값 | 용도 |
|---|---|---|
| `--font-ui` | Pretendard | 한글 UI 전반 |
| `--font-mono` | DM Mono | 숫자, 코드, 시세 |

### 레이아웃

- **최대 너비:** 448px (모바일 우선)
- **헤더 높이:** `--header-height: 56px`
- **하단 탭바 높이:** `--bottom-nav-height: 60px`
- **카드 반경:** `--radius-card: 16px`

---

## 7. 서비스 레이어 구조

모든 데이터 호출은 `src/js/services/` 하위 파일을 통해 이루어집니다.

### api.js — 백엔드 연결의 단일 진입점

```js
const API_CONFIG = {
  USE_MOCK: true,                    // false로 변경하면 전체 서비스가 실제 API 호출
  BASE_URL: 'http://localhost:8080/api',
  MOCK_DELAY: 500,
};
```

각 서비스 파일은 `API_CONFIG.USE_MOCK` 값을 확인해 분기합니다:

```js
// 예시 — user.service.js
async getProfile() {
  if (API_CONFIG.USE_MOCK) return api.mock(this.MOCK_USER);
  return api.get('/users/me');
}
```

### 서비스별 역할

| 파일 | 역할 | 주요 메서드 |
|---|---|---|
| `auth.service.js` | 인증 | `kakaoLogin()`, `checkNickname()`, `setNickname()`, `logout()` |
| `stock.service.js` | 종목 | `getTopStocks()`, `getPrices()`, `searchStocks()` |
| `prediction.service.js` | 예측 | `submitPrediction()`, `getResult()`, `getHistory()` |
| `ranking.service.js` | 랭킹 | `getStreakRanking()`, `getWinrateRanking()` |
| `user.service.js` | 유저 | `getProfile()`, `updateNickname()` |

---

## 8. 유틸리티

### Storage (`src/js/utils/storage.js`)

localStorage 래퍼. JSON 직렬화/역직렬화 자동 처리.

```js
Storage.set('auth_token', 'jwt_string');
Storage.get('auth_token');   // → 'jwt_string'
Storage.remove('auth_token');
```

### Format (`src/js/utils/format.js`)

```js
Format.price(1234567);   // → '1,234,567'
Format.percent(0.1234);  // → '+12.34%'
Format.timer(90);        // → '01:30'
```

### Router (`src/js/utils/router.js`)

페이지 이동과 파라미터 전달을 담당. sessionStorage를 통해 값을 전달합니다.

```js
// 페이지 이동 (파라미터 포함)
Router.go('../pages/prediction.html', { ticker: '005930', name: '삼성전자' });

// 이동한 페이지에서 파라미터 수신
const { ticker, name } = Router.params();
Router.clearParams();  // 사용 후 정리

// 뒤로 가기
Router.back();
```

---

## 9. 새 기능 추가 방법

### 새 화면 추가

1. `pages/` 에 HTML 파일 생성
2. `<head>`에 공통 CSS 로드:
   ```html
   <link rel="stylesheet" href="../src/css/base/reset.css">
   <link rel="stylesheet" href="../src/css/base/variables.css">
   <link rel="stylesheet" href="../src/css/components/layout.css">
   <!-- 필요한 컴포넌트 CSS 추가 -->
   ```
3. `<body>` 하단에 공통 JS 로드:
   ```html
   <script src="../src/js/utils/storage.js"></script>
   <script src="../src/js/utils/format.js"></script>
   <script src="../src/js/utils/router.js"></script>
   <script src="../src/js/services/api.js"></script>
   <!-- 필요한 서비스 JS 추가 -->
   ```

### 새 서비스 추가

1. `src/js/services/` 에 `{name}.service.js` 파일 생성
2. `API_CONFIG.USE_MOCK` 분기 패턴 사용:
   ```js
   const NewService = {
     MOCK_DATA: { /* mock 데이터 */ },

     async getData() {
       if (API_CONFIG.USE_MOCK) return api.mock(this.MOCK_DATA);
       return api.get('/new-endpoint');
     },
   };
   ```
3. 해당 화면 HTML에서 스크립트 태그로 로드

---

## 10. 백엔드 연동

상세 내용은 **[BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md)** 참조.

### 핵심 요약 (3단계)

**1단계 — api.js 한 줄 수정**

```js
// src/js/services/api.js
const API_CONFIG = {
  USE_MOCK: false,                          // true → false
  BASE_URL: 'https://your-server.com/api', // 실제 서버 주소
};
```

**2단계 — 카카오 로그인 SDK 연결**

`pages/login.html` `<head>`에 SDK 추가 후, `kakao-btn` 클릭 핸들러에 실제 인증 로직 연결.

**3단계 — Spring Boot CORS 설정**

```java
registry.addMapping("/api/**")
        .allowedOrigins("https://your-domain.com")
        .allowedMethods("GET", "POST", "PUT", "DELETE");
```

### 전환 체크리스트

```
[ ] api.js — USE_MOCK: false, BASE_URL 실제 주소로 변경
[ ] login.html — Kakao SDK 스크립트 추가 및 초기화
[ ] login.html — kakao-btn 핸들러에 실제 SDK 연동
[ ] Spring Boot — /api/** CORS 허용 설정
[ ] Spring Boot — JWT 발급/검증 미들웨어 구현
[ ] 배포 환경 — BASE_URL을 프로덕션 주소로 변경
```

---

## 참고 문서

| 문서 | 내용 |
|---|---|
| `BACKEND_INTEGRATION_GUIDE.md` | 백엔드 연동 상세 가이드 (API 엔드포인트, JWT, CORS) |
| `CHANGELOG.md` | Flutter → Vanilla HTML 전환 이력, 파일별 변경 내역 |
