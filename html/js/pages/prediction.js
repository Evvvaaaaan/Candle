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
        '상승·하락의 answer 코드가 확인되지 않아 제출하지 않았습니다. 교수님 확인 후 설정해 주세요.'
      );
    busy = true;
    submit.disabled = true;
    dialog.close();
    try {
      await CandleApi.predict(loadedId, answers[selection.direction]);
      ui.announce('예측이 접수되었습니다.');
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
