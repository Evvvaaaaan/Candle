import { uiIcon } from '../ui/icons.mjs';

export default function render(context) {
  const {
    n,
    data,
    totalTickets,
    rewardAdButton,
    stock,
    todayPrediction,
    isOpen,
    button,
    title,
    shell,
    pointsCard,
    directionCard,
    stockCard,
  } = context;
  return shell(
    'home',
    `${title('오늘의 종목을 예측해 보세요', isOpen() ? '다음 거래일 방향을 선택하세요.' : '현재 예측 참여 시간이 아닙니다.')}
    ${pointsCard()}
    <button class="home-ad-slot" type="button" data-route="prediction" aria-label="광고: Candle의 하루 1분 예측 살펴보기">
      <span class="home-ad-copy">
        <span class="home-ad-meta"><span>AD</span> 오늘의 브랜드 · Candle</span>
        <strong>하루 1분,<br>금융 감각을 키우는 습관</strong>
      </span>
      <span class="home-ad-action">살펴보기 <span aria-hidden="true">›</span></span>
    </button>
    <section class="card reward-ticket-entry" aria-label="예측권 충전">
      <div class="reward-ticket-heading"><span class="icon-tile">${uiIcon('gift')}</span><div><h2>사용 가능한 예측권 <strong>${n(totalTickets())}회</strong></h2><p>오늘 광고로 ${n(data.tickets.adLimit - data.tickets.adCount)}회 더 받을 수 있어요</p></div></div>
      ${rewardAdButton()}
    </section>
    ${stockCard(true, stock() ? `<div class="home-prediction"><div class="direction-grid">${directionCard('up', !isOpen() || !!todayPrediction(stock().code), false)}${directionCard('down', !isOpen() || !!todayPrediction(stock().code), false)}</div></div>` : '')}${button('예측 결과 확인', 'result', 'secondary-button')}`
  );
}
