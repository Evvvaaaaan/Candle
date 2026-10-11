export default function render(context) {
  const {
    data,
    state,
    stock,
    totalTickets,
    todayPrediction,
    isOpen,
    button,
    empty,
    title,
    shell,
    stockCard,
  } = context;
  if (!state.attempt || !stock() || !isOpen() || !totalTickets() || todayPrediction(stock().code))
    return shell(
      'confirm',
      empty('예측 상태가 변경되었어요. 종목과 방향을 다시 확인해 주세요.', 'prediction', '예측 화면으로'),
      'prediction'
    );
  return shell(
    'confirm',
    `${title('예측 확인')}${stockCard(false)}<section class="summary-card"><p class="sheet-title">${state.attempt.direction === 'up' ? '상승' : '하락'} 예측을 제출할까요?</p><p class="sheet-copy">${data.tickets.free ? '기본 무료권' : '광고 예측권'} 1장 사용 · 제출 후 ${totalTickets() - 1}회 남음</p><div class="sheet-actions">${button('취소', 'prediction', 'secondary-button')}<button id="submit-prediction" class="primary-button" type="button">예측 제출</button></div></section>`,
    'prediction'
  );
}
