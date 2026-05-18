# Candle 백엔드 연동 가이드

**작성일:** 2026-05-18
**프로젝트:** Candle — 주식 예측 챌린지 앱
**플랫폼:** Flutter (Android / iOS)
**서버 대상:** Spring Boot REST API

---

## 목차

1. [아키텍처 개요](#1-아키텍처-개요)
2. [계층별 상세 설명](#2-계층별-상세-설명)
3. [Mock → 실제 백엔드 전환](#3-mock--실제-백엔드-전환)
4. [전체 요청 흐름](#4-전체-요청-흐름)
5. [백엔드 구현 체크리스트](#5-백엔드-구현-체크리스트)
6. [주요 패키지 버전](#6-주요-패키지-버전)

---

## 1. 아키텍처 개요

본 프로젝트는 **Flutter Clean Architecture**를 따르며, 코드는 4개의 계층으로 완전히 분리되어 있다.

```
lib/
├── core/           # 공통 인프라 (네트워크, 스토리지, 에러)
├── data/           # 데이터 계층 (Model, DataSource, Repository 구현체)
├── domain/         # 도메인 계층 (Entity, Repository 인터페이스, UseCase)
├── presentation/   # 표현 계층 (BLoC, Screen, Widget)
├── di/             # 의존성 주입 (GetIt)
└── router/         # 라우팅 (GoRouter)
```

**의존 방향은 단방향이다.**

```
presentation → domain ← data
                ↑
              core
```

`domain` 계층은 `data`를 모른다. `data` 계층이 `domain`의 인터페이스를 구현한다.
백엔드 연동 시 수정이 필요한 파일은 **`data/` 계층에만** 집중된다.

---

## 2. 계층별 상세 설명

### 2-1. `core/` — 공통 인프라

#### `core/network/api_endpoints.dart`

모든 API 경로를 상수로 관리한다.

```dart
abstract final class ApiEndpoints {
  static const String baseUrl = 'https://api.candle.app'; // ← 배포 시 변경

  // Auth
  static const String kakaoLogin     = '/auth/kakao';
  static const String setNickname    = '/auth/nickname';
  static const String refresh        = '/auth/refresh';
  static const String logout         = '/auth/logout';

  // Stocks
  static const String stocks         = '/stocks';
  static const String stockSearch    = '/stocks/search';

  // Predictions
  static const String predictions      = '/predictions';
  static const String todayPrediction  = '/predictions/today';
  static const String predictionResult = '/predictions/result';
  static const String predictionHistory= '/predictions/history';
  static const String watchAd          = '/predictions/watch-ad';

  // Rankings
  static const String streakRanking  = '/rankings/streak';
  static const String winrateRanking = '/rankings/winrate';

  // User
  static const String myProfile      = '/users/me';
}
```

> **백엔드 연동 시:** `baseUrl`만 실제 서버 주소로 교체하면 모든 요청이 자동 반영된다.

---

#### `core/network/api_client.dart`

`Dio` 기반의 HTTP 클라이언트 래퍼. `GET`, `POST`, `PUT`, `DELETE` 4개 메서드를 제공한다.

| 설정 항목 | 값 |
|---|---|
| 연결 타임아웃 | 10s |
| 수신 타임아웃 | 15s |
| 송신 타임아웃 | 10s |
| 응답 타입 | `Map<String, dynamic>` |
| `2xx` 이외 상태 코드 | `ServerException` 으로 변환 |
| `401` 응답 | `UnauthorizedException` 으로 변환 |

**서버 응답 구조 계약 (전 엔드포인트 공통):**

```json
{
  "data": { },
  "message": "오류 메시지 (에러 시에만)"
}
```

> `_handleResponse()`가 `response['data']`를 추출해 각 DataSource로 전달한다.
> 서버는 반드시 최상위에 `data` 키를 포함해야 한다.

---

#### `core/network/api_interceptor.dart`

Dio 인터셉터. 두 가지 역할을 수행한다.

**1) 요청 전처리 (`onRequest`)**
- `SecureStorage`에서 `accessToken` 조회
- `Authorization: Bearer <token>` 헤더 자동 주입
- `Content-Type: application/json` 고정

**2) 토큰 자동 갱신 (`onError`)**
- `401` 응답 수신 시 `_tryRefreshToken()` 실행
- `POST /auth/refresh` 에 `{ "refreshToken": "..." }` 전송
- 성공 시 새 토큰 저장 후 원래 요청 재시도
- 실패 시 저장된 토큰 삭제 (로그아웃 처리)

**토큰 갱신 응답 스펙:**

```json
{
  "data": {
    "accessToken": "새 JWT",
    "refreshToken": "새 리프레시 토큰"
  }
}
```

---

#### `core/storage/secure_storage.dart`

`flutter_secure_storage`를 래핑한 토큰 저장소.

| 메서드 | 역할 |
|---|---|
| `saveTokens(accessToken, refreshToken)` | 로그인 성공 후 토큰 저장 |
| `getAccessToken()` | 인터셉터에서 요청마다 호출 |
| `getRefreshToken()` | 토큰 갱신 시 호출 |
| `clearTokens()` | 로그아웃 또는 갱신 실패 시 호출 |

저장 키: `access_token`, `refresh_token`

---

#### `core/errors/exceptions.dart` / `failures.dart`

Repository 구현체에서 Exception을 catch하여 Failure로 변환한다.
Presentation 계층은 Failure만 인식한다.

| Exception (data 계층에서 throw) | Failure (presentation으로 전달) |
|---|---|
| `ServerException` | `ServerFailure` (statusCode 포함) |
| `UnauthorizedException` | `UnauthorizedFailure` |
| `NetworkException` | `NetworkFailure` |
| `ValidationException` | `ValidationFailure` |
| `CacheException` | `CacheFailure` |

---

### 2-2. `domain/` — 도메인 계층

외부 의존성이 없는 순수 Dart 코드. **백엔드 연동과 관계없이 변경하지 않는다.**

#### Entity 목록

| 파일 | 필드 |
|---|---|
| `entities/user.dart` | `id`, `nickname`, `joinedAt`, `currentStreak`, `bestStreak`, `totalPredictions`, `correctPredictions` |
| `entities/stock.dart` | `ticker`, `name`, `currentPrice`(int), `changeRate`(double), `changePrice`(int) |
| `entities/prediction.dart` | `id`, `ticker`, `stockName`, `direction`(up/down), `status`(pending/correct/wrong/noResult), `predictionPrice`, `resultPrice?`, `streak?`, `date` |
| `entities/ranking.dart` | `StreakRankEntry`, `WinrateRankEntry`, `MyRankInfo` |

모든 Entity는 `Equatable`을 상속하며 불변(`const`)이다.

#### Repository 인터페이스 (계약)

```dart
// auth_repository.dart
Future<Either<Failure, User>>  loginWithKakao(String kakaoAccessToken);
Future<Either<Failure, User>>  setNickname(String nickname);
Future<Either<Failure, User>>  getMyProfile();
Future<Either<Failure, void>>  logout();
Future<bool>                   hasValidSession();

// stock_repository.dart
Future<Either<Failure, List<Stock>>> getTopStocks();
Future<Either<Failure, List<Stock>>> searchStocks(String query);

// prediction_repository.dart
Future<Either<Failure, Prediction>>       submitPrediction({ticker, stockName, direction});
Future<Either<Failure, Prediction?>>      getTodayPrediction();
Future<Either<Failure, Prediction>>       getPredictionResult();
Future<Either<Failure, List<DayHistory>>> getHistory();
Future<Either<Failure, void>>             confirmAdWatched();
```

모든 결과는 `Either<Failure, T>`로 반환한다. `Left`는 실패, `Right`는 성공이다.

#### UseCase 목록

| UseCase | 호출 방식 |
|---|---|
| `LoginUseCase` | `call(kakaoAccessToken)` |
| `GetTopStocksUseCase` | `call()` |
| `SearchStocksUseCase` | `call(query)` |
| `SubmitPredictionUseCase` | `call({ticker, stockName, direction})` |

---

### 2-3. `data/` — 데이터 계층

백엔드 연동의 핵심 계층. **현재 Mock 플래그(`_useMock = true`)가 활성화**되어 있다.

#### Models — JSON 직렬화 스펙

**`UserModel.fromJson()`이 기대하는 서버 응답:**

```json
{
  "id": "string",
  "nickname": "string",
  "joinedAt": "2026-01-15T09:00:00.000Z",
  "currentStreak": 7,
  "bestStreak": 15,
  "totalPredictions": 42,
  "correctPredictions": 28
}
```

**`StockModel.fromJson()`이 기대하는 서버 응답:**

```json
{
  "ticker": "005930",
  "name": "삼성전자",
  "currentPrice": 73400,
  "changeRate": 1.24,
  "changePrice": 900
}
```

**`PredictionModel.fromJson()`이 기대하는 서버 응답:**

```json
{
  "id": "string",
  "ticker": "005930",
  "stockName": "삼성전자",
  "direction": "UP",
  "status": "PENDING",
  "predictionPrice": 73400,
  "resultPrice": null,
  "streak": null,
  "date": "2026-05-18T00:00:00.000Z"
}
```

- `direction` 허용값: `"UP"` / `"DOWN"`
- `status` 허용값: `"PENDING"` / `"CORRECT"` / `"WRONG"` / `"NO_RESULT"`

**`DayHistoryModel.fromJson()`이 기대하는 서버 응답:**

```json
{
  "date": "2026-05-18",
  "state": "SUCCESS"
}
```

- `state` 허용값: `"SUCCESS"` / `"FAIL"` / `"PENDING"` / `"FUTURE"`

---

#### DataSource — API 호출 명세

**`AuthRemoteDataSource`**

| 메서드 | HTTP | 경로 | 요청 바디 | 반환 |
|---|---|---|---|---|
| `loginWithKakao` | POST | `/auth/kakao` | `{ "kakaoAccessToken": "..." }` | `UserModel` |
| `setNickname` | POST | `/auth/nickname` | `{ "nickname": "..." }` | `UserModel` |
| `getMyProfile` | GET | `/users/me` | — | `UserModel` |
| `logout` | POST | `/auth/logout` | — | void |

> `setNickname`은 DataSource에서 길이 유효성 검사(2~10자)를 수행한다. 서버에서도 동일하게 검증하는 것을 권장한다.

**`StockRemoteDataSource`**

| 메서드 | HTTP | 경로 | 쿼리 파라미터 | 반환 |
|---|---|---|---|---|
| `getTopStocks` | GET | `/stocks` | — | `List<StockModel>` |
| `searchStocks` | GET | `/stocks/search` | `?q={query}` | `List<StockModel>` |

**`PredictionRemoteDataSource`**

| 메서드 | HTTP | 경로 | 요청 바디 / 쿼리 | 반환 |
|---|---|---|---|---|
| `submitPrediction` | POST | `/predictions` | `{ "ticker", "stockName", "direction": "UP"\|"DOWN" }` | `PredictionModel` |
| `getTodayPrediction` | GET | `/predictions/today` | — | `PredictionModel?` (`data: null` 허용) |
| `getPredictionResult` | GET | `/predictions/result` | — | `PredictionModel` |
| `getHistory` | GET | `/predictions/history` | — | `List<DayHistoryModel>` |
| `confirmAdWatched` | POST | `/predictions/watch-ad` | — | void |

---

### 2-4. `presentation/` — 표현 계층

#### BLoC 구조

**`AuthBloc`** — 싱글턴 (앱 전역)

| 이벤트 | 트리거 시점 | 결과 상태 |
|---|---|---|
| `AuthCheckRequested` | 앱 시작 / 로그인 화면 진입 | `AuthAuthenticated` 또는 `AuthUnauthenticated` |
| `AuthLoginRequested(kakaoAccessToken)` | 카카오 로그인 버튼 | `AuthAuthenticated` 또는 `AuthError` |
| `AuthNicknameSubmitted(nickname)` | 닉네임 설정 완료 | `AuthAuthenticated` 또는 `AuthError` |
| `AuthLogoutRequested` | 로그아웃 버튼 | `AuthUnauthenticated` |

상태 전이:
```
AuthInitial → AuthLoading → AuthAuthenticated
                          → AuthUnauthenticated
                          → AuthError
```

**`StockBloc`** — 팩토리 (화면별 새 인스턴스)

| 이벤트 | 동작 |
|---|---|
| `StockLoadRequested` | 인기 종목 목록 로드 |
| `StockSearchChanged(query)` | 500ms 디바운스 후 검색 |
| `StockSearchCleared` | 검색 취소, 인기 종목 복원 |

**`PredictionBloc`** — 팩토리

| 이벤트 | 동작 |
|---|---|
| `PredictionSubmitted(ticker, stockName, direction)` | 예측 제출 |
| `PredictionResultRequested` | 결과 조회 |
| `PredictionAdWatchConfirmed` | 광고 시청 완료 서버 통보 |
| `PredictionReset` | 상태 초기화 |

#### 화면 → BLoC 매핑

| 화면 | BLoC |
|---|---|
| `LoginScreen` | `AuthBloc` |
| `NicknameScreen` | `AuthBloc` |
| `MyPageScreen` | `AuthBloc` |
| `StockSearchScreen` | `StockBloc` |
| `PredictionScreen` | `PredictionBloc` |
| `ResultScreen` | `PredictionBloc` |
| `AdWatchScreen` | `PredictionBloc` |
| `HomeScreen`, `RankingScreen`, `HistoryScreen`, `SettingsScreen` | 직접 BLoC 없음 |

---

### 2-5. `di/injection.dart` — 의존성 주입

`GetIt`을 사용하며, 앱 시작 시 `main.dart`에서 `configureDependencies()`를 호출한다.

| 종류 | 등록 방식 | 생명주기 |
|---|---|---|
| `SharedPreferences`, `FlutterSecureStorage` | `registerSingleton` | 앱 전체 공유 |
| `SecureStorage`, `ApiClient` | `registerLazySingleton` | 첫 접근 시 생성 후 재사용 |
| DataSource, Repository, UseCase | `registerLazySingleton` | 첫 접근 시 생성 후 재사용 |
| `AuthBloc` | `registerSingleton` | 앱 전체 단일 인스턴스 |
| `StockBloc`, `PredictionBloc` | `registerFactory` | 접근할 때마다 새 인스턴스 |

---

## 3. Mock → 실제 백엔드 전환

현재 두 DataSource 파일에 Mock 플래그가 활성화되어 있다.

**전환 대상 파일 2곳:**

```
lib/data/datasources/remote/stock_remote_datasource.dart      (line 15)
lib/data/datasources/remote/prediction_remote_datasource.dart (line 23)
```

**변경 방법:**

```dart
// Before (Mock 활성)
static const bool _useMock = true;

// After (실제 API 연결)
static const bool _useMock = false;
```

두 파일 모두 `_useMock = false`로 변경하면 `if (_useMock)` 분기를 건너뛰고 실제 `ApiClient` 호출 경로로 진입한다.

**Base URL 확인:**

```
lib/core/network/api_endpoints.dart  (line 3)
static const String baseUrl = 'https://api.candle.app';
```

개발 서버와 프로덕션 서버 URL이 다를 경우 이 값을 환경별로 분기하도록 수정한다.

---

## 4. 전체 요청 흐름

카카오 로그인을 예시로 데이터가 각 계층을 통과하는 경로를 나타낸다.

```
LoginScreen
  └─ AuthBloc.add(AuthLoginRequested(kakaoToken))
       └─ LoginUseCase.call(kakaoToken)
            └─ AuthRepository.loginWithKakao(kakaoToken)          [domain 인터페이스]
                 └─ AuthRepositoryImpl.loginWithKakao(kakaoToken) [data 구현체]
                      └─ AuthRemoteDataSource.loginWithKakao(kakaoToken)
                           └─ ApiClient.post('/auth/kakao', { "kakaoAccessToken": token })
                                └─ Dio + ApiInterceptor
                                     └─ POST https://api.candle.app/auth/kakao
                                          ↓ 200 OK { "data": { "id": ..., "nickname": ... } }
                                     ↓
                                UserModel.fromJson(response['data'])
                           ↓
                      Right(UserModel)
                 ↓
            Right(User)
       ↓
  AuthBloc → emit(AuthAuthenticated(user))
       ↓
  LoginScreen → GoRouter.go('/home')
```

**로그인 실패 시 (401):**

```
ApiClient → DioException(401) → UnauthorizedException
  └─ AuthRepositoryImpl → Left(UnauthorizedFailure("인증이 만료되었습니다."))
       └─ LoginUseCase  → Left(UnauthorizedFailure)
            └─ AuthBloc → emit(AuthError("인증이 만료되었습니다."))
                 └─ LoginScreen → 에러 스낵바 표시
```

---

## 5. 백엔드 구현 체크리스트

### 공통

- [ ] 모든 응답은 `{ "data": <payload> }` 최상위 래퍼 포함
- [ ] 오류 응답은 `{ "message": "오류 설명" }` 포함
- [ ] 인증이 필요한 엔드포인트에 `Authorization: Bearer <JWT>` 헤더 검증

### 인증

- [ ] `POST /auth/kakao` — 카카오 AccessToken 수신 → JWT 발급 → `data`에 UserModel 반환
- [ ] `POST /auth/nickname` — 닉네임 2~10자 검증 → `data`에 UserModel 반환
- [ ] `POST /auth/refresh` — `{ "refreshToken" }` 수신 → `data.accessToken`, `data.refreshToken` 반환
- [ ] `POST /auth/logout` — 서버 측 리프레시 토큰 무효화
- [ ] `GET /users/me` — 현재 유저 정보 반환

### 주식

- [ ] `GET /stocks` — 인기 종목 리스트 반환 (StockModel 배열)
- [ ] `GET /stocks/search?q={query}` — 이름 또는 ticker로 검색

### 예측

- [ ] `POST /predictions` — `{ ticker, stockName, direction: "UP"|"DOWN" }` 수신 → PredictionModel 반환
- [ ] `GET /predictions/today` — 오늘 예측 없으면 `data: null` 반환
- [ ] `GET /predictions/result` — 최근 결과 PredictionModel 반환
- [ ] `GET /predictions/history` — DayHistoryModel 배열 반환 (`state: "SUCCESS"|"FAIL"|"PENDING"|"FUTURE"`)
- [ ] `POST /predictions/watch-ad` — 광고 시청 기록 처리

### 랭킹

- [ ] `GET /rankings/streak` — 연승 랭킹 (현재 프론트 DataSource 미구현, 추후 연동 필요)
- [ ] `GET /rankings/winrate` — 승률 랭킹 (동일)

---

## 6. 주요 패키지 버전

| 패키지 | 버전 | 용도 |
|---|---|---|
| `flutter_bloc` | ^8.1.6 | 상태 관리 |
| `go_router` | ^14.3.0 | 선언적 라우팅 |
| `dio` | ^5.7.0 | HTTP 클라이언트 |
| `get_it` | ^8.0.3 | 의존성 주입 |
| `dartz` | ^0.10.1 | Either 타입 (함수형 에러 처리) |
| `flutter_secure_storage` | ^9.2.2 | JWT 안전 저장 |
| `shared_preferences` | ^2.3.3 | 온보딩 방문 여부 저장 |

---

> **요약:** 백엔드 연동을 위해 변경해야 할 파일은 세 곳뿐이다.
> `api_endpoints.dart`의 `baseUrl`, `stock_remote_datasource.dart`의 `_useMock`, `prediction_remote_datasource.dart`의 `_useMock`.
> 나머지 계층(domain, presentation)은 건드리지 않아도 된다.
