# Candle - 주식 예측 챌린지 앱

Candle은 20~40대 직장인을 위한 모바일 우선 주식 상승/하락 예측 챌린지 앱입니다.

## 📱 주요 기능

### 구현된 화면 (17개)

1. **온보딩 플로우**
   - `Onboarding.tsx` - 첫 진입 온보딩
   - `Login.tsx` - 로그인 화면
   - `Verification.tsx` - 본인 인증
   - `Nickname.tsx` - 닉네임 설정

2. **메인 기능**
   - `Home.tsx` - 홈 화면 (연승 현황)
   - `StockSearch.tsx` - 코스피 종목 검색/선택
   - `AdWatch.tsx` - 광고 시청
   - `Prediction.tsx` - 예측 화면
   - `Result.tsx` - 결과 확인

3. **부가 기능**
   - `News.tsx` - 뉴스 메인
   - `NewsDetail.tsx` - 뉴스 상세
   - `Ranking.tsx` - 랭킹
   - `History.tsx` - 예측 기록
   - `RewardClaim.tsx` - 리워드 신청

4. **마이페이지**
   - `MyPage.tsx` - 마이페이지
   - `Settings.tsx` - 앱 설정 (통합)
   - `NotificationSettings.tsx` - 알림 설정

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: `#2563EB` (Deep Trust Blue)
- **Success/Up**: `#00C896` (에메랄드 그린)
- **Error/Down**: `#FF4D6A` (레드핑크)
- **Background**: `#FFFFFF`, `#F8FAFC`
- **Text**: `#0F172A` (Primary), `#64748B` (Secondary)

### 타이포그래피
- **한글**: Pretendard
- **숫자**: DM Mono

### 모바일 기준
- 375px 모바일 우선 디자인
- 반응형 레이아웃 지원

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 18+ 
- pnpm (권장)

### 설치
```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build
```

## 📂 프로젝트 구조

```
src/
├── app/
│   ├── screens/          # 모든 화면 컴포넌트
│   ├── components/       # 재사용 컴포넌트
│   ├── routes.tsx        # 라우팅 설정
│   └── App.tsx          # 앱 엔트리포인트
├── styles/
│   ├── fonts.css        # 폰트 임포트
│   ├── theme.css        # 디자인 토큰
│   └── globals.css      # 전역 스타일
└── imports/             # 에셋 파일
```

## 🔄 사용자 플로우

```
1. 첫 진입
   Onboarding → Login → Verification → Nickname → Home

2. 예측 플로우
   Home → AdWatch → StockSearch → Prediction → Result → Home

3. 기타
   - News/NewsDetail: 뉴스 확인
   - Ranking: 랭킹 확인
   - History: 예측 기록
   - MyPage: 프로필 및 통계
   - Settings: 앱 설정
```

## 🛠 기술 스택

- **React** 18+ with TypeScript
- **React Router** - 클라이언트 사이드 라우팅
- **Motion (Framer Motion)** - 애니메이션
- **Tailwind CSS v4** - 스타일링
- **Lucide React** - 아이콘
- **Vite** - 빌드 도구

## 📋 주요 특징

### API 연동 설계
- **StockSearch**: 정적 데이터 우선 렌더링 → 실시간 시세 페칭
- **Debounce**: 검색 시 0.5초 지연으로 API 호출 최적화
- **Skeleton UI**: 로딩 중 사용자 경험 개선

### 상태 관리
- React Router의 `location.state`로 화면 간 데이터 전달
- localStorage로 온보딩 플래그 관리

### 애니메이션
- Motion의 `AnimatePresence`로 부드러운 전환
- 연승 숫자 카운트업 애니메이션
- 결과 공개 시 드라마틱한 reveal 효과

## 🎯 핵심 디자인 원칙

1. **금융 신뢰감 우선** - 카지노/게임 같은 화려함 배제
2. **Clean Fintech UI** - 화이트 기반, 전문적인 색상
3. **높은 가독성** - Pretendard + DM Mono 조합
4. **명확한 상태 표시** - 상승(초록)/하락(빨강) 직관적 구분
5. **연속 기록 강조** - 숫자를 화면에서 가장 크고 강렬하게

## 📦 배포

```bash
# 프로덕션 빌드
pnpm build

# dist/ 폴더에 정적 파일 생성됨
# Netlify, Vercel, Cloudflare Pages 등에 배포 가능
```

## 📝 라이선스

© 2026 Candle. All rights reserved.

---

**버전**: 1.0.0  
**빌드 번호**: 100  
**최종 업데이트**: 2026-05-08
