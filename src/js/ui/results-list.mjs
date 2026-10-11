const resultLabels = { PENDING: '결과 대기', WON: '적중', LOST: '미적중', VOID: '무효' };

export default function renderResults(context, history = false) {
  const { e, n, data, button, empty, title, more, shell } = context;
  return shell(
    history ? 'prediction-history' : 'result',
    `${title(history ? '예측 내역' : '예측 결과', '확정된 결과와 보상을 확인하세요.')}${data.predictions.items.map((p) => `<section class="card result-card"><div class="row-between"><strong>${e(p.stockName)}</strong><span class="badge">${resultLabels[p.status]}</span></div><div class="summary-row"><span>내 예측</span><strong>${p.direction === 'up' ? '↗ 상승' : '↘ 하락'}</strong></div><p>${n(p.points)}P · ${p.claimed ? '수령 완료' : p.status === 'PENDING' ? '결과 확정 후 확인' : '확정된 보상'}</p>${p.status === 'WON' && p.points > 0 ? `<button class="primary-button" type="button" data-claim="${e(p.id)}"${p.claimed ? ' disabled' : ''}>${p.claimed ? '수령 완료' : `${n(p.points)}P 수령하기`}</button>` : ''}</section>`).join('') || empty('아직 예측 내역이 없어요.', 'prediction', '예측 시작하기')}${more('predictions')}`,
    'prediction'
  );
}
