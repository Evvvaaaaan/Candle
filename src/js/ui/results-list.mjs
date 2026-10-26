import { uiIcon } from './icons.mjs';

const resultLabels = { PENDING: '결과 대기', WON: '적중', LOST: '미적중', VOID: '무효' };

export default function renderResults(context, history = false) {
  const { e, n, data, button, empty, title, more, shell } = context;
  return shell(
    history ? 'prediction-history' : 'result',
    `${title(history ? '예측 내역' : '예측 결과', '확정된 결과와 보상을 확인하세요.')}${data.predictions.items.map((p) => `<section class="card result-card"><span class="icon-tile${p.status === 'WON' ? ' complete' : p.status === 'LOST' ? ' miss' : ''}">${uiIcon(p.status === 'WON' ? 'check' : p.status === 'LOST' ? 'alert' : p.status === 'PENDING' ? 'clock' : 'chart')}</span><div class="result-copy"><strong class="result-stock">${e(p.stockName)}</strong><p class="result-meta"><strong>${p.direction === 'up' ? '↗ 상승' : '↘ 하락'}</strong> · ${p.status === 'PENDING' ? '결과 확정 후 확인' : `${n(p.points)}P`}${p.status === 'WON' && p.points > 0 ? ` · <span class="result-hit">${resultLabels.WON}</span>` : p.status === 'LOST' && p.points > 0 ? ` · <span class="result-miss">${resultLabels.LOST}</span>` : ''}</p></div>${(p.status === 'WON' || p.status === 'LOST') && p.points > 0 ? `<button class="primary-button" type="button" data-claim="${e(p.id)}"${p.claimed ? ' disabled' : ''}>${p.claimed ? '수령 완료' : `${n(p.points)}P 받기`}</button>` : `<span class="badge${p.status === 'PENDING' ? ' pending' : p.status === 'WON' ? '' : p.status === 'LOST' ? ' miss' : ' muted'}">${resultLabels[p.status]}</span>`}</section>`).join('') || empty('아직 예측 내역이 없어요.', 'prediction', '예측 시작하기')}${more('predictions')}`,
    'prediction'
  );
}
