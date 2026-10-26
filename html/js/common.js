/* Shared display/input behavior. Business requests belong to each HTML page. */
(function () {
  'use strict';

  const selectionKey = 'candle.handoff.selection';
  const query = new URLSearchParams(location.search);
  const page = document.querySelector('.screen-view').dataset.screen;
  const routes = new Set([
    'index',
    'splash',
    'signup',
    'consent',
    'home',
    'challenge',
    'challenge-reward',
    'stock-select',
    'prediction',
    'confirm',
    'submitted',
    'pass',
    'ad',
    'result',
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
  let saved = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(selectionKey)) || {};
  } catch {}
  // Defaults describe UI options. A topic ID is carried only when supplied by the server.
  const state = {
    topicId: '',
    stockCode: '005930',
    stockName: '삼성전자',
    stockMarket: '코스피',
    direction: 'up',
    productId: 'naverpay-5000',
    productTitle: '네이버페이 5,000원권',
    productAmount: '5000',
    productPoints: '5000',
    stockReturn: 'home',
    stockBack: 'home',
    walletTab: 'all',
    watchlist: [],
  };
  const fields = Object.keys(state).filter((key) => key !== 'watchlist');
  for (const key of fields) {
    const value = query.get(key) ?? saved[key];
    if (typeof value === 'string' && value.length <= 120) state[key] = value;
  }
  state.watchlist = Array.isArray(saved.watchlist)
    ? saved.watchlist.filter((x) => typeof x === 'string')
    : [];
  if (!['up', 'down'].includes(state.direction)) state.direction = 'up';
  for (const key of ['stockReturn', 'stockBack']) {
    if (!routes.has(state[key])) state[key] = 'home';
  }
  state.walletTab = query.get('tab') || (location.pathname.endsWith('/history.html') ? 'use' : 'all');
  if (!['all', 'earn', 'use'].includes(state.walletTab)) state.walletTab = 'all';
  for (const key of ['productAmount', 'productPoints']) {
    if (!/^\d{1,9}$/.test(state[key])) state[key] = '5000';
  }
  const save = () => {
    try {
      sessionStorage.setItem(selectionKey, JSON.stringify(state));
    } catch {}
  };
  const announce = (message, target = 'action-error') => {
    let box = document.getElementById(target);
    if (!box) {
      box = document.createElement('p');
      box.id = target;
      box.className = 'action-error';
      box.setAttribute('role', 'alert');
      document.getElementById('app').append(box);
    }
    box.textContent = message;
  };
  const requireServer = (action) =>
    announce(`${action}에는 실제 서버 연결이 필요합니다. 요청은 전송되지 않았습니다.`);
  const action = (name, label) => {
    if (typeof window[`listener_${name}`] === 'function') window[`listener_${name}`]();
    else requireServer(label);
  };
  const href = (route, extra = {}) => {
    if (route === 'history') return href('wallet', { tab: 'use' });
    if (!routes.has(route)) return 'signup.html';
    const params = new URLSearchParams();
    for (const key of fields) params.set(key, state[key]);
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
    return `${route}.html?${params}`;
  };
  const navigate = (route, extra) => {
    save();
    location.href = href(route, extra);
  };
  const text = (selector, value) =>
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
  const number = (value) => Number(value).toLocaleString('ko-KR');
  function syncSelection() {
    text('[data-stock-name-value]', state.stockName);
    text('[data-stock-meta-value]', `${state.stockCode} · ${state.stockMarket}`);
    text('[data-direction-confirm]', `${state.direction === 'up' ? '상승' : '하락'} 예측을 제출할까요?`);
    text('[data-product-title-value]', state.productTitle);
    text('[data-product-amount-value]', `${number(state.productAmount)}원권`);
    text('[data-product-points-value]', `${number(state.productPoints)}P`);
    const amount = document.querySelector('[data-payout-amount-value]');
    if (amount)
      amount.replaceChildren(
        document.createTextNode(number(state.productAmount)),
        Object.assign(document.createElement('span'), { textContent: '원' })
      );
    document.querySelectorAll('.direction-card[data-direction]:not(.home-direction)').forEach((button) => {
      const selected = button.dataset.direction === state.direction;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.querySelectorAll('[data-stock-code]').forEach((row) => {
      const selected = row.dataset.stockCode === state.stockCode;
      row.querySelector('.stock-row-state').textContent = selected ? '선택됨' : '선택';
      row.setAttribute('aria-current', String(selected));
      row.href = href(state.stockReturn, {
        topicId: row.dataset.topicId || '',
        stockCode: row.dataset.stockCode,
        stockName: row.dataset.stockName,
        stockMarket: row.dataset.stockMarket,
      });
    });
    document.querySelectorAll('[data-watchlist-toggle]').forEach((button) => {
      const selected = state.watchlist.includes(state.stockCode);
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', selected ? '관심종목에서 삭제' : '관심종목에 추가');
    });
    document.querySelectorAll('a[data-route]').forEach((link) => {
      const route =
        page === 'stock-select' && link.classList.contains('back-button')
          ? state.stockBack
          : link.dataset.route;
      const extra = route === 'stock-select' ? { stockReturn: 'prediction', stockBack: page } : {};
      link.href = href(route, extra);
    });
    document.querySelectorAll('a[data-stock-picker]').forEach((link) => {
      link.href = href('stock-select', { stockReturn: page, stockBack: page });
    });
    document.querySelectorAll('a[data-product]').forEach((link) => {
      const data = link.dataset;
      link.href = href('exchange', {
        productId: data.product,
        productTitle: data.productTitle,
        productAmount: data.productAmount,
        productPoints: data.productPoints,
      });
    });
    save();
  }

  const stockInput = document.getElementById('stock-search-input');
  let market = 'all';
  function filterStocks() {
    if (!stockInput) return;
    const keyword = stockInput.value.trim().toLocaleLowerCase('ko-KR');
    let count = 0;
    document.querySelectorAll('[data-stock-code]').forEach((row) => {
      const data = row.dataset;
      const match =
        (market === 'all' ||
          market === data.stockMarket ||
          (market === 'watchlist' && state.watchlist.includes(data.stockCode))) &&
        `${data.stockName} ${data.stockCode}`.toLocaleLowerCase('ko-KR').includes(keyword);
      row.hidden = !match;
      if (match) count++;
    });
    text('#stock-result-count', `${count}개`);
    text('#stock-list-title', market === 'watchlist' ? '관심종목' : '국내 종목');
    text(
      '#stock-empty',
      market === 'watchlist' && !state.watchlist.length
        ? '관심종목이 없습니다. 예측 화면의 책갈피로 추가해 보세요.'
        : '검색 결과가 없습니다.'
    );
    document.getElementById('stock-empty').hidden = count > 0;
    document.querySelectorAll('[data-market]').forEach((button) => {
      button.classList.toggle('active', button.dataset.market === market);
      button.setAttribute('aria-pressed', String(button.dataset.market === market));
    });
  }
  if (stockInput) {
    stockInput.value = query.get('q') || '';
    stockInput.addEventListener('input', filterStocks);
  }
  const walletTabs = () =>
    document.querySelectorAll('.wallet-tabs [data-wallet-tab]').forEach((button) => {
      button.classList.toggle('active', button.dataset.walletTab === state.walletTab);
      button.setAttribute('aria-pressed', String(button.dataset.walletTab === state.walletTab));
    });

  // Legal content stays in a dialog so recipient values never leave their form.
  const legalTitles = {
    age: '만 14세 이상입니다',
    terms: '서비스 이용약관 동의',
    privacy: '개인정보 처리방침 동의',
    reward: '지급 안내 및 개인정보 동의',
  };
  const legalDialog = document.getElementById('legal-dialog');
  document.getElementById('close-legal').addEventListener('click', () => legalDialog.close());
  let legalTrigger;
  legalDialog.addEventListener('close', () => legalTrigger?.focus());
  const adDialog = document.getElementById('reward-ad-dialog');
  let adTrigger;
  document.getElementById('cancel-reward-ad').addEventListener('click', () => adDialog.close());
  document.getElementById('start-reward-ad').addEventListener('click', () => {
    adDialog.close();
    action('ad', '광고 재생 및 예측권 지급');
  });
  adDialog.addEventListener('close', () => adTrigger?.focus());

  document.getElementById('app').addEventListener('click', (event) => {
    const control = event.target.closest('button, a');
    if (!control || control.disabled) return;
    if (control.dataset.legal) {
      event.preventDefault();
      legalTrigger = control;
      text('#legal-dialog-title', legalTitles[control.dataset.legal]);
      // Replace this placeholder with approved text in listener_load for each page.
      legalDialog.dataset.legal = control.dataset.legal;
      legalDialog.showModal();
    } else if (control.hasAttribute('data-tutorial-replay')) {
      forgetTutorial();
      showTutorial();
    } else if (control.dataset.direction) {
      state.direction = control.dataset.direction;
      syncSelection();
      if (page === 'home') navigate('prediction');
    } else if (control.hasAttribute('data-watchlist-toggle')) {
      state.watchlist = state.watchlist.includes(state.stockCode)
        ? state.watchlist.filter((code) => code !== state.stockCode)
        : [...state.watchlist, state.stockCode];
      syncSelection();
      filterStocks();
    } else if (control.dataset.market) {
      market = control.dataset.market;
      filterStocks();
    } else if (control.dataset.walletTab) {
      state.walletTab = control.dataset.walletTab;
      if (page !== 'wallet') return navigate('wallet', { tab: state.walletTab });
      walletTabs();
      history.replaceState(null, '', href('wallet', { tab: state.walletTab }));
    } else if (control.hasAttribute('data-reward-ad')) {
      adTrigger = control;
      adDialog.showModal();
    } else if (control.dataset.login) {
      window[`${control.dataset.login}Login`]();
    } else if (control.hasAttribute('data-claim')) {
      action('claim', '보상 확인 및 수령');
    } else if (control.hasAttribute('data-more')) {
      action('more', '이전 내역 조회');
    } else {
      const actions = {
        'consent-submit': ['consent', '약관 동의 제출'],
        'submit-prediction': ['prediction', '예측 접수'],
        attendance: ['attendance', '출석 확인 및 보상 지급'],
        logout: ['logout', '로그아웃'],
        'verify-ad': ['verifyAd', '광고 완료 확인'],
        'retry-reward': ['retryReward', '당첨 및 수령 자격 확인'],
      };
      if (actions[control.id]) action(...actions[control.id]);
    }
  });
  const TUTORIAL_KEY = 'candle.tutorial.seen';
  const tutorialDialog = document.getElementById('tutorial-dialog');
  const tutorialSlides = [...tutorialDialog.querySelectorAll('[data-tutorial-slide]')];
  const tutorialDots = [...tutorialDialog.querySelectorAll('[data-tutorial-dot]')];
  const tutorialNext = document.getElementById('tutorial-next');
  let tutorialIndex = 0;
  let tutorialTrigger = null;
  const tutorialSeen = () => {
    try {
      return localStorage.getItem(TUTORIAL_KEY) === '1';
    } catch {
      return false;
    }
  };
  const rememberTutorial = () => {
    try {
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {}
  };
  const forgetTutorial = () => {
    try {
      localStorage.removeItem(TUTORIAL_KEY);
    } catch {}
  };
  function renderTutorial() {
    tutorialSlides.forEach((slide, index) => slide.classList.toggle('active', index === tutorialIndex));
    tutorialDots.forEach((dot, index) => dot.setAttribute('aria-current', String(index === tutorialIndex)));
    tutorialNext.textContent = tutorialIndex === tutorialSlides.length - 1 ? '시작하기' : '다음';
  }
  function showTutorial(index = 0) {
    tutorialIndex = index;
    renderTutorial();
    tutorialTrigger = document.activeElement;
    if (!tutorialDialog.open) tutorialDialog.showModal();
    tutorialNext.focus({ preventScroll: true });
  }
  function closeTutorial() {
    rememberTutorial();
    tutorialDialog.close();
    if (tutorialTrigger instanceof HTMLElement) tutorialTrigger.focus({ preventScroll: true });
  }
  tutorialNext.addEventListener('click', () => {
    if (tutorialIndex < tutorialSlides.length - 1) {
      tutorialIndex += 1;
      renderTutorial();
      return;
    }
    closeTutorial();
  });
  tutorialDots.forEach((dot, index) =>
    dot.addEventListener('click', () => {
      tutorialIndex = index;
      renderTutorial();
    })
  );
  document.getElementById('tutorial-skip').addEventListener('click', closeTutorial);
  tutorialDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeTutorial();
  });
  tutorialDialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' && tutorialIndex < tutorialSlides.length - 1) {
      tutorialIndex += 1;
      renderTutorial();
    } else if (event.key === 'ArrowLeft' && tutorialIndex > 0) {
      tutorialIndex -= 1;
      renderTutorial();
    }
  });
  tutorialDialog.addEventListener('click', (event) => {
    const rect = tutorialDialog.getBoundingClientRect();
    if (
      event.target === tutorialDialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      closeTutorial();
  });

  if (page === 'home' && query.get('tutorial') === '1' && !tutorialSeen()) showTutorial();
  window.CandleUI = { state, announce, requireServer, href, navigate, syncSelection, filterStocks };
  syncSelection();
  filterStocks();
  walletTabs();
  window.listener_load?.();
})();
