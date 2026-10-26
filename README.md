# Candle

주식 종목의 다음 거래일 방향(상승/하락)을 예측하고, 적중하면 포인트를 받아 네이버페이로 교환하는 모바일 웹 서비스의 프론트엔드입니다.

## 바로 보기

`index.html`을 브라우저로 열면 됩니다. 서버, 설치, 인터넷 연결이 필요 없습니다.
화면, 스타일, 스크립트, 이미지, 폰트가 모두 이 파일 하나에 들어 있습니다.

- 처음에는 로그인 화면이 열립니다. 로그인 버튼 4개는 인증 없이 홈으로 이동합니다.
- 주소 끝에 `#home`, `#prediction`, `#shop` 등을 붙이면 해당 화면이 바로 열립니다.
- 서버가 필요한 버튼(예측 제출, 출석, 지급 신청 등)은 요청을 보내지 않고 "실제 서버 연결이 필요합니다"라고 안내합니다.
- 잔액, 연승, 예측권 수 같은 숫자는 디자인용 예시 값입니다.

## 폴더 구성

```
index.html            앱 전체 (화면 21개)
landing/              서비스 소개 페이지. landing/index.html을 열면 됩니다
docs/
  BACKEND.md          백엔드 연동 문서. HTML 연동 지점, API 규칙, 합의할 정책
  openapi.json        API 요청/응답 계약
  reference/          예전 버전의 API 호출 코드 (참고용)
CHANGELOG.md          변경 이력
```

백엔드 연동은 [docs/BACKEND.md](docs/BACKEND.md)부터 보시면 됩니다.

## 화면 목록

| 주소 | 화면 | 주요 내용 |
|---|---|---|
| `#splash` | 시작 | 로고와 시작 버튼 |
| `#signup` | 로그인 | 카카오·네이버·Google·Apple 로그인 |
| `#consent` | 가입 전 확인 | 전체 동의, 필수 약관 3개 |
| `#home` | 홈 | 연승 현황, 선택 종목과 상승/하락 버튼, 포인트·예측권, 미션·챌린지·광고 바로가기 |
| `#stock-select` | 종목 선택 | 검색, 코스피/코스닥/관심종목 필터 |
| `#prediction` | 예측 | 종목 정보, 예측권, 방향 선택, 관심종목 추가 |
| `#pass` | 예측권 | 보유 예측권, 광고 보고 예측권 받기 |
| `#ad` | 광고 | 광고 완료 확인 |
| `#result` | 결과 | 예측 결과와 보상 확인 |
| `#prediction-history` | 예측 내역 | 지난 예측과 보상 수령 |
| `#missions` | 미션 | 출석, 일일·주간 미션 |
| `#challenge` | 10연승 챌린지 | 참여 안내 |
| `#challenge-reward` | 리워드 수령 | 네이버 ID 입력, 동의, 수령 신청 |
| `#shop` | 포인트 상점 | 네이버페이 상품권 4종 |
| `#exchange` | 교환 확인 | 선택 상품과 보유 포인트 |
| `#payout` | 지급 신청 | 휴대폰 번호·이름 입력, 동의 |
| `#wallet` | 포인트 내역 | 전체/적립/사용 탭 |
| `#profile` | 내 정보 | 포인트, 연승·적중률, 메뉴 |
| `#settings` | 계정 설정 | 약관 보기, 튜토리얼 다시 보기, 로그아웃 |
| `#legal` | 약관 보기 | 약관 본문 |

홈에 들어가면 처음 한 번은 튜토리얼이, 그 뒤로는 지난 예측 결과 창이 뜹니다.
튜토리얼을 봤는지는 `localStorage`의 `candle.tutorial.seen`에 저장합니다.

## 수정 방법

`index.html` 안에서 바로 고치면 됩니다.

- **화면**: `<section class="screen-view" id="...">` 하나가 화면 하나입니다.
- **스타일**: `<head>`의 `<style>`. 색상은 `:root` 변수로 정의되어 있습니다.
- **동작**: 문서 끝의 `<script>`. 버튼은 `data-route`(화면 이동) 같은 `data-*` 속성으로 동작을 정합니다.
- **이미지**: `<script id="embedded-assets">`에 파일 이름별 data URI로 들어 있고, `<img data-embedded-asset="파일명">`이 이를 사용합니다.

### 디자인 토큰

| 변수 | 값 | 용도 |
|---|---|---|
| `--primary` | `#2563eb` | 주요 버튼, 강조 |
| `--primary-light` | `#dbeafe` | 강조 배경 |
| `--market-up` | `#168358` | 상승, 성공 |
| `--market-down` | `#dc2626` | 하락, 오류 |
| `--warning` | `#f59e0b` | 경고 |
| `--text-dark` / `--text-mid` / `--text-light` | `#0f172a` / `#64748b` / `#94a3b8` | 본문 / 보조 / 흐린 텍스트 |
| `--border` | `#e2e8f0` | 구분선 |
| `--surface-subtle` | `#f1f5f9` | 연한 배경 |

- 글꼴: Noto Sans KR(한글 UI), DM Mono(숫자). 둘 다 HTML에 들어 있습니다.
- 레이아웃: 최대 너비 480px의 모바일 화면. 넓은 화면에서는 가운데에 휴대폰 모양으로 표시됩니다.

## 출처와 라이선스

- **글꼴**: Noto Sans KR, DM Mono는 SIL Open Font License 1.1입니다. 라이선스 전문은 `index.html`의 `<style>` 첫 주석에 있습니다.
- **네이버페이 로고**: [네이버페이 개발자센터 공식 로고 가이드](https://developers.pay.naver.com/design/brand/logo)의 원본
  (`npayLogos.zip` 안의 `symbol/symbol_rd_sq_npaygr_large.svg`)을 수정 없이 사용했습니다. 포인트 상점과 교환 확인에 표시됩니다.
  [활용 가이드](https://developers.pay.naver.com/design/brand/usage)에 따라 실제 출시 전에 제휴 계약과 로고 검수를 확인해야 합니다.
- **인터페이스 아이콘**: 이 앱을 위해 직접 그린 SVG입니다. 장식용 아이콘에는 `aria-hidden="true"`를 붙였습니다.
