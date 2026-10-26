# Candle

주식 방향(상승/하락)을 예측하고 포인트를 네이버페이로 교환하는 모바일 웹 프론트엔드입니다.
빌드 없이 정적 파일로 동작합니다.

## 실행

```sh
python3 -m http.server 3000
```

`http://localhost:3000/index.html` 접속 → 2초 후 `signup.html`.

> `file://`로 직접 열면 로그인이 동작하지 않습니다(`crypto.randomUUID` 제약). 반드시 HTTP로 서빙하세요.

## 백엔드 연결

`js/backend-config.js`

```js
baseUrl: '',                                  // 백엔드 origin (/api 제외)
predictionAnswers: { up: null, down: null },  // 미확정 → 제출 차단
```

- 페이지를 백엔드와 같은 오리진에서 서빙하면 `''` 그대로 사용합니다.
- 별도 오리진이면 `'http://localhost:8080'`처럼 지정하고, 백엔드에서 아래를 허용해야 합니다.
  - 허용 헤더: `Content-Type`, `Authorization`, `RefreshToken`
  - 노출 헤더: `Authorization`, `RefreshToken`

## 로그인

- 앱: Flutter 채널(`KakaoLogin` 등)로 소셜 로그인
- 브라우저: `signup.html`의 **개발용 임시 로그인** 사용

## 폴더

```
*.html       화면 1개 = 파일 1개
css/         reset · style · static
js/          backend-config, api, auth, common, pages/
default/     jQuery, Flutter 브리지, AJAX 전송 계층
images/      로고·아이콘
fonts/       로컬 웹폰트
```

## 현재 범위

- 연결됨: 로그인, 세션 갱신, 유저·잔액·예측권·알림, 종목 검색/상세
- 미연결: 포인트 내역, 지급 신청, 광고 보상, 출석, 미션 (안내 문구만 표시)
- 예측 접수는 `predictionAnswers`가 `null`이라 전송되지 않습니다.
- `confirm` · `submitted` · `result` · `index2` · `prediction2` · `history`는 리다이렉트 전용입니다.
