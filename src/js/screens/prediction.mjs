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
    directionCard,
    stockCard,
  } = context;
  const s = stock(),
    submitted = s && todayPrediction(s.code);
  return shell(
    'prediction',
    `${title(s?.name || '예측할 종목이 없어요', isOpen() ? '다음 거래일 종가를 예측해 보세요.' : '현재 참여 시간이 아닙니다.')}${stockCard()}${ticketCard()}${s ? `<div class="direction-grid">${directionCard('up', !!submitted || !isOpen() || !totalTickets())}${directionCard('down', !!submitted || !isOpen() || !totalTickets())}</div>${submitted ? `<div class="prediction-status"><p>오늘 이 종목은 예측을 마쳤어요.</p><button class="secondary-button" type="button" data-stock-picker>다른 종목 선택하기</button></div>` : button(totalTickets() ? '예측 확인' : '예측권 받기', totalTickets() ? 'confirm' : 'pass', 'primary-button', !isOpen())}` : ''}<p class="ticket-policy">예측권은 제출할 때 사용되며, 접수 후에는 변경할 수 없어요.</p>`,
    'prediction'
  );
}
