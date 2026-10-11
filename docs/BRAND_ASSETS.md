# 브랜드와 화면 아이콘

## 네이버페이

2026-10-11에 [네이버페이 개발자센터 공식 로고 가이드](https://developers.pay.naver.com/design/brand/logo)에서 제공하는 파일을 확인했다. 종전의 일반 텍스트 `Npay`를 공식 심볼 이미지로 교체했다.

- 공식 다운로드: https://developers.pay.naver.com/img/logo/zip/npayLogos.zip
- 압축 파일 내 원본: `symbol/symbol_rd_sq_npaygr_large.svg`
- 프로젝트 파일: `src/assets/core-flow/npay-symbol.svg`
- 원본 크기: 140 × 140. 화면에서는 56 × 56으로 비율을 유지해 표시한다.
- 원본 경로·색상·여백을 수정하지 않았으며, 필터·자르기·텍스트 재현을 사용하지 않는다.
- 사용 위치: 포인트 샵의 네이버페이 교환 상품, 상품 교환 확인.
- [활용 가이드](https://developers.pay.naver.com/design/brand/usage)와 [포인트 제휴 로고 사용 안내](https://npayad.naver.com/faqDetail/46)에 따라, 실제 출시 전 운영 담당자가 제휴 계약과 필요한 로고 검수를 확인해야 한다. 이 저장소의 이미지 반영은 제휴·검수 완료를 의미하지 않는다.

향후 네이버페이 외 상품을 추가하면 상품 제공자를 식별할 수 있는 API 필드를 합의하고 해당 공식 자산을 매핑해야 한다. 현재 카탈로그와 상품 로고는 네이버페이 상품을 기준으로 한다.

## 인터페이스 아이콘

`src/js/ui/icons.mjs`는 이 앱을 위해 작성한 SVG 아이콘이다. 기존 하단 내비게이션과 동일한 24px viewBox, 1.8px 선 두께, 둥근 선 끝을 사용한다. 텍스트를 대신하는 버튼으로 쓰지 않고, 항상 화면의 제목·메뉴·상태 설명과 함께 표시한다. 장식용 SVG에는 `aria-hidden="true"`, `focusable="false"`를 지정했다.

기본 색은 Candle의 파란색과 연한 배경이다. 완료 상태에만 기존 초록색을 사용하고, 지출은 중립색과 ‘사용’ 문구로 구분한다. 순위·배지·달력 등 서버 데이터에 없는 성과를 꾸며서 표시하지 않는다.
