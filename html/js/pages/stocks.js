(() => {
  const ui = CandleUI,
    input = ui.$('#stock-search-input'),
    list = ui.$('#stock-select-list');
  let market = 'all',
    version = 0,
    timer;
  input.value = ui.params.get('q') || '';
  ui.text('#stock-top-note', '서버에서 조회한 종목입니다.');
  function render(rows) {
    const fragment = document.createDocumentFragment();
    for (const topic of rows) {
      const link = Object.assign(document.createElement('a'), {
        className: 'stock-select-row',
        href: ui.href(ui.params.get('return') === 'home' ? 'home' : 'prediction', {
          id: topic.id,
          from: 'stock-select',
        }),
      });
      link.dataset.topicId = topic.id;
      link.dataset.stockCode = topic.code;
      const symbol = Object.assign(document.createElement('span'), {
        className: 'stock-symbol',
        textContent: topic.title.slice(0, 1),
      });
      const copy = Object.assign(document.createElement('span'), { className: 'stock-row-copy' });
      copy.append(
        Object.assign(document.createElement('strong'), { textContent: topic.title }),
        Object.assign(document.createElement('small'), {
          textContent: `${topic.code} · ${topic.market || topic.cate}`,
        })
      );
      link.append(
        symbol,
        copy,
        Object.assign(document.createElement('span'), {
          className: 'stock-row-state',
          textContent: topic.id === ui.selection().topicId ? '선택됨' : '선택',
        })
      );
      link.addEventListener('click', () => ui.chooseTopic(topic));
      fragment.append(link);
    }
    list.replaceChildren(fragment);
    list.hidden = rows.length === 0;
    list.setAttribute('aria-busy', 'false');
    ui.text('#stock-result-count', `${rows.length}개`);
    ui.$('#stock-empty').hidden = rows.length > 0;
    ui.text(
      '#stock-empty',
      market === 'watchlist'
        ? '관심종목이 없습니다. 예측 화면의 책갈피로 추가해 보세요.'
        : '검색 결과가 없습니다.'
    );
  }
  async function search_topic() {
    const current = ++version;
    list.setAttribute('aria-busy', 'true');
    if (market === 'watchlist') {
      const q = input.value.trim().toLocaleLowerCase('ko-KR');
      render(
        ui
          .watchlist()
          .filter((row) => `${row.code} ${row.title}`.toLocaleLowerCase('ko-KR').includes(q))
      );
      return;
    }
    try {
      const rows = await CandleApi.topics(input.value.trim(), market);
      if (current === version) render(rows);
    } catch (error) {
      if (current === version) {
        list.setAttribute('aria-busy', 'false');
        ui.report(error);
      }
    }
  }
  input.addEventListener('input', () => {
    clearTimeout(timer);
    version++;
    timer = setTimeout(search_topic, 250);
  });
  ui.$$('[data-market]').forEach((button) =>
    button.addEventListener('click', () => {
      market = button.dataset.market;
      clearTimeout(timer);
      ui.$$('[data-market]').forEach((node) => {
        node.classList.toggle('active', node === button);
        node.setAttribute('aria-pressed', String(node === button));
      });
      ui.text('#stock-list-title', market === 'watchlist' ? '관심종목' : '국내 종목');
      search_topic();
    })
  );
  window.search_topic = search_topic;
  window.search_banner = async () =>
    document.dispatchEvent(
      new CustomEvent('candle:banners', { detail: await CandleApi.banners() })
    );
  CandleAuth.ready.then((ok) => {
    if (ok) {
      search_topic();
      search_banner().catch(ui.report);
    }
  });
})();
