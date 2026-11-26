/* 보상형 광고: 앱(FlutterBridge)이 광고를 띄우고, 지급은 AdMob SSV 콜백(/v1/api/reward/callback)이
   서버에서 처리합니다. 웹은 지급 결과(/api/heart/count의 ad 증가)만 확인합니다. */
(() => {
  const ui = CandleUI,
    api = CandleApi;
  const AD_LIMIT = 10;
  let before = null,
    watching = false,
    checking = null;
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function refresh() {
    const row = await api.tickets();
    if (ui.$('[data-server-value="tickets"],#reward-ad-dialog')) ui.setTickets(row);
    ui.$$('[data-reward-ad],#start-reward-ad').forEach((button) => {
      button.disabled = row.ad >= AD_LIMIT;
    });
    return row;
  }
  /* SSV 콜백은 광고 종료와 비동기로 도착하므로 몇 번 나눠 확인합니다. */
  function verify_ad() {
    if (checking) return checking;
    checking = (async () => {
      try {
        for (let attempt = 0; attempt < 5; attempt++) {
          const row = await refresh();
          if (before != null && row.ad > before) {
            before = row.ad;
            watching = false;
            ui.announce(`예측권 1장이 지급되었어요. 보유 예측권 ${ui.number(row.amount)}회`);
            return true;
          }
          if (!watching && before == null) return false;
          await wait(2000);
        }
        ui.announce('아직 광고 완료가 확인되지 않았어요. 잠시 후 다시 확인해 주세요.');
        return false;
      } catch (error) {
        ui.report(error);
        return false;
      } finally {
        checking = null;
      }
    })();
    return checking;
  }
  async function show_rewardad() {
    if (!window.FlutterBridge) {
      ui.announce('광고 시청은 Candle 앱에서 이용할 수 있습니다.');
      return;
    }
    try {
      const [user, row] = await Promise.all([api.user(), refresh()]);
      if (row.ad >= AD_LIMIT) return ui.announce('오늘 광고 시청 횟수를 모두 사용했어요.');
      if (user?.id == null) throw { status: 502 };
      before = row.ad;
      watching = true;
      flutter_showRewardAd(ui.page, user.id);
    } catch (error) {
      ui.report(error);
    }
  }
  window.flutter_listener_rewardAd = () => {
    if (watching) verify_ad();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && watching) verify_ad();
  });
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.id === 'start-reward-ad') {
      button.closest('dialog')?.close();
      show_rewardad();
    }
    if (button.id === 'verify-ad') {
      if (before == null) {
        refresh()
          .then((row) => ui.announce(`오늘 광고 예측권 ${row.ad} / ${AD_LIMIT}회 · 보유 ${ui.number(row.amount)}회`))
          .catch(ui.report);
      } else verify_ad();
    }
  });
  Object.assign(window, { show_rewardad, verify_ad });
  CandleAuth.ready.then((ok) => {
    if (ok) refresh().catch(ui.report);
  });
})();
