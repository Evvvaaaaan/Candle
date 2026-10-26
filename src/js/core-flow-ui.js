(() => {
  'use strict';

  // Display and input state only. Server-owned facts are never synthesized here.
  const app = document.getElementById('app');
  const screens = [...app.querySelectorAll('.screen-view')];
  const screenIds = new Set(screens.map((screen) => screen.id));
  const stockRows = [...app.querySelectorAll('[data-stock-code]')];
  const products = [...app.querySelectorAll('[data-product]')];
  const state = {
    stockCode: stockRows[0].dataset.stockCode,
    direction: 'up',
    productId: products[0].dataset.product,
    stockReturn: 'home',
    market: 'all',
    legalReturn: 'settings',
    legalId: 'terms',
  };
  const currentRoute = () => (screenIds.has(location.hash.slice(1)) ? location.hash.slice(1) : 'signup');
  const serverMessage = (action) => `${action}에는 실제 서버 연결이 필요합니다. 요청은 전송되지 않았습니다.`;
  const announce = (message, target = 'action-error') => {
    let box = document.getElementById(target);
    if (!box) {
      box = document.createElement('div');
      box.id = target;
      box.className = 'action-error';
      box.setAttribute('role', 'alert');
      app.append(box);
    }
    box.textContent = message;
  };
  const requireServer = (action, target) => announce(serverMessage(action), target);
  const navigate = (route) => {
    if (!screenIds.has(route)) return;
    location.hash = route;
  };
  const setText = (selector, value) =>
    app.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
  const format = (value) => Number(value).toLocaleString('ko-KR');

  function syncSelection() {
    const stock = stockRows.find((row) => row.dataset.stockCode === state.stockCode).dataset;
    const product = products.find((node) => node.dataset.product === state.productId).dataset;
    setText('[data-stock-name-value]', stock.stockName);
    setText('[data-stock-meta-value]', `${stock.stockCode} · ${stock.stockMarket}`);
    setText('[data-direction-confirm]', `${state.direction === 'up' ? '상승' : '하락'} 예측을 제출할까요?`);
    setText('[data-product-title-value]', product.productTitle);
    setText('[data-product-amount-value]', `${format(product.productAmount)}원권`);
    setText('[data-product-points-value]', `${format(product.productPoints)}P`);
    const amount = app.querySelector('[data-payout-amount-value]');
    amount.replaceChildren(
      document.createTextNode(format(product.productAmount)),
      Object.assign(document.createElement('span'), { textContent: '원' })
    );
    app.querySelectorAll('[data-direction]').forEach((button) => {
      const selected = button.dataset.direction === state.direction;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    stockRows.forEach((row) => {
      const selected = row.dataset.stockCode === state.stockCode;
      row.querySelector('.stock-row-state').textContent = selected ? '선택됨' : '선택';
      row.setAttribute('aria-pressed', String(selected));
    });
    const stockBack = document.querySelector('#stock-select [data-route]');
    stockBack.dataset.route = state.stockReturn;
  }

  function filterStocks() {
    const query = document.getElementById('stock-search-input').value.trim().toLocaleLowerCase('ko-KR');
    let count = 0;
    stockRows.forEach((row) => {
      const match =
        (state.market === 'all' || state.market === row.dataset.stockMarket) &&
        `${row.dataset.stockName} ${row.dataset.stockCode}`.toLocaleLowerCase('ko-KR').includes(query);
      row.hidden = !match;
      if (match) count++;
    });
    document.getElementById('stock-result-count').textContent = `${count}개`;
    document.getElementById('stock-select-list').hidden = count === 0;
    document.getElementById('stock-empty').hidden = count > 0;
    app.querySelectorAll('[data-market]').forEach((button) => {
      const selected = button.dataset.market === state.market;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  const agreements = [...app.querySelectorAll('[data-agreement]')];
  const agreeAll = document.getElementById('agree-all');
  function syncConsent() {
    agreeAll.checked = agreements.every((input) => input.checked);
    agreeAll.indeterminate = !agreeAll.checked && agreements.some((input) => input.checked);
    document.getElementById('consent-submit').disabled = !agreements
      .filter((input) => input.classList.contains('required-agreement'))
      .every((input) => input.checked);
  }
  agreeAll.addEventListener('change', () => {
    agreements.forEach((input) => {
      input.checked = agreeAll.checked;
    });
    syncConsent();
  });
  agreements.forEach((input) => input.addEventListener('change', syncConsent));

  const phone = document.getElementById('phone');
  const recipientName = document.getElementById('name');
  const payoutAgree = document.getElementById('payout-agree');
  const payoutSubmit = document.getElementById('payout-submit');
  phone.removeAttribute('pattern');
  const phoneValid = () => /^010\d{8}$/.test(phone.value.replace(/[\s-]/g, ''));
  const nameValid = () => recipientName.value.trim().length >= 2 && recipientName.value.trim().length <= 40;
  function syncPayout() {
    phone.setCustomValidity(phoneValid() ? '' : '010으로 시작하는 휴대폰 번호 11자리를 입력해 주세요.');
    recipientName.setCustomValidity(nameValid() ? '' : '받는 분의 이름을 2자 이상 입력해 주세요.');
    payoutSubmit.disabled = !(phoneValid() && nameValid() && payoutAgree.checked);
  }
  [phone, recipientName, payoutAgree].forEach((input) => {
    input.addEventListener('input', syncPayout);
    input.addEventListener('change', syncPayout);
  });
  const submitPayout = (event) => {
    event.preventDefault();
    syncPayout();
    if (!document.getElementById('payout-form').reportValidity()) return;
    if (!payoutAgree.checked) return announce('지급 안내 및 개인정보 처리에 동의해 주세요.', 'payout-error');
    requireServer('지급 신청', 'payout-error');
  };
  document.getElementById('payout-form').addEventListener('submit', submitPayout);
  payoutSubmit.addEventListener('click', submitPayout);

  const rewardForm = document.getElementById('challenge-reward-form');
  const rewardRecipient = document.getElementById('reward-recipient');
  const rewardConfirm = document.getElementById('reward-confirm');
  const clearRewardError = () => {
    [rewardRecipient, rewardConfirm].forEach((input) => {
      input.removeAttribute('aria-invalid');
      input.setCustomValidity('');
    });
    document.getElementById('reward-form-error').textContent = '';
  };
  rewardForm.addEventListener('input', clearRewardError);
  rewardForm.addEventListener('change', clearRewardError);
  rewardForm.addEventListener('submit', (event) => {
    event.preventDefault();
    clearRewardError();
    const reject = (message, input) => {
      announce(message, 'reward-form-error');
      if (input) {
        input.setCustomValidity(message);
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
    };
    const recipient = rewardRecipient.value.trim();
    if (!recipient || recipient.length > 100 || /[\s<>]/.test(recipient))
      return reject('올바른 네이버 ID를 입력해 주세요.', rewardRecipient);
    if (recipient !== rewardConfirm.value.trim())
      return reject('두 번 입력한 수령 정보가 일치하지 않아요.', rewardConfirm);
    if ([...rewardForm.querySelectorAll('input[type="checkbox"]')].some((input) => !input.checked))
      return reject('필수 동의와 네이버페이 이용 준비 여부를 확인해 주세요.');
    requireServer('리워드 수령 신청', 'reward-form-error');
  });

  const dialog = document.getElementById('reward-ad-dialog');
  let adTrigger = null;
  const closeAd = () => {
    dialog.close();
    adTrigger?.focus({ preventScroll: true });
  };
  document.getElementById('cancel-reward-ad').addEventListener('click', closeAd);
  document.getElementById('start-reward-ad').addEventListener('click', () => {
    closeAd();
    requireServer('광고 재생 및 예측권 지급');
  });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeAd();
  });
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      closeAd();
  });

  const legalTitles = {
    age: '만 14세 이상입니다',
    terms: '서비스 이용약관 동의',
    privacy: '개인정보 처리방침 동의',
    reward: '지급 안내 및 개인정보 동의',
  };
  app.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.route) return navigate(button.dataset.route);
    if (button.dataset.direction) {
      state.direction = button.dataset.direction;
      syncSelection();
      if (currentRoute() === 'home') navigate('prediction');
      return;
    }
    if (button.hasAttribute('data-stock-picker')) {
      state.stockReturn = ['home', 'prediction'].includes(currentRoute()) ? currentRoute() : 'prediction';
      state.market = 'all';
      document.getElementById('stock-search-input').value = '';
      filterStocks();
      syncSelection();
      navigate('stock-select');
      return;
    }
    if (button.dataset.stockCode) {
      state.stockCode = button.dataset.stockCode;
      syncSelection();
      navigate(state.stockReturn);
      return;
    }
    if (button.dataset.market) {
      state.market = button.dataset.market;
      filterStocks();
      return;
    }
    if (button.dataset.product) {
      state.productId = button.dataset.product;
      syncSelection();
      navigate('exchange');
      return;
    }
    if (button.dataset.legal) {
      state.legalId = button.dataset.legal;
      state.legalReturn = currentRoute();
      const legal = document.getElementById('legal');
      legal.querySelector('h1').textContent = legalTitles[state.legalId];
      legal.querySelector('.transaction-header h1').textContent = legalTitles[state.legalId];
      legal.querySelector('.heading').textContent = legalTitles[state.legalId];
      legal.querySelector('[data-route]').dataset.route = state.legalReturn;
      navigate('legal');
      return;
    }
    if (button.hasAttribute('data-reward-ad')) {
      adTrigger = button;
      dialog.showModal();
      return;
    }
    if (button.dataset.login) return navigate('home');
    if (button.hasAttribute('data-claim') && button.closest('#prediction-history')) {
      button.disabled = true;
      button.textContent = '수령 완료';
      return;
    }
    if (button.hasAttribute('data-claim')) return requireServer('보상 확인 및 수령');
    if (button.hasAttribute('data-more')) return requireServer('이전 내역 조회');
    const actions = {
      'consent-submit': '약관 동의 제출',
      'submit-prediction': '예측 접수',
      attendance: '출석 확인 및 보상 지급',
      logout: '로그아웃',
      'verify-ad': '광고 완료 확인',
      'retry-reward': '당첨 및 수령 자격 확인',
    };
    if (actions[button.id]) requireServer(actions[button.id]);
  });
  document.getElementById('stock-search-input').addEventListener('input', filterStocks);

  let previousRoute = currentRoute();
  function syncRoute() {
    const route = currentRoute();
    if (previousRoute !== route) {
      document.getElementById('action-error')?.remove();
      if (dialog.open) dialog.close();
      if (!['payout', 'legal'].includes(route)) {
        document.getElementById('payout-form').reset();
        payoutAgree.checked = false;
        syncPayout();
        document.getElementById('payout-error').textContent = '';
      }
      if (previousRoute === 'challenge-reward') {
        rewardForm.reset();
        clearRewardError();
      }
    }
    document.title = `Candle · ${document.getElementById(route).getAttribute('aria-label')}`;
    syncSelection();
    if (previousRoute !== route)
      document.getElementById(route).querySelector('h1')?.focus({ preventScroll: true });
    previousRoute = route;
  }
  window.addEventListener('hashchange', syncRoute);
  syncSelection();
  filterStocks();
  syncConsent();
  syncPayout();
  syncRoute();
})();
