/* Professor API contracts with the current tidy views. No business mock service. */
(() => {
  'use strict';
  let ui;
  let authenticated = false;
  let epoch = 0;
  let restoring = true;
  let loggingIn = false;
  let nativeLogin = null;
  let submitting = false;
  let balance = null;
  let searchVersion = 0;
  let searchTimer;
  let homeRequest;
  let topicRequest;
  let topicVersion = 0;
  let loadedTopicId = null;
  const topics = new Map();
  const config = window.CANDLE_BACKEND_CONFIG;
  const all = (selector) => [...document.querySelectorAll(selector)];
  const text = (selector, value) =>
    all(selector).forEach((node) => {
      node.textContent = value;
    });
  const number = (value) => Number(value).toLocaleString('ko-KR');
  const finiteNumber = (value) =>
    (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
    Number.isFinite(Number(value));
  const validNumber = (value) => finiteNumber(value) && Number(value) >= 0;
  const market = (cate) =>
    ({ 110: '코스피', 120: '코스닥', 210: '나스닥', 310: '코인' })[String(cate)] ||
    String(cate ?? '');
  const notice = (message) => ui?.announce(message);
  const report = (error) => {
    if (error?.status === -1) return;
    notice(
      error?.status === 409
        ? '중복되거나 현재 상태에서 처리할 수 없는 요청입니다.'
        : [401, 403, 406].includes(error?.status)
          ? '로그인이 필요합니다. 다시 로그인해 주세요.'
          : '서버 요청을 완료하지 못했습니다. 다시 시도해 주세요.'
    );
  };
  function request(url, type = 'GET', param = {}) {
    const identity = epoch;
    return new Promise((resolve, reject) => {
      func_ajax({
        url,
        type,
        param,
        success: (data) => (identity === epoch ? resolve(data) : reject({ status: -1 })),
        error: (xhr) => reject(xhr),
      });
    });
  }
  function clearTokens() {
    for (const key of ['accessToken', 'refreshToken']) {
      flutter_setLocalStorage(key, null);
      localStorage.removeItem(key);
    }
  }
  function reset() {
    epoch++;
    nativeLogin = null;
    authenticated = false;
    balance = null;
    loadedTopicId = null;
    topicRequest = null;
    topicVersion++;
    homeRequest = null;
    searchVersion++;
    clearTimeout(searchTimer);
    topics.clear();
    ui.clearSelection();
    all('#consent input').forEach((input) => {
      input.checked = false;
    });
    document.getElementById('agree-all').dispatchEvent(new Event('change'));
    text('#profile .account-copy > strong', '서버 연결 필요');
    text('#profile .stats-card strong', '—');
    all('.streak-track li:not(.is-reward)').forEach((node, index) => {
      node.className = '';
      node.textContent = String(index + 1);
    });
    all('.header-account').forEach((button) => button.classList.remove('has-new'));
    all('[data-server-value]').forEach((node) => {
      node.textContent = '—';
    });
    text('.ticket-breakdown strong', '—');
    text('#pass .ad-count', '오늘 — / 10회');
    setAdRemaining('—');
    document.querySelector('#pass .progress-fill').style.width = '0%';
    updateProducts();
  }
  function setAdRemaining(value) {
    document.querySelector('#reward-ad-dialog .reward-ad-allowance > strong').replaceChildren(
      document.createTextNode(String(value)),
      Object.assign(document.createElement('span'), {
        textContent: ' / 10회',
      })
    );
  }
  function updateProducts() {
    all('#shop [data-product]').forEach((button) => {
      const cost = Number(button.dataset.productPoints);
      button.disabled = balance === null || cost > balance;
      button.setAttribute(
        'aria-pressed',
        String(!button.disabled && button.dataset.product === ui.selection().productId)
      );
      let state = button.querySelector('.product-state');
      if (button.disabled && !state) {
        state = document.createElement('span');
        state.className = 'product-state';
        button.append(state);
      }
      if (state)
        state.textContent =
          balance === null ? '조회 필요' : cost > balance ? `${number(cost - balance)}P 부족` : '';
    });
    const selected = document.querySelector(`#shop [data-product="${ui.selection().productId}"]`);
    document.querySelector('.product-submit').disabled = !selected || selected.disabled;
  }
  function requireLogin() {
    if (authenticated) return true;
    notice('로그인 후 이용해 주세요.');
    return false;
  }
  function normalizeTopic(row, detail = false) {
    if (
      !row ||
      !['string', 'number'].includes(typeof row.id) ||
      String(row.id) === '' ||
      typeof row.code !== 'string' ||
      !row.code ||
      typeof row.title !== 'string' ||
      !row.title
    )
      throw { status: 502 };
    if (detail && (!validNumber(row.price) || !finiteNumber(row.rate))) throw { status: 502 };
    return { ...row, id: String(row.id), market: market(row.cate) };
  }
  async function detail_myuser() {
    const data = await request('/api/user', 'GET', { id: 0 });
    if (typeof data?.nick === 'string') text('#profile .account-copy > strong', data.nick);
    if (data?.allowalarmdevice === false || data?.allowalarmdevice === 'false')
      flutter_cancelAllNoti();
    return data;
  }
  async function latest_myreward() {
    const data = await request('/api/reward/latest');
    if (!validNumber(data?.latest)) throw { status: 502 };
    balance = Number(data.latest);
    text('[data-server-value="balance"]', `${number(balance)} P`);
    updateProducts();
    return data;
  }
  async function count_myalarm() {
    const data = await request('/api/alarm/count');
    all('.header-account').forEach((button) =>
      button.classList.toggle('has-new', data?.hasNew === true)
    );
    return data;
  }
  async function count_myheart() {
    const data = await request('/api/heart/count');
    if (
      !validNumber(data?.amount) ||
      !validNumber(data.ad) ||
      !Number.isInteger(Number(data.ad)) ||
      Number(data.ad) > 10
    )
      throw { status: 502 };
    text('[data-server-value="tickets"]', `${number(data.amount)}회`);
    text('#pass .ad-count', `오늘 ${data.ad} / 10회`);
    setAdRemaining(10 - Number(data.ad));
    document.querySelector('#pass .progress-fill').style.width = `${Number(data.ad) * 10}%`;
    return data;
  }
  function loadHome() {
    if (!authenticated) return Promise.resolve();
    if (homeRequest) return homeRequest;
    const pending = Promise.allSettled([
      detail_myuser(),
      latest_myreward(),
      count_myalarm(),
      count_myheart(),
    ]);
    homeRequest = pending;
    pending.then((results) => {
      if (homeRequest === pending) homeRequest = null;
      results
        .filter((result) => result.status === 'rejected')
        .forEach((result) => report(result.reason));
    });
    return pending;
  }
  async function search_topic() {
    if (!requireLogin()) return;
    const version = ++searchVersion;
    const currentMarket = ui.market();
    if (currentMarket === 'watchlist') {
      ui.replaceTopics([...topics.values()].filter((topic) => ui.watchlist().includes(topic.code)));
      return;
    }
    const param = {
      perpage: 10,
      deleted: false,
      cate: { 코스피: '110', 코스닥: '120' }[currentMarket] || '',
      keyword: document.getElementById('stock-search-input').value.trim(),
    };
    try {
      const data = await request('/api/topic/scrollList', 'GET', param);
      if (version !== searchVersion) return;
      if (!Array.isArray(data)) throw { status: 502 };
      const rows = data.map((row) => normalizeTopic(row));
      for (const row of rows) topics.set(row.code, { ...topics.get(row.code), ...row });
      ui.replaceTopics(rows);
    } catch (error) {
      if (version === searchVersion) report(error);
    }
  }
  function scheduleSearch(debounce = false) {
    clearTimeout(searchTimer);
    searchVersion++;
    if (debounce) searchTimer = setTimeout(search_topic, 250);
    else return search_topic();
  }
  async function search_banner() {
    if (!authenticated) return;
    try {
      const data = await request('/api/banner/list', 'GET', {
        deleted: false,
        cate: 100,
      });
      // The example has no working banner template or confirmed creative fields.
      document.dispatchEvent(new CustomEvent('candle:banners', { detail: data }));
    } catch (error) {
      report(error);
    }
  }
  function detail_topic() {
    const selection = ui.selection();
    if (!authenticated || !selection.topicId) return Promise.resolve();
    if (topicRequest?.id === selection.topicId) return topicRequest.promise;
    const id = selection.topicId;
    const version = ++topicVersion;
    loadedTopicId = null;
    const promise = request('/api/topic', 'GET', { id })
      .then((data) => {
        if (version !== topicVersion || ui.selection().topicId !== id) return;
        const topic = normalizeTopic(data, true);
        if (topic.id !== id) throw { status: 502 };
        topics.set(topic.code, topic);
        loadedTopicId = id;
        ui.setTopicDetail(topic);
      })
      .catch(report)
      .finally(() => {
        if (topicRequest?.promise === promise) topicRequest = null;
      });
    topicRequest = { id, promise };
    return promise;
  }
  async function create_topicroundpredict() {
    if (submitting || !requireLogin()) return;
    const selection = ui.selection();
    if (!selection.topicId || loadedTopicId !== selection.topicId)
      return notice('종목 정보를 조회한 후 제출해 주세요.');
    const answers = config.predictionAnswers;
    if (
      !Number.isInteger(answers.up) ||
      !Number.isInteger(answers.down) ||
      answers.up === answers.down
    )
      return notice(
        '상승·하락의 answer 코드가 확인되지 않아 제출하지 않았습니다. 교수님 확인 후 설정해 주세요.'
      );
    const button = document.getElementById('submit-prediction');
    submitting = true;
    button.disabled = true;
    try {
      await request('/api/topicroundpredict/predict', 'POST', {
        topicId: selection.topicId,
        answer: answers[selection.direction],
      });
      notice('예측이 접수되었습니다.');
      await Promise.allSettled([count_myheart(), latest_myreward()]);
    } catch (error) {
      report(error);
    } finally {
      submitting = false;
      button.disabled = false;
    }
  }
  function getAccessToken(after) {
    const identity = epoch;
    return new Promise((resolve, reject) =>
      listenerGetAccessToken({
        success: () => {
          if (identity !== epoch) {
            reject({ status: -1 });
            return;
          }
          authenticated = true;
          if (after) ui.navigate(after);
          if (ui.currentRoute() === after || !after) route(ui.currentRoute());
          flutter_getFCMToken();
          resolve();
        },
        error: reject,
      })
    );
  }
  function listener_set_refrshToken(token) {
    if (isMissingToken(token)) return Promise.reject({ status: 502 });
    flutter_setLocalStorage('refreshToken', token);
    return getAccessToken('consent');
  }
  async function exchange(provider, payload) {
    if (loggingIn) return;
    loggingIn = true;
    restoring = false;
    reset();
    clearTokens();
    const identity = epoch;
    try {
      await new Promise((resolve, reject) =>
        func_ajax({
          url: `/api/user/${provider}`,
          type: 'POST',
          param: payload,
          success: (data, status, xhr) =>
            listener_set_refrshToken(xhr.getResponseHeader('RefreshToken')).then(resolve, reject),
          error: reject,
        })
      );
    } catch (error) {
      report(error);
    } finally {
      if (identity === epoch) loggingIn = false;
    }
  }
  function login(provider) {
    if (loggingIn) return notice('로그인 처리 중입니다. 잠시 기다려 주세요.');
    restoring = false;
    const channel = {
      kakao: 'KakaoLogin',
      naver: 'NaverLogin',
      google: 'GoogleLogin',
      apple: 'AppleLogin',
    }[provider];
    if (window[channel]?.postMessage) {
      reset();
      clearTokens();
      nativeLogin = { provider, identity: epoch };
      window[channel].postMessage('login');
    } else
      notice(
        '소셜 로그인은 앱에서 이용할 수 있습니다. 브라우저에서는 개발용 임시 로그인을 사용해 주세요.'
      );
  }
  function receiveCredential(provider, payload) {
    if (!nativeLogin || nativeLogin.provider !== provider || nativeLogin.identity !== epoch) return;
    nativeLogin = null;
    return exchange(provider, payload);
  }
  function tempLogin() {
    const username = document.getElementById('input_username').value.trim();
    const password = document.getElementById('input_password').value;
    if (!username) return notice('ID를 입력해 주세요.');
    return exchange('temp', { username, password }).finally(() => {
      document.getElementById('input_password').value = '';
    });
  }
  function expired() {
    if (!ui) return;
    reset();
    loggingIn = false;
    clearTokens();
    ui.navigate('signup');
    notice('로그인이 만료되었습니다. 다시 로그인해 주세요.');
  }
  function logout() {
    restoring = false;
    reset();
    loggingIn = false;
    // The supplied example clears local/native tokens; it has no logout endpoint.
    listener_logout();
    ui.navigate('signup');
  }
  function route(name) {
    if (!ui || !authenticated) return;
    if (['home', 'profile', 'wallet', 'shop', 'pass', 'exchange'].includes(name)) loadHome();
    if (name === 'stock-select') {
      scheduleSearch();
      search_banner();
    }
    if (name === 'prediction' || name === 'home') detail_topic();
  }
  function init(view) {
    ui = view;
    reset();
    text('#stock-top-note', '서버에서 조회한 종목입니다.');
    for (const id of ['prediction-history', 'wallet']) {
      const note = Object.assign(document.createElement('p'), {
        className: 'field-help',
        textContent: '현재 내역은 디자인 미리보기입니다. 내역 조회 API는 아직 연결되지 않았습니다.',
      });
      document.querySelector(`#${id} .content`).prepend(note);
    }
    document.getElementById('temp-login-form').addEventListener('submit', (event) => {
      event.preventDefault();
      tempLogin();
    });
    flutter_listener_localStorage = (token) => {
      if (!restoring) return;
      restoring = false;
      if (isMissingToken(token)) return;
      getAccessToken(['signup', 'splash'].includes(ui.currentRoute()) ? 'home' : null).catch(
        report
      );
    };
    const receiveNative = window.receiveFromFlutter;
    window.receiveFromFlutter = (event) => {
      if (event?.type === 'localStorage' && ['refreshToken', 'accessToken'].includes(event.key)) {
        if (!restoring || event.key !== 'refreshToken') return;
        if (isMissingToken(event.value)) localStorage.removeItem('refreshToken');
        else localStorage.setItem('refreshToken', event.value);
        flutter_listener_localStorage(event.value);
        return;
      }
      receiveNative(event);
    };
    const receiveFcm = window.flutter_listener_fcmtoken;
    window.flutter_listener_fcmtoken = (token) => {
      if (authenticated) receiveFcm(token);
    };
    window.flutter_listener_push = (value) => {
      if (isMissingToken(value)) return;
      const url = new URL(value, location.href);
      const filename = url.pathname
        .split('/')
        .pop()
        .replace(/\.html$/, '');
      const aliases = {
        index: authenticated ? 'home' : 'signup',
        index2: 'home',
        prediction2: 'prediction',
        result: 'prediction-history',
        submitted: 'prediction-history',
        confirm: 'prediction',
        history: 'wallet',
      };
      const name = aliases[filename] || (filename.startsWith('legal-') ? 'legal' : filename);
      if (filename === 'history') {
        document.querySelector('#wallet [data-wallet-tab="use"]').click();
        return;
      }
      if (filename.startsWith('legal-')) {
        const button = document.querySelector(`[data-legal="${filename.slice(6)}"]`);
        if (button) {
          button.click();
          return;
        }
      }
      if (document.getElementById(name)?.classList.contains('screen-view')) {
        if (name === 'prediction' && url.searchParams.has('id'))
          ui.openTopic(url.searchParams.get('id'));
        ui.navigate(name);
      } else location.href = value;
    };
    flutter_getLocalStorage('refreshToken');
  }
  Object.assign(window, {
    tempLogin,
    getAccessToken,
    listener_set_refrshToken,
    detail_myuser,
    latest_myreward,
    count_myalarm,
    count_myheart,
    search_topic,
    search_banner,
    detail_topic,
    create_topicroundpredict,
    kakaoLogin: () => login('kakao'),
    naverLogin: () => login('naver'),
    googleLogin: () => login('google'),
    appleLogin: () => login('apple'),
    receiveKakaoToken: (accessToken) => receiveCredential('kakao', { accessToken }),
    receiveNaverToken: (accessToken) => receiveCredential('naver', { accessToken }),
    receiveGoogleCredential: (token, accessToken) =>
      receiveCredential('google', { token, accessToken }),
    receiveAppleCredential: (authorizationCode, identityToken) =>
      receiveCredential('apple', { authorizationCode, identityToken }),
  });
  window.CandleBackend = {
    init,
    login,
    logout,
    expired,
    route,
    identity: () => epoch,
    search: scheduleSearch,
    selected: detail_topic,
    productChanged: updateProducts,
  };
})();
