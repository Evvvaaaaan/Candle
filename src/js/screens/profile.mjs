export default function render(context) {
  const { e, session, data, button, title, shell, pointsCard } = context;
  const total = data.predictions.items.length,
    won = data.predictions.items.filter((p) => p.status === 'WON').length;
  return shell(
    'profile',
    `${title('내 정보')}<section class="card account-card"><strong>${e(session.user.nickname)}</strong></section>${pointsCard()}<section class="card stats-card"><p>조회된 예측 내역</p><div class="stats-grid"><div><strong>${total}회</strong><span>예측</span></div><div><strong>${won}회</strong><span>적중</span></div></div></section><section class="card menu-card">${[
      ['예측 내역', 'prediction-history'],
      ['포인트 내역', 'wallet'],
      ['교환 내역', 'history'],
      ['계정 · 약관', 'settings'],
    ]
      .map(([label, r]) => button(label, r, 'menu-row'))
      .join('<hr>')}</section>`,
    'profile'
  );
}
