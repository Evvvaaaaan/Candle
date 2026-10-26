/* Page navigation and local input state. No screen or account is fabricated here. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const page = $('.screen-view').dataset.screen;
  const params = new URLSearchParams(location.search);
  // 디자인 확인용: ?preview=1 이면 서버 인증을 건너뜁니다. 해제: localStorage.removeItem('candle.preview')
  if (params.has('preview')) localStorage.setItem('candle.preview', '1');
  const routes = new Set([
    'index',
    'signup',
    'consent',
    'home',
    'challenge',
    'challenge-reward',
    'stock-select',
    'prediction',
    'pass',
    'ad',
    'missions',
    'shop',
    'exchange',
    'profile',
    'payout',
    'prediction-history',
    'wallet',
    'settings',
    'legal',
    'legal-age',
    'legal-terms',
    'legal-privacy',
    'legal-reward',
  ]);
  const products = Object.fromEntries(
    [5000, 10000, 30000, 50000, 100000].map((amount) => [
      `naverpay-${amount}`,
      { amount, points: amount, title: `네이버페이 ${amount.toLocaleString('ko-KR')}원권` },
    ])
  );
  const read = (key, fallback) => {
    try {
      return JSON.parse(sessionStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const write = (key, value) => sessionStorage.setItem(key, JSON.stringify(value));
  const saved = read('candle.selection', {});
  const state = {
    id: typeof saved.id === 'string' ? saved.id : '',
    code: typeof saved.code === 'string' ? saved.code : '',
    title: typeof saved.title === 'string' ? saved.title : '',
    cate: typeof saved.cate === 'string' ? saved.cate : '',
    direction: saved.direction === 'down' ? 'down' : 'up',
    product: products[saved.product] ? saved.product : 'naverpay-5000',
  };
  if (params.has('id') && params.get('id') !== state.id)
    Object.assign(state, { id: params.get('id'), code: '', title: '', cate: '' });
  if (['up', 'down'].includes(params.get('direction'))) state.direction = params.get('direction');
  if (products[params.get('product')]) state.product = params.get('product');
  const savedWatchlist = read('candle.watchlist', []);
  let watchlist = (Array.isArray(savedWatchlist) ? savedWatchlist : []).filter(
    (row) =>
      row &&
      typeof row.id === 'string' &&
      typeof row.code === 'string' &&
      typeof row.title === 'string'
  );
  let balance = null;
  let quoteReady = false;
  const number = (value) => Number(value).toLocaleString('ko-KR');
  const text = (selector, value) =>
    $$(selector).forEach((node) => {
      node.textContent = value;
    });
  const market = (cate) =>
    ({ 110: '코스피', 120: '코스닥', 210: '나스닥', 310: '코인' })[String(cate)] ||
    String(cate || '');
  function announce(message, target = 'action-error') {
    let box = document.getElementById(target);
    if (!box) {
      box = Object.assign(document.createElement('p'), { id: target, className: 'action-error' });
      box.setAttribute('role', 'alert');
      $('#app').append(box);
    }
    box.textContent = message;
  }
  const requireServer = (action, target) =>
    announce(`${action}에는 실제 서버 연결이 필요합니다. 요청은 전송되지 않았습니다.`, target);
  const report = (error) => {
    if (error?.status === -1) return;
    announce(
      error?.status === 409
        ? '중복되거나 현재 상태에서 처리할 수 없는 요청입니다.'
        : [401, 403, 406].includes(error?.status)
          ? '로그인이 필요합니다. 다시 로그인해 주세요.'
          : '서버 요청을 완료하지 못했습니다. 다시 시도해 주세요.'
    );
  };
  function href(route, extra = {}) {
    route = route === 'splash' ? 'index' : route;
    if (!routes.has(route)) return 'signup.html';
    const query = new URLSearchParams();
    if (state.id) query.set('id', state.id);
    query.set('direction', state.direction);
    query.set('product', state.product);
    for (const [key, value] of Object.entries(extra))
      if (value != null && value !== '') query.set(key, String(value));
    return route + '.html' + (query.size ? '?' + query : '');
  }
  const navigate = (route, extra) => {
    location.href = href(route, extra);
  };
  const disable = (node, value) => {
    if (!node) return;
    if (node.tagName === 'BUTTON') node.disabled = value;
    else {
      node.setAttribute('aria-disabled', String(value));
      node.tabIndex = value ? -1 : 0;
    }
  };
  function syncLinks() {
    $$('a[data-route]').forEach((link) => {
      let route = link.dataset.route;
      let extra = {};
      if (
        link.classList.contains('back-button') &&
        [
          'stock-select',
          'prediction',
          'pass',
          'challenge-reward',
          'prediction-history',
          'legal',
        ].includes(page)
      ) {
        const from = params.get('from');
        if (routes.has(from) && from !== page) route = from;
      }
      if (route === 'stock-select') extra = { from: page, return: 'prediction' };
      if (['pass', 'challenge-reward', 'prediction-history'].includes(route)) extra.from = page;
      link.href = href(route, extra);
    });
    $$('a[data-stock-picker]').forEach((link) => {
      link.href = href('stock-select', { from: page, return: page });
    });
  }
  function syncProducts() {
    const product = products[state.product];
    text('[data-product-title-value]', product.title);
    text('[data-product-amount-value]', `${number(product.amount)}원권`);
    text('[data-product-points-value]', `${number(product.points)}P`);
    const amount = $('[data-payout-amount-value]');
    if (amount)
      amount.replaceChildren(
        document.createTextNode(number(product.amount)),
        Object.assign(document.createElement('span'), { textContent: '원' })
      );
    $$('[data-product]').forEach((button) => {
      const cost = Number(button.dataset.productPoints);
      button.disabled = balance === null || cost > balance;
      button.setAttribute(
        'aria-pressed',
        String(!button.disabled && button.dataset.product === state.product)
      );
      let label = button.querySelector('.product-state');
      if (!label && button.disabled) {
        label = Object.assign(document.createElement('span'), { className: 'product-state' });
        button.append(label);
      }
      if (label)
        label.textContent =
          balance === null ? '조회 필요' : cost > balance ? `${number(cost - balance)}P 부족` : '';
    });
    text('.product-submit', `${number(product.amount)}원 교환하기`);
    disable($('.product-submit'), balance === null || product.points > balance);
  }
  function syncSelection() {
    text('[data-stock-name-value]', state.title || '종목을 선택해 주세요');
    text('[data-stock-meta-value]', state.code ? `${state.code} · ${market(state.cate)}` : '—');
    $$('[data-direction-value]').forEach((node) => {
      node.textContent = state.direction === 'up' ? '상승' : '하락';
      node.className = state.direction === 'up' ? 'up-text' : 'down-text';
    });
    $$('.direction-card[data-direction]:not(.home-direction)').forEach((button) => {
      const selected = button.dataset.direction === state.direction;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $$('[data-prediction-review],.home-direction,[data-watchlist-toggle]').forEach((button) => {
      button.disabled = !quoteReady;
    });
    $$('[data-watchlist-toggle]').forEach((button) => {
      const selected = watchlist.some((row) => row.id === state.id);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', selected ? '관심종목에서 삭제' : '관심종목에 추가');
    });
    if (state.id) params.set('id', state.id);
    else params.delete('id');
    params.set('direction', state.direction);
    params.set('product', state.product);
    history.replaceState(null, '', location.pathname + '?' + params);
    write('candle.selection', state);
    syncProducts();
    syncLinks();
  }
  function chooseTopic(topic) {
    Object.assign(state, {
      id: String(topic.id),
      code: topic.code,
      title: topic.title,
      cate: String(topic.cate),
      direction: state.direction,
    });
    syncSelection();
  }
  function setTopicDetail(topic) {
    if (String(topic.id) !== state.id) return;
    quoteReady = true;
    chooseTopic(topic);
    const price = `${number(topic.price)}원`,
      rate = `${Number(topic.rate) > 0 ? '+' : ''}${Number(topic.rate)}%`;
    text('[data-server-value="price"]', price);
    text('[data-server-value="change"]', rate);
    text('#prediction .quote-row > span:last-child', `${price} ${rate}`);
    text('#prediction-review-dialog .summary-row:nth-child(3) strong', `${price} ${rate}`);
  }
  function setBalance(value) {
    balance = value;
    text('[data-server-value="balance"]', `${number(value)} P`);
    syncProducts();
  }
  function setTickets(row) {
    text('[data-server-value="tickets"]', `${number(row.amount)}회`);
    text('#pass .ad-count', `오늘 ${row.ad} / 10회`);
    const fill = $('#pass .progress-fill');
    if (fill) fill.style.width = `${row.ad * 10}%`;
    const remaining = $('#reward-ad-dialog .reward-ad-allowance > strong');
    if (remaining)
      remaining.replaceChildren(
        document.createTextNode(String(10 - row.ad)),
        Object.assign(document.createElement('span'), { textContent: ' / 10회' })
      );
  }
  const triggers = new Map();
  function openDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog) {
      triggers.set(id, document.activeElement);
      dialog.showModal();
    }
  }
  $$('dialog').forEach((dialog) => {
    dialog.addEventListener('close', () => triggers.get(dialog.id)?.focus({ preventScroll: true }));
    dialog.addEventListener('click', (event) => {
      const r = dialog.getBoundingClientRect();
      if (
        event.target === dialog &&
        (event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom)
      )
        dialog.close();
    });
  });
  const legalTitles = {
    age: '만 14세 이상입니다',
    terms: '서비스 이용약관 동의',
    privacy: '개인정보 처리방침 동의',
    reward: '지급 안내 및 개인정보 동의',
  };
  document.addEventListener('click', (event) => {
    const control = event.target.closest('button,a');
    if (!control || control.disabled) return;
    if (control.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    if (control.dataset.legal && $('#legal-dialog')) {
      event.preventDefault();
      text('#legal-dialog-title', legalTitles[control.dataset.legal]);
      openDialog('legal-dialog');
    }
    if (control.dataset.closeDialog) document.getElementById(control.dataset.closeDialog).close();
    if (['cancel-reward-ad', 'cancel-prediction-review'].includes(control.id))
      control.closest('dialog').close();
    if (control.hasAttribute('data-reward-ad')) openDialog('reward-ad-dialog');
    if (control.id === 'start-reward-ad') {
      control.closest('dialog').close();
      requireServer('광고 재생 및 예측권 지급');
    }
    if (control.hasAttribute('data-prediction-review')) openDialog('prediction-review-dialog');
    if (control.dataset.direction) {
      state.direction = control.dataset.direction;
      syncSelection();
      if (page === 'home') navigate('prediction', { from: 'home' });
    }
    if (control.dataset.product) {
      state.product = control.dataset.product;
      syncSelection();
    }
    if (control.hasAttribute('data-watchlist-toggle')) {
      watchlist = watchlist.some((row) => row.id === state.id)
        ? watchlist.filter((row) => row.id !== state.id)
        : [...watchlist, { id: state.id, code: state.code, title: state.title, cate: state.cate }];
      write('candle.watchlist', watchlist);
      syncSelection();
    }
    if (control.hasAttribute('data-claim')) requireServer('보상 수령');
    if (control.dataset.walletTab && page !== 'wallet')
      navigate('wallet', { tab: control.dataset.walletTab });
    const actions = {
      attendance: '출석 확인 및 보상 지급',
      'verify-ad': '광고 완료 확인',
      'retry-reward': '당첨 및 수령 자격 확인',
    };
    if (actions[control.id]) requireServer(actions[control.id]);
  });
  // Do not retain recipient information or previous account values in the back cache.
  window.addEventListener('pagehide', () => {
    $$('form').forEach((form) => form.reset());
    $$('input[type="checkbox"]').forEach((input) => {
      input.checked = false;
    });
    text('[data-server-value]', '—');
    text('#profile .account-copy > strong', '서버 연결 필요');
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) location.reload();
  });
  text('[data-server-value]', '—');
  text('.ticket-breakdown strong', '—');
  text('#profile .stats-card strong', '—');
  $$('.streak-track li:not(.is-reward)').forEach((node, index) => {
    node.className = '';
    node.textContent = String(index + 1);
  });
  text('#pass .ad-count', '오늘 — / 10회');
  text('#prediction .quote-row > span:last-child', '— —');
  const allowance = $('#reward-ad-dialog .reward-ad-allowance > strong');
  if (allowance)
    allowance.replaceChildren(
      document.createTextNode('—'),
      Object.assign(document.createElement('span'), { textContent: ' / 10회' })
    );
  syncSelection();
  window.CandleUI = {
    $,
    $$,
    page,
    params,
    number,
    text,
    announce,
    requireServer,
    report,
    href,
    navigate,
    disable,
    openDialog,
    chooseTopic,
    setTopicDetail,
    setBalance,
    setTickets,
    syncSelection,
    selection: () => ({
      topicId: state.id,
      stockCode: state.code,
      direction: state.direction,
      productId: state.product,
    }),
    watchlist: () => watchlist,
  };
})();
