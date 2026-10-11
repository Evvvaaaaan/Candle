export default function render(context) {
  const { e, n, data, empty, title, more, shell, pointsCard } = context;
  return shell(
    'wallet',
    `${title('포인트 내역')}${pointsCard()}${data.wallet.items.map((t) => `<section class="card"><div class="row-between"><strong>${e(t.title)}</strong><span>${t.amount > 0 ? '+' : ''}${n(t.amount)}P</span></div><p class="card-label">${e(t.createdAt.slice(0, 10))}</p></section>`).join('') || empty('아직 포인트 변동 내역이 없어요.')}${more('wallet')}`,
    'profile'
  );
}
