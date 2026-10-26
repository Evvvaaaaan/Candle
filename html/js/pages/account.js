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
  window.CandlePageReady = CandleAuth.ready.then(async (ok) => {
    if (!ok) return;
    const jobs = [];
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
