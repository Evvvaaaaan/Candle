export default function render(context) {
  const { e, icon, data, state, totalTickets, button, empty, title, shell } = context;
  const p =
    data.predictions.items.find((p) => p.id === state.receiptId) ||
    data.predictions.items.find((p) => p.today);
  if (!p)
    return shell(
      'submitted',
      empty('아직 접수한 예측이 없어요.', 'prediction', '예측하러 가기'),
      'prediction'
    );
  return shell(
    'submitted',
    `${title('예측이 접수되었습니다')}<div class="success-state"><div class="success-icon"><img src="${icon('success-check.svg')}" alt=""></div><h2 class="success-title">${p.direction === 'up' ? '상승' : '하락'} 예측 접수 완료</h2><p class="success-caption">${e(p.stockName)}</p></div><section class="summary-card"><div class="summary-row"><span>예측 방향</span><strong>${p.direction === 'up' ? '↗ 상승' : '↘ 하락'}</strong></div><div class="summary-row"><span>사용 예측권</span><strong>${p.ticket === 'free' ? '기본 무료권' : '광고 예측권'} 1장</strong></div><div class="summary-row"><span>남은 예측권</span><strong>${totalTickets()}회</strong></div></section>${button('다른 종목 예측하기', 'prediction')}${button('홈으로', 'home', 'secondary-button')}`,
    'prediction'
  );
}
