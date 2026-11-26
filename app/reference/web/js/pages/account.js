(() => {
  const ui = CandleUI,
    api = CandleApi;
  window.latest_myreward = async () => ui.setBalance(await api.balance());
  window.count_myheart = async () => ui.setTickets(await api.tickets());
  window.detail_myuser = async () => {
    const row = await api.user();
    if (typeof row?.nick === 'string') ui.text('#profile .account-copy > strong', row.nick);
    if (row?.allowalarmdevice === false || row?.allowalarmdevice === 'false')
      flutter_cancelAllNoti();
  };
  window.count_myalarm = async () => {
    const row = await api.alarm();
    ui.$$('.header-account').forEach((button) =>
      button.classList.toggle('has-new', row?.hasNew === true)
    );
  };
  /* 연승·적중률은 /api/streak (채점된 예측 기준) */
  window.detail_mystreak = async () => {
    const row = await api.streak();
    ui.text('[data-server-value="streak"]', ui.number(row.current));
    ui.text('[data-server-value="streak-remaining"]', ui.number(row.remaining));
    ui.$$('.streak-track li:not(.is-reward)').forEach((node, index) => {
      node.classList.toggle('is-done', index < row.current);
      node.classList.toggle('is-next', index === row.current);
    });
    const [current, best, rate] = ui.$$('#profile .stats-grid > div > strong');
    if (current) current.textContent = ui.number(row.current);
    if (best) best.textContent = ui.number(row.best);
    if (rate)
      rate.replaceChildren(
        row.hitrate == null ? '—' : String(Math.round(row.hitrate)),
        Object.assign(document.createElement('small'), { textContent: '%' })
      );
    ui.text(
      '#profile .stats-total > strong',
      `${ui.number(row.settledcount)}회 중 ${ui.number(row.hitcount)}회 적중`
    );
    return row;
  };
  window.CandlePageReady = CandleAuth.ready.then(async (ok) => {
    if (!ok) return;
    const jobs = [];
    if (['home', 'profile'].includes(ui.page)) jobs.push(detail_mystreak());
    if (ui.$('[data-server-value="balance"]')) jobs.push(latest_myreward());
    if (ui.$('[data-server-value="tickets"],#reward-ad-dialog')) jobs.push(count_myheart());
    if (['home', 'profile'].includes(ui.page)) jobs.push(detail_myuser());
    if (ui.page === 'home') {
      jobs.push(count_myalarm());
      if (ui.selection().topicId)
        jobs.push(api.topic(ui.selection().topicId).then(ui.setTopicDetail));
    }
    const results = await Promise.allSettled(jobs);
    results
      .filter((result) => result.status === 'rejected')
      .forEach((result) => ui.report(result.reason));
  });
})();
