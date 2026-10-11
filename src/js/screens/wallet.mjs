import { uiIcon } from '../ui/icons.mjs';

export default function render(context) {
  const { e, n, data, empty, title, more, shell, pointsCard } = context;
  return shell(
    'wallet',
    `${title('포인트 내역', '모은 포인트와 사용 내역을 확인하세요.')}${pointsCard(false)}
    <h2 class="section-title">이용 내역</h2>
    <div class="transaction-list">
      ${
        data.wallet.items
          .map(
            (t) => `<section class="card wallet-transaction">
        <span class="icon-tile ${t.amount > 0 ? '' : 'neutral'}">${uiIcon(t.amount > 0 ? 'incoming' : 'outgoing')}</span>
        <div class="transaction-copy"><h3>${e(t.title)}</h3><time datetime="${e(t.createdAt)}">${e(t.createdAt.slice(0, 10).replaceAll('-', '.'))}</time></div>
        <div class="transaction-amount ${t.amount > 0 ? 'earned' : ''}"><strong>${t.amount > 0 ? '+' : ''}${n(t.amount)}<small>P</small></strong><span>${t.amount > 0 ? '적립' : t.amount < 0 ? '사용' : '변동 없음'}</span></div>
      </section>`
          )
          .join('') || empty('아직 포인트 변동 내역이 없어요.', 'missions', '미션 확인하기')
      }
    </div>${more('wallet')}`,
    'profile'
  );
}
