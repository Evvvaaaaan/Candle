(() => {
  const ui = CandleUI,
    dialog = ui.$('#prediction-review-dialog'),
    submit = ui.$('#submit-prediction');
  let loadedId = null,
    version = 0,
    busy = false;
  async function detail_topic() {
    const id = ui.selection().topicId,
      current = ++version;
    loadedId = null;
    if (!id) {
      ui.navigate('stock-select', { from: 'home', return: 'prediction' });
      return;
    }
    try {
      const topic = await CandleApi.topic(id);
      if (current !== version || ui.selection().topicId !== id) return;
      loadedId = id;
      ui.setTopicDetail(topic);
    } catch (error) {
      ui.report(error);
    }
  }
  async function create_topicroundpredict() {
    if (busy) return;
    const selection = ui.selection(),
      answers = CANDLE_BACKEND_CONFIG.predictionAnswers;
    if (loadedId !== selection.topicId) return ui.announce('종목 정보를 조회한 후 제출해 주세요.');
    if (
      !Number.isInteger(answers.up) ||
      !Number.isInteger(answers.down) ||
      answers.up === answers.down
    )
      return ui.announce(
        '상승·하락의 answer 코드가 설정되지 않아 제출하지 않았습니다.'
      );
    busy = true;
    submit.disabled = true;
    dialog.close();
    try {
      const id = await CandleApi.predict(loadedId, answers[selection.direction]);
      ui.announce(
        {
          '-100': '예측 마감 시간이 지났습니다. 다음 거래일 회차에 참여해 주세요.',
          '-110': '이미 참여한 종목이에요. 접수된 예측은 변경할 수 없어요.',
          '-130': '오늘은 10회까지 참여할 수 있어요. 내일 다시 도전해 주세요.',
          '-120': '예측권이 부족합니다. 광고를 보고 예측권을 받아 주세요.',
        }[id] || '예측이 접수되었습니다.'
      );
      ui.setTickets(await CandleApi.tickets());
    } catch (error) {
      ui.report(error);
    } finally {
      busy = false;
      submit.disabled = false;
    }
  }
  submit.addEventListener('click', () => {
    dialog.close();
    create_topicroundpredict();
  });
  Object.assign(window, { detail_topic, create_topicroundpredict });
  window.CandlePageReady = CandleAuth.ready.then(async (ok) => {
    if (ok) {
      const results = await Promise.allSettled([
        detail_topic(),
        CandleApi.tickets().then(ui.setTickets),
      ]);
      results
        .filter((result) => result.status === 'rejected')
        .forEach((result) => ui.report(result.reason));
    }
  });
})();
