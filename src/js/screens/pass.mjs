export default function render(context) {
  const { data, totalTickets, button, title, shell, ticketSummary } = context;
  const t = data.tickets;
  return shell(
    'pass',
    `${title('추가 예측권', '영상 광고의 완료가 확인되면 예측권을 받을 수 있습니다.')}<section class="card balance-card ticket-wallet"><strong class="ticket-total">${totalTickets()}회</strong>${ticketSummary()}</section><section class="card ad-progress"><p>오늘의 광고 참여</p><p class="number">${t.adCount} / ${t.adLimit}회</p></section><section class="card promo-card"><h2>${t.adCount < t.adLimit ? '광고 보고 예측권 받기' : '오늘 참여를 마쳤어요'}</h2><p>광고 시청을 끝까지 완료하면 예측권이 지급됩니다.</p><button id="watch-ad" class="primary-button" type="button"${t.adCount < t.adLimit ? '' : ' disabled'}>광고 시작하기</button></section>${button('예측하러 가기', 'prediction', 'secondary-button')}`,
    'prediction'
  );
}
