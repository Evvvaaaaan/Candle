import { uiIcon } from '../ui/icons.mjs';

const claimLabels = {
  REQUESTED: '신청 접수',
  PROCESSING: '처리 중',
  PAID: '지급 완료',
  FAILED: '지급 실패',
  REJECTED: '반려',
  CANCELED: '취소',
};
const tabs = [
  ['all', '전체'],
  ['earn', '적립'],
  ['use', '사용'],
];

export default function render(context) {
  const { e, n, data, state, empty, title, more, shell, pointsCard } = context;
  const claims = new Map(data.claims.items.map((c) => [c.id, c]));
  // Refunds carry a claimId, so they stay with the exchange they belong to.
  const items = data.wallet.items.filter((t) =>
    state.walletTab === 'earn'
      ? t.amount > 0 && !t.claimId
      : state.walletTab === 'use'
        ? t.amount < 0 || t.claimId
        : true
  );
  const emptyState = {
    all: () => empty('아직 포인트 변동 내역이 없어요.', 'missions', '미션 확인하기'),
    earn: () => empty('아직 적립한 포인트가 없어요.', 'missions', '미션 확인하기'),
    use: () => empty('아직 교환 신청 내역이 없어요.', 'shop', '상품 보기'),
  }[state.walletTab];
  return shell(
    'wallet',
    `${title('포인트 내역', '모은 포인트와 사용 내역을 확인하세요.')}${pointsCard(false)}
    <div class="tabs wallet-tabs" role="group" aria-label="내역 구분">${tabs.map(([id, label]) => `<button class="tab${id === state.walletTab ? ' active' : ''}" type="button" data-wallet-tab="${id}" aria-pressed="${id === state.walletTab}">${label}</button>`).join('')}</div>
    <div class="transaction-list">
      ${
        items
          .map((t) => {
            const claim = claims.get(t.claimId);
            const label =
              t.claimId && t.amount > 0
                ? '환급'
                : claim
                  ? claimLabels[claim.status]
                  : t.amount > 0
                    ? '적립'
                    : t.amount < 0
                      ? '사용'
                      : '변동 없음';
            return `<section class="card wallet-transaction">
        <span class="icon-tile ${t.amount > 0 ? '' : 'neutral'}">${uiIcon(t.amount > 0 ? 'incoming' : 'outgoing')}</span>
        <div class="transaction-copy"><h3>${e(claim?.title ?? t.title)}</h3><time datetime="${e(t.createdAt)}">${e(t.createdAt.slice(0, 10).replaceAll('-', '.'))}</time></div>
        <div class="transaction-amount ${t.amount > 0 ? 'earned' : ''}"><strong>${t.amount > 0 ? '+' : ''}${n(t.amount)}<small>P</small></strong><span>${label}</span></div>
      </section>`;
          })
          .join('') || emptyState()
      }
    </div>${more('wallet')}`,
    'profile'
  );
}
