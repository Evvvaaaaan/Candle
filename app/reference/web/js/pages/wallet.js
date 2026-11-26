(() => {
  const ui = CandleUI;
  const list = ui.$('#wallet-list'),
    more = ui.$('#wallet-more'),
    empty = ui.$('#wallet-empty');
  const SVG = 'http://www.w3.org/2000/svg';
  let tab = 'all',
    cursor = null,
    busy = false,
    exchanges = new Map(); // exchange id → process
  /* 교환 차감(exchange_{id})은 신청 상태로, 반려 환급(exchange_refund_{id})은 환급으로 표시합니다. */
  function label(item, earned) {
    if (item.code.startsWith('exchange_refund_')) return '환급';
    const match = /^exchange_(\d+)$/.exec(item.code);
    if (match)
      return { 0: '처리 중', 200: '지급 완료', 300: '반려' }[exchanges.get(Number(match[1]))] || '사용';
    return earned ? '적립' : '사용';
  }
  function icon(earned) {
    const svg = document.createElementNS(SVG, 'svg');
    for (const [key, value] of Object.entries({
      class: 'ui-icon',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.8',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    }))
      svg.setAttribute(key, value);
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', earned ? 'M18 6 6 18m0-8v8h8' : 'M6 18 18 6m-8 0h8v8');
    svg.append(path);
    const tile = Object.assign(document.createElement('span'), {
      className: earned ? 'icon-tile' : 'icon-tile miss',
    });
    tile.append(svg);
    return tile;
  }
  function row(item) {
    const earned = item.amount >= 0;
    const card = Object.assign(document.createElement('section'), {
      className: 'card wallet-transaction',
    });
    card.dataset.amount = String(item.amount);
    const copy = Object.assign(document.createElement('div'), { className: 'transaction-copy' });
    const day = item.createdAt.slice(0, 10);
    const time = Object.assign(document.createElement('time'), {
      textContent: day.replaceAll('-', '.'),
    });
    if (day) time.dateTime = day;
    copy.append(Object.assign(document.createElement('h3'), { textContent: item.title }), time);
    const amount = Object.assign(document.createElement('div'), {
      className: `transaction-amount ${earned ? 'earned' : 'spent'}`,
    });
    const strong = document.createElement('strong');
    strong.append(
      `${earned ? '+' : ''}${ui.number(item.amount)}`,
      Object.assign(document.createElement('small'), { textContent: 'P' })
    );
    amount.append(strong, Object.assign(document.createElement('span'), {
      textContent: label(item, earned),
    }));
    card.append(icon(earned), copy, amount);
    return card;
  }
  function filter() {
    let visible = 0;
    ui.$$('.wallet-transaction').forEach((card) => {
      const amount = Number(card.dataset.amount);
      card.hidden = tab === 'earn' ? amount < 0 : tab === 'use' ? amount >= 0 : false;
      if (!card.hidden) visible++;
    });
    empty.hidden = busy || visible > 0;
  }
  function select(next) {
    tab = ['all', 'earn', 'use'].includes(next) ? next : 'all';
    ui.$$('.wallet-tabs [data-wallet-tab]').forEach((button) => {
      const selected = button.dataset.walletTab === tab;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    history.replaceState(null, '', ui.href('wallet', { tab }));
    filter();
  }
  async function scroll_myreward() {
    if (busy) return;
    busy = true;
    more.disabled = true;
    list.setAttribute('aria-busy', 'true');
    try {
      const rows = await CandleApi.rewards(cursor);
      list.append(...rows.map(row));
      if (rows.length) cursor = rows[rows.length - 1].id;
      more.hidden = rows.length < 20;
    } catch (error) {
      ui.report(error);
    } finally {
      busy = false;
      more.disabled = false;
      list.setAttribute('aria-busy', 'false');
      filter();
    }
  }
  ui.$$('.wallet-tabs [data-wallet-tab]').forEach((button) =>
    button.addEventListener('click', () => select(button.dataset.walletTab))
  );
  more.addEventListener('click', scroll_myreward);
  select(ui.params.get('tab') || 'all');
  window.scroll_myreward = scroll_myreward;
  if (ui.params.get('requested') === '1') {
    ui.announce('교환 신청이 접수되었어요. 관리자 확인 후 지급됩니다.');
    ui.params.delete('requested');
  }
  CandleAuth.ready.then(async (ok) => {
    if (!ok) return list.setAttribute('aria-busy', 'false');
    try {
      exchanges = new Map((await CandleApi.myExchanges()).map((row) => [Number(row.id), row.process]));
    } catch (error) {
      ui.report(error);
    }
    scroll_myreward();
  });
})();
