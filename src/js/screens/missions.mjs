import { uiIcon } from '../ui/icons.mjs';

export default function render(context) {
  const { e, n, data, title, shell, empty } = context;
  const m = data.missions;
  return shell(
    'missions',
    `${title('오늘의 미션', '작은 참여로 포인트를 차곡차곡 모아보세요.')}
    <section class="card attendance-card">
      <div class="attendance-summary"><div><p class="card-label">연속 출석</p><p class="attendance-count">${n(m.streak)}<span>일째</span></p></div><span class="icon-tile attendance-icon">${uiIcon('calendar')}</span></div>
      <p class="attendance-copy">${m.attended ? '오늘 출석을 마쳤어요. 내일도 만나요!' : '오늘의 출석을 남기고 포인트를 받아보세요.'}</p>
      <button id="attendance" class="primary-button${m.attended ? ' attendance-complete' : ''}" type="button"${m.attended ? ' disabled' : ''}>${m.attended ? uiIcon('check') : ''}${m.attended ? '출석 완료' : '오늘 출석하기'}</button>
    </section>
    <div class="section-heading"><h2 class="section-title">참여 미션</h2><span>${m.items.filter((x) => x.complete).length} / ${m.items.length} 완료</span></div>
    ${
      m.items
        .map(
          (x) => `<section class="card mission-row">
      <span class="icon-tile ${x.complete ? 'complete' : ''}">${uiIcon(x.complete ? 'check' : 'target')}</span>
      <div class="mission-copy"><h3>${e(x.title)}</h3><span class="mission-status${x.complete ? ' complete' : ''}">${x.complete ? '미션 완료' : '참여 전'}</span></div>
      <span class="mission-reward">${n(x.points)}<small>P</small></span>
    </section>`
        )
        .join('') || empty('현재 참여 가능한 미션이 없어요.')
    }`,
    'missions'
  );
}
