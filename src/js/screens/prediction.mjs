export default function render(context) {
  const {
    data,
    stock,
    totalTickets,
    todayPrediction,
    isOpen,
    button,
    title,
    shell,
    ticketCard,
    rewardAdButton,
    directionCard,
    stockCard,
  } = context;
  const s = stock(),
    submitted = s && todayPrediction(s.code);
  return shell(
    'prediction',
    `${title(s?.name || '예측할 종목이 없어요', isOpen() ? '다음 거래일 종가를 예측해 보세요.' : '현재 참여 시간이 아닙니다.')}${stockCard()}${ticketCard()}${s ? `<div class="direction-grid">${directionCard('up', !!submitted || !isOpen())}${directionCard('down', !!submitted || !isOpen())}</div>${submitted ? `<div class="prediction-status"><p>오늘 이 종목은 예측을 마쳤어요.</p><button class="secondary-button" type="button" data-stock-picker>다른 종목 선택하기</button></div>` : totalTickets() ? button('예측 확인', 'confirm', 'primary-button', !isOpen()) : `<p class="ticket-policy">예측권이 없어요. 광고를 보고 선택한 예측을 이어가세요.</p>${rewardAdButton('광고 보고 예측 계속하기', !isOpen())}`}` : ''}<p class="ticket-policy">예측권은 제출할 때 사용되며, 접수 후에는 변경할 수 없어요.</p>`,
    'prediction'
  );
}
