# Candle 변경 이력

## 2026-05-28 — Flutter → Vanilla HTML/CSS/JS 전면 재구성

### 배경

React+Capacitor → Flutter로 전환했던 프로젝트를 웹퍼블리싱 목적에 맞게 Vanilla HTML/CSS/JS MPA(Multi-Page Application)로 다시 재구성.

- 백엔드(Spring Boot) 연동 시 최소 코드 변경으로 전환 가능하도록 서비스 레이어 분리
- 현업 표준 MPA 폴더 구조 적용
- Figma Make 디자인 소스(`Fi8RXBRiavF4rIOBB0iA6x`) 기반으로 UI 구현

---

### 삭제된 파일

| 항목 | 내용 |
|---|---|
| `lib/` | Flutter Dart 소스 전체 (57개 파일) |
| `android/`, `ios/`, `macos/`, `linux/`, `windows/` | 플랫폼별 네이티브 빌드 폴더 |
| `web/` | Flutter 웹 빌드 폴더 |
| `build/`, `test/`, `.dart_tool/` | Flutter 빌드 캐시 및 도구 |
| `pubspec.yaml`, `pubspec.lock` | Flutter 패키지 설정 |
| `analysis_options.yaml`, `candle.iml` | Flutter 분석/IDE 설정 |
| `BACKEND_INTEGRATION_GUIDE.md` | Flutter 기준 구 가이드 (신규 가이드로 대체) |

---

### 추가된 파일

#### 페이지 (pages/)

| 파일 | 화면 | 주요 기능 |
|---|---|---|
| `index.html` | 진입점 | 최초 방문 → onboarding, 재방문 → home 리다이렉트 |
| `pages/onboarding.html` | 온보딩 | 3슬라이드, 스와이프/버튼 이동, 도트 인디케이터 |
| `pages/login.html` | 로그인 | 카카오 로그인 버튼, 차트 배경 SVG |
| `pages/nickname.html` | 닉네임 설정 | 실시간 입력 검증, 중복 확인 |
| `pages/home.html` | 홈 | 연승 수치 카운트업, 달력 스트립, 카운트다운 타이머 |
| `pages/ad-watch.html` | 광고 시청 | before/watching/success 3단계 플로우 |
| `pages/stock-search.html` | 종목 선택 | 스켈레톤 로딩, 실시간 검색 필터(debounce 300ms) |
| `pages/prediction.html` | 예측 | 상승/하락 선택, 선택 후 토스트 + 홈 이동 |
| `pages/result.html` | 결과 확인 | locked/revealing/success/fail 4상태, 플래시 효과 |
| `pages/ranking.html` | 랭킹 | 연승/승률 탭 전환, 내 랭킹 sticky 바 |
| `pages/history.html` | 예측 기록 | 빈 상태 UI |
| `pages/point-store.html` | 포인트 스토어 | 포인트 카드, 교환 옵션, 교환 확인 모달 |
| `pages/mypage.html` | 마이페이지 | 프로필 카드, 통계, 메뉴 |
| `pages/settings.html` | 설정 | 메인/알림/보안/리워드 서브스크린 전환 |
| `pages/notification-settings.html` | 알림 설정 | 토글 컴포넌트, 시간 선택 드롭다운 |
| `pages/reward-claim.html` | 리워드 신청 | 축하 → 폼 입력 → 완료 3단계 |

#### CSS (src/css/)

| 파일 | 역할 |
|---|---|
| `base/reset.css` | 브라우저 기본 스타일 초기화 |
| `base/variables.css` | CSS 커스텀 프로퍼티 (색상, 폰트, 간격, 반경) |
| `components/layout.css` | app-wrapper, screen, scroll-area 공통 레이아웃 |
| `components/header.css` | 공통 헤더 스타일 |
| `components/bottom-nav.css` | 하단 탭바, FAB(예측 버튼) |
| `components/button.css` | primary, secondary, outline, kakao, danger 버튼 |
| `components/card.css` | 카드 컴포넌트 |
| `components/toggle.css` | 토글 스위치 |
| `components/modal.css` | 바텀 시트 모달 |

#### JavaScript (src/js/)

| 파일 | 역할 |
|---|---|
| `utils/storage.js` | localStorage 래퍼 |
| `utils/format.js` | 숫자/가격/퍼센트/타이머 포맷 |
| `utils/router.js` | 페이지 이동, 파라미터 전달 (sessionStorage) |
| `services/api.js` | fetch 래퍼, `USE_MOCK` 플래그, `BASE_URL` 설정 |
| `services/auth.service.js` | 카카오 로그인, 닉네임 확인/설정 |
| `services/stock.service.js` | 종목 목록, 실시간 시세, 검색 |
| `services/prediction.service.js` | 예측 제출, 결과 조회, 히스토리 |
| `services/ranking.service.js` | 연승/승률 랭킹 조회 |
| `services/user.service.js` | 프로필 조회, 닉네임 수정 |
| `components/bottom-nav.js` | 하단 탭바 렌더링 (active 상태 처리) |

---

### 디자인 시스템

| 항목 | 값 |
|---|---|
| Primary | `#2563EB` |
| Success | `#00C896` |
| Danger | `#FF4D6A` |
| Warning | `#F59E0B` |
| Text Dark | `#0F172A` |
| Text Mid | `#64748B` |
| Border | `#E2E8F0` |
| Background | `#F8FAFC` |
| Font UI | Pretendard (한글) |
| Font Mono | DM Mono (숫자/코드) |
| Max Width | 448px (모바일 우선) |

---

### 네비게이션 플로우

```
index.html
├── 최초 방문 → pages/onboarding.html → login.html → nickname.html → home.html
└── 재방문   → pages/home.html

home.html
├── 광고 보고 예측하기 → ad-watch.html → stock-search.html → prediction.html → home.html
└── 결과 확인 → result.html

하단 탭바: home ↔ ranking ↔ [예측 FAB] ↔ point-store ↔ mypage

mypage.html
├── 보상신청 → reward-claim.html
├── 알림설정 → notification-settings.html
└── 앱 설정  → settings.html
```
