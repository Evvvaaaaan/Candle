# 백엔드 연동 가이드

Spring Boot 백엔드 연동 시 변경해야 할 파일과 순서를 설명합니다.
현재 프로젝트는 `USE_MOCK = true` 상태로 동작하며, 전환 시 mock 데이터 없이 실제 API를 호출합니다.

---

## 1. API 설정 변경 (필수, 1개 파일)

**`src/js/services/api.js`**

```js
const API_CONFIG = {
  USE_MOCK: false,                        // true → false 로 변경
  BASE_URL: 'https://your-server.com/api', // Spring Boot 서버 주소
  MOCK_DELAY: 500,
};
```

이 한 줄만 바꾸면 모든 서비스 파일이 실제 API를 호출합니다.  
각 서비스는 `API_CONFIG.USE_MOCK` 값을 체크해 mock/real을 자동으로 분기합니다.

---

## 2. 서비스별 API 엔드포인트

### 인증 — `src/js/services/auth.service.js`

| 기능 | 메서드 | 경로 | 요청 바디 | 응답 |
|---|---|---|---|---|
| 카카오 로그인 | POST | `/auth/kakao` | `{ kakaoToken }` | `{ token, isNewUser }` |
| 닉네임 중복 확인 | GET | `/auth/nickname/check?nickname=` | — | `{ available: boolean }` |
| 닉네임 설정 | POST | `/auth/nickname` | `{ nickname }` | `{ success: boolean }` |

**카카오 SDK 연동 위치:** `pages/login.html` — `kakao-btn` 클릭 핸들러

```js
// pages/login.html 수정 전 (현재)
document.getElementById('kakao-btn').addEventListener('click', () => {
  location.href = './nickname.html';
});

// 수정 후 (Kakao SDK 연동)
document.getElementById('kakao-btn').addEventListener('click', () => {
  Kakao.Auth.login({
    success: async (authObj) => {
      const res = await AuthService.kakaoLogin(authObj.access_token);
      Storage.set('auth_token', res.token);
      if (res.isNewUser) location.href = './nickname.html';
      else location.href = './home.html';
    },
  });
});
```

---

### 주식 — `src/js/services/stock.service.js`

| 기능 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| 시가총액 상위 종목 | GET | `/stocks/top` | 종목 코드+이름 목록 |
| 실시간 시세 | POST | `/stocks/prices` | `{ codes: string[] }` → 시세 배열 |
| 종목 검색 | GET | `/stocks/search?q=` | 검색어 기반 종목 반환 |

---

### 예측 — `src/js/services/prediction.service.js`

| 기능 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| 예측 제출 | POST | `/predictions` | `{ ticker, direction: 'up'|'down' }` |
| 결과 조회 | GET | `/predictions/result?date=` | 당일 결과 반환 |
| 히스토리 조회 | GET | `/predictions/history` | 전체 예측 기록 |

---

### 랭킹 — `src/js/services/ranking.service.js`

| 기능 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| 연승 랭킹 | GET | `/ranking/streak` | top3 + list + 내 순위 |
| 승률 랭킹 | GET | `/ranking/winrate` | top3 + list + 내 순위 (분기별) |

**응답 구조 (연승 랭킹):**
```json
{
  "myRank": { "rank": 243, "nickname": "...", "streak": 7, "change": 12 },
  "top3": [
    { "rank": 1, "name": "...", "streak": 89 }
  ],
  "list": [
    { "rank": 4, "name": "...", "streak": 42 }
  ]
}
```

---

### 유저 — `src/js/services/user.service.js`

| 기능 | 메서드 | 경로 | 설명 |
|---|---|---|---|
| 프로필 조회 | GET | `/users/me` | 닉네임, 연승, 정확도 등 |
| 닉네임 수정 | PUT | `/users/me/nickname` | `{ nickname }` |

---

## 3. JWT 인증 처리

`src/js/services/api.js`의 `apiRequest` 함수가 모든 요청에 JWT를 자동으로 첨부합니다.

```js
// api.js 내부 — 별도 수정 불필요
const token = Storage.get('auth_token');
if (token) headers['Authorization'] = `Bearer ${token}`;
```

토큰 저장/삭제:
- 저장: 로그인 성공 시 `Storage.set('auth_token', res.token)`
- 삭제: `src/js/services/auth.service.js` 의 `logout()` 함수 자동 처리

토큰 만료(401) 처리가 필요하면 `apiRequest` 함수에 인터셉터를 추가하세요:

```js
// api.js — apiRequest 함수 수정
const res = await fetch(...);

if (res.status === 401) {
  Storage.remove('auth_token');
  location.href = '/pages/login.html';
  return;
}
```

---

## 4. CORS 설정 (Spring Boot)

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000", "https://your-domain.com")
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

---

## 5. API 응답 공통 포맷 (권장)

```json
{
  "success": true,
  "data": { ... },
  "message": "ok"
}
```

현재 서비스 파일은 `res.data` 또는 `res` 직접 접근 방식 모두 지원합니다.  
Spring Boot 응답 구조가 달라질 경우 `api.js`의 `apiRequest`에서 `res.json()` 파싱 이후 변환 레이어를 추가하면 됩니다.

---

## 6. 카카오 로그인 SDK 설정

`pages/login.html` `<head>`에 카카오 SDK 스크립트 추가:

```html
<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
        integrity="sha384-TiCUE00h649CAMonG018J1HnFBfYUCsAkAP7h1OBpjKNM8EMijhFJ/tRbcASIbYz"
        crossorigin="anonymous"></script>
<script>
  Kakao.init('YOUR_KAKAO_APP_KEY');
</script>
```

---

## 7. 전환 체크리스트

```
[ ] api.js — USE_MOCK: false, BASE_URL 실제 주소로 변경
[ ] login.html — Kakao SDK 스크립트 추가 및 초기화
[ ] login.html — kakao-btn 클릭 핸들러에 실제 SDK 연동
[ ] Spring Boot — /api/** CORS 허용 설정
[ ] Spring Boot — JWT 발급/검증 미들웨어 구현
[ ] 각 서비스 엔드포인트 — Spring Boot 컨트롤러와 경로 일치 확인
[ ] 배포 환경 — BASE_URL을 프로덕션 주소로 변경
```

---

## 8. mock 코드 제거 (선택, 정리 단계)

`USE_MOCK = false` 전환 후 안정화되면 각 서비스의 mock 분기를 정리합니다.

```js
// 정리 전
async getProfile() {
  if (API_CONFIG.USE_MOCK) return api.mock(this.MOCK_USER);
  return api.get('/users/me');
}

// 정리 후
async getProfile() {
  return api.get('/users/me');
}
```

`MOCK_*` 상수 및 `api.mock()` 호출 라인을 일괄 삭제하면 됩니다.
