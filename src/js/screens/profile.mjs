import { uiIcon } from '../ui/icons.mjs';

export default function render(context) {
  const { e, n, session, data, title, shell, pointsCard } = context;
  const total = data.predictions.items.length,
    won = data.predictions.items.filter((p) => p.status === 'WON').length;
  return shell(
    'profile',
    `${title('내 정보')}
    <section class="card account-card">
      <span class="icon-tile account-avatar">${uiIcon('user')}</span>
      <div class="account-copy"><p class="card-label">반가워요</p><strong>${e(session.user.nickname)}</strong></div>
    </section>
    ${pointsCard()}
    <section class="card stats-card" aria-label="예측 기록">
      <div class="stats-grid">
        <div class="stat-current"><strong>${n(data.predictions.streak)}</strong><span class="stat-label">${uiIcon('chart')}현재 연승</span></div>
        <div><strong>${n(data.predictions.bestStreak)}</strong><span class="stat-label">${uiIcon('target')}최고 연승</span></div>
        <div><strong>${total ? Math.round((won / total) * 100) : '—'}<small>%</small></strong><span class="stat-label">${uiIcon('percent')}적중률</span></div>
      </div>
      <p class="stats-total"><span>조회된 예측</span><strong>${n(total)}회 중 ${n(won)}회 적중</strong></p>
    </section>
    <section class="card menu-card" aria-label="내 활동과 계정">
      ${[
        ['예측 내역', 'prediction-history', 'chart'],
        ['포인트 내역', 'wallet', 'wallet'],
        ['10연승 리워드', 'challenge-reward', 'target'],
        ['계정 · 약관', 'settings', 'settings'],
      ]
        .map(
          ([label, route, asset]) =>
            `<button type="button" class="menu-row" data-route="${route}"><span class="menu-label"><span class="icon-tile menu-icon">${uiIcon(asset)}</span>${label}</span>${uiIcon('chevron', 'menu-chevron')}</button>`
        )
        .join('<hr>')}
    </section>`,
    'profile'
  );
}
