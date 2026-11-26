/* 미션: /api/mission 현황. 달성한 미션 포인트는 서버가 자동 지급합니다.
   일일 — 출석 10P, 광고 예측권 받기 10P / 주간 — 5일 출석 100P, 예측 3회 적중 150P */
(() => {
  const ui = CandleUI,
    api = CandleApi;
  const attendButton = ui.$('#attendance'),
    adLink = ui.$('.mission-action[data-route="pass"]'),
    [weeklyAttend, weeklyHit] = ui.$$('.mission-item.weekly');
  let busy = false;

  function progress(item, value, goal) {
    const label = item.querySelector('.mission-progress > span');
    const fill = item.querySelector('.progress-fill');
    label.textContent = value == null ? `— / ${goal}` : `${Math.min(value, goal)} / ${goal}`;
    fill.style.width = value == null ? '0' : `${(Math.min(value, goal) / goal) * 100}%`;
  }
  function render(status) {
    const byKey = Object.fromEntries([...status.daily, ...status.weekly].map((item) => [item.key, item]));
    const attended = byKey.attend?.done === true;
    attendButton.disabled = attended;
    attendButton.textContent = attended ? '완료' : '출석';
    attendButton.classList.toggle('primary', !attended);
    if (adLink) adLink.textContent = byKey.ad?.done ? '완료' : '하기';
    ui.text('.mission-summary-top > span', `${status.dailyDone} / ${status.dailyTotal} 완료`);
    const points = ui.$('.mission-summary-points');
    points.replaceChildren(
      ui.number(status.todayRemainingPoint),
      Object.assign(document.createElement('span'), { textContent: 'P' })
    );
    ui.$('.mission-summary .progress-fill').style.width =
      `${(status.dailyDone / Math.max(status.dailyTotal, 1)) * 100}%`;
    if (byKey['week-attend']) progress(weeklyAttend, byKey['week-attend'].progress, byKey['week-attend'].goal);
    if (byKey['week-hit']) progress(weeklyHit, byKey['week-hit'].progress, byKey['week-hit'].goal);
  }
  async function detail_mission() {
    render(await api.mission());
  }
  async function create_attend() {
    if (busy || attendButton.disabled) return;
    busy = true;
    attendButton.disabled = true;
    try {
      const row = await api.attendToday();
      await detail_mission();
      ui.announce(`출석 완료! 10P를 받았어요. ${row.streak}일 연속 출석 중이에요.`);
    } catch (error) {
      attendButton.disabled = false;
      ui.report(error);
    } finally {
      busy = false;
    }
  }
  attendButton.addEventListener('click', create_attend);
  progress(weeklyAttend, null, 5);
  progress(weeklyHit, null, 3);
  Object.assign(window, { create_attend, detail_mission });
  window.CandlePageReady = CandleAuth.ready.then(async (ok) => {
    if (ok) await detail_mission().catch(ui.report);
  });
})();
