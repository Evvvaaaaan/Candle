export default function render(context) {
  const { e, n, data, button, title, shell } = context;
  const m = data.missions;
  return shell(
    'missions',
    `${title('오늘의 미션', '출석과 활동 현황을 확인하세요.')}<section class="card attendance-card"><p class="card-label">연속 출석</p><p class="number">${m.streak}일째</p><button id="attendance" class="primary-button" type="button"${m.attended ? ' disabled' : ''}>${m.attended ? '출석 완료' : '오늘 출석하기'}</button></section>${m.items.map((x) => `<section class="card mission-row"><div class="row-between"><strong>${e(x.title)}</strong><span>${n(x.points)}P</span></div><p>${x.complete ? '완료' : '참여 전'}</p></section>`).join('')}`,
    'missions'
  );
}
