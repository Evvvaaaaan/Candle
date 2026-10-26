import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root) || pathname.includes('/.')) {
      res.writeHead(403);
      res.end();
      return;
    }
    res.setHeader(
      'Content-Type',
      file.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8'
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome',
  headless: true,
});
let apiCount = 0;
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = [],
    requests = [];
  let empty = false,
    rejectPrediction = false,
    delayPrediction = false;
  let authNumber = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/js/backend-config.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.CANDLE_BACKEND_CONFIG = ${JSON.stringify({ baseUrl: base, predictionAnswers: { up: null, down: null } })};`,
    })
  );
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const body = request.postDataJSON();
    requests.push({
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      method: request.method(),
      headers: request.headers(),
      body,
    });
    apiCount++;
    const reply = (json, status = 200, headers = {}) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers,
        body: JSON.stringify(json),
      });
    if (/^\/api\/user\/(temp|kakao|naver|google|apple)$/.test(url.pathname))
      return reply({}, 200, { RefreshToken: 'fixture-refresh' });
    if (url.pathname === '/api/auth') {
      assert.equal(request.headers().refreshtoken, 'fixture-refresh');
      return reply({}, 200, {
        Authorization: `fixture-access-${++authNumber}`,
      });
    }
    if (request.headers().authorization === 'expired') return reply({}, 401);
    assert.match(request.headers().authorization || '', /^fixture-access-\d+$/);
    if (url.pathname === '/api/user')
      return reply({ id: 21, nick: '테스트 사용자', allowalarmdevice: false });
    if (url.pathname === '/api/reward/latest') return reply({ latest: 12800 });
    if (url.pathname === '/api/alarm/count') return reply({ hasNew: true });
    if (url.pathname === '/api/heart/count') return reply({ amount: 4, ad: 3, seconds: 10 });
    if (url.pathname === '/api/banner/list') return reply([]);
    if (url.pathname === '/api/topic/scrollList') {
      const keyword = url.searchParams.get('keyword');
      if (keyword === 'slow') await new Promise((resolve) => setTimeout(resolve, 650));
      const rows = empty
        ? []
        : keyword === 'fast'
          ? [{ id: 102, code: '000660', title: 'SK하이닉스', cate: '110' }]
          : [
              { id: 101, code: '005930', title: '삼성전자', cate: '110' },
              { id: 102, code: '000660', title: 'SK하이닉스', cate: '110' },
            ];
      return reply(rows);
    }
    if (url.pathname === '/api/topic') {
      const id = url.searchParams.get('id');
      if (id === '101') await new Promise((resolve) => setTimeout(resolve, 80));
      return reply({
        id: Number(id),
        code: id === '101' ? '005930' : '000660',
        title: id === '101' ? '삼성전자' : 'SK하이닉스',
        cate: '110',
        price: 71200,
        rate: id === '101' ? 1.28 : -2.5,
      });
    }
    if (url.pathname === '/api/topicroundpredict/predict') {
      if (delayPrediction) await new Promise((resolve) => setTimeout(resolve, 180));
      return reply({}, rejectPrediction ? 409 : 200);
    }
    throw new Error(`Unexpected API ${request.method()} ${url.pathname}`);
  });
  await page.goto(base + '/index.html');
  assert.equal(await page.locator('.screen-view').count(), 19);
  assert.equal(await page.locator('dialog').count(), 4);
  assert.equal(requests.length, 0, 'anonymous startup sends no business requests');
  await page.locator('[data-login="kakao"]').click();
  assert.match(page.url(), /#signup$|index.html$/);
  assert.equal(requests.length, 0);
  await page.locator('.temp-login summary').click();
  await page.locator('#input_username').fill('  fixture-user  ');
  await page.locator('#input_password').fill('fixture-password');
  await page.locator('#temp-login-submit').click();
  await page.waitForURL(/#consent$/);
  assert.deepEqual(requests.find((row) => row.path === '/api/user/temp').body, {
    username: 'fixture-user',
    password: 'fixture-password',
  });
  assert.equal(await page.locator('#input_password').inputValue(), '');
  assert.equal(await page.locator('#consent-submit').isDisabled(), true);
  await page.locator('#agree-all').check();
  await page.locator('#consent-submit').click();
  await page.waitForURL(/#home$/);
  await page.locator('#tutorial-skip').click();
  await page.waitForFunction(
    () => document.querySelector('[data-server-value="balance"]').textContent === '12,800 P'
  );
  assert.equal(await page.locator('[data-server-value="tickets"]').first().innerText(), '4회');
  assert.equal(await page.locator('#pass .ad-count').innerText(), '오늘 3 / 10회');
  assert.equal(
    await page.locator('#reward-ad-dialog .reward-ad-allowance > strong').innerText(),
    '7 / 10회'
  );
  assert.equal(await page.locator('.ticket-breakdown strong').first().innerText(), '—');
  assert.equal(await page.locator('[data-product="naverpay-30000"]').isDisabled(), true);

  // All four native channels and callback payloads retain the professor interface.
  for (const [provider, callback, args, payload] of [
    ['kakao', 'receiveKakaoToken', ['k'], { accessToken: 'k' }],
    ['naver', 'receiveNaverToken', ['n'], { accessToken: 'n' }],
    [
      'google',
      'receiveGoogleCredential',
      ['g-id', 'g-access'],
      { token: 'g-id', accessToken: 'g-access' },
    ],
    [
      'apple',
      'receiveAppleCredential',
      ['a-code', 'a-id'],
      { authorizationCode: 'a-code', identityToken: 'a-id' },
    ],
  ]) {
    await page.evaluate(() => CandleBackend.logout());
    await page.waitForURL(/#signup$/);
    const channel = provider[0].toUpperCase() + provider.slice(1) + 'Login';
    await page.evaluate((channel) => {
      window[channel] = {
        postMessage: (value) => {
          window.fixtureChannelMessage = value;
        },
      };
    }, channel);
    await page.locator(`[data-login="${provider}"]`).click();
    assert.equal(await page.evaluate(() => window.fixtureChannelMessage), 'login');
    await page.evaluate(({ callback, args }) => window[callback](...args), {
      callback,
      args,
    });
    await page.waitForURL(/#consent$/);
    assert.deepEqual(
      requests.findLast((row) => row.path === `/api/user/${provider}`).body,
      payload
    );
  }
  await page.locator('#agree-all').check();
  await page.locator('#consent-submit').click();
  await page.waitForURL(/#home$/);
  await page.locator('#tutorial-skip').click();
  await page.locator('#home .nav-item[data-route="stock-select"]').click();
  await page.waitForURL(/#stock-select$/);
  await page.waitForFunction(
    () => document.querySelectorAll('#stock-select-list [data-topic-id]').length === 2
  );
  const { _: cacheBuster, ...topicQuery } = requests.findLast(
    (row) => row.path === '/api/topic/scrollList'
  ).query;
  assert.equal(typeof cacheBuster, 'string');
  assert.deepEqual(topicQuery, {
    perpage: '10',
    deleted: 'false',
    cate: '',
    keyword: '',
  });
  await page.locator('[data-topic-id="101"]').click();
  await page.waitForURL(/#prediction$/);
  await page.waitForFunction(() =>
    document.querySelector('#prediction .quote-row').textContent.includes('71,200')
  );
  assert.equal(await page.evaluate(() => CandleUI.selection().topicId), '101');
  await page.locator('#prediction [data-direction="down"]').click();
  await page.locator('[data-prediction-review]').click();
  const countBefore = requests.filter(
    (row) => row.path === '/api/topicroundpredict/predict'
  ).length;
  await page.locator('#submit-prediction').click();
  assert.match(await page.locator('#action-error').innerText(), /answer 코드가 확인되지/);
  assert.equal(
    requests.filter((row) => row.path === '/api/topicroundpredict/predict').length,
    countBefore
  );
  // Test-only codes demonstrate mapping. They are not claims about the real API.
  await page.evaluate(() => {
    CANDLE_BACKEND_CONFIG.predictionAnswers = { up: 220, down: 110 };
  });
  rejectPrediction = true;
  await page.evaluate(() => create_topicroundpredict());
  assert.deepEqual(requests.findLast((row) => row.path === '/api/topicroundpredict/predict').body, {
    topicId: '101',
    answer: 110,
  });
  assert.match(await page.locator('#action-error').innerText(), /중복/);
  rejectPrediction = false;
  delayPrediction = true;
  const before = requests.length;
  await page.evaluate(() => Promise.all([create_topicroundpredict(), create_topicroundpredict()]));
  assert.equal(
    requests.slice(before).filter((row) => row.path === '/api/topicroundpredict/predict').length,
    1
  );
  assert.match(await page.locator('#action-error').innerText(), /접수되었습니다/);
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'expired');
  });
  const oldAuth = authNumber;
  await page.evaluate(() => Promise.all([count_myheart(), latest_myreward()]));
  assert.equal(authNumber, oldAuth + 1, 'simultaneous 401s share one token refresh');
  await page.evaluate(() =>
    receiveFromFlutter({ type: 'fcmToken', data: { token: 'fixture-fcm' } })
  );
  await page.waitForFunction(() => true);
  await page.waitForTimeout(50);
  assert.deepEqual(
    requests.findLast((row) => row.path === '/api/user' && row.method === 'PUT').body,
    { id: 0, fcm: 'fixture-fcm' }
  );

  await page.evaluate(() => CandleUI.navigate('stock-select'));
  await page.waitForURL(/#stock-select$/);
  await page.locator('#stock-search-input').fill('slow');
  await page.waitForTimeout(300);
  await page.locator('#stock-search-input').fill('fast');
  await page.waitForTimeout(1000);
  assert.equal(await page.locator('[data-stock-code]').count(), 1);
  assert.equal(await page.locator('[data-stock-code]').getAttribute('data-stock-code'), '000660');
  empty = true;
  await page.locator('#stock-search-input').fill('empty');
  await page.waitForTimeout(350);
  assert.equal(await page.locator('[data-stock-code]').count(), 0);
  assert.equal(await page.locator('#stock-empty').isVisible(), true);
  empty = false;

  await page.evaluate(() => CandleUI.navigate('payout'));
  await page.waitForURL(/#payout$/);
  await page.locator('#phone').fill('01012345678');
  await page.locator('#name').fill('Fixture Recipient');
  await page.locator('#payout-agree').check();
  const beforePayout = requests.length;
  await page.locator('#payout-submit').click();
  assert.match(await page.locator('#payout-error').innerText(), /실제 서버 연결/);
  assert.equal(requests.length, beforePayout);
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  assert(
    !stored.includes('01012345678') &&
      !stored.includes('Fixture Recipient') &&
      !stored.includes('fixture-password')
  );
  await page.evaluate(() => CandleUI.navigate('prediction-history'));
  await page.waitForURL(/#prediction-history$/);
  await page.locator('[data-claim]:not([disabled])').first().click();
  assert.match(await page.locator('#action-error').innerText(), /실제 서버 연결/);
  assert.equal(await page.locator('#phone').inputValue(), '');
  const screens = await page
    .locator('.screen-view')
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  let checks = 0;
  await mkdir(path.join(root, '.screenshots'), { recursive: true });
  for (const viewport of [
    { width: 320, height: 800 },
    { width: 390, height: 844 },
    { width: 1440, height: 1000 },
  ]) {
    await page.setViewportSize(viewport);
    for (const screen of screens) {
      await page.evaluate((screen) => CandleUI.navigate(screen), screen);
      await page.waitForFunction(
        (screen) =>
          document.title ===
          `Candle · ${document.getElementById(screen).getAttribute('aria-label')}`,
        screen
      );
      assert.equal(await page.locator('.screen-view:visible').count(), 1);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
        `${screen} at ${viewport.width}`
      );
      if (
        viewport.width === 390 &&
        ['home', 'prediction', 'stock-select', 'shop', 'payout', 'signup'].includes(screen)
      )
        await page.screenshot({
          path: path.join(root, '.screenshots', `backend-${screen}-mobile.png`),
          fullPage: true,
        });
      checks++;
    }
  }
  // Requests from a previous account must never replay under a newer account.
  const holdNext = async (pattern) => {
    let release;
    let used = false;
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    const handler = (route) => {
      if (used) return route.fallback();
      used = true;
      release(route);
    };
    await page.route(pattern, handler);
    return { pending, remove: () => page.unroute(pattern, handler) };
  };
  await page.evaluate(() => CandleBackend.logout());
  const heldLogin = await holdNext('**/api/user/temp');
  await page.evaluate(() => {
    document.getElementById('input_username').value = 'late-user';
    window.lateLogin = tempLogin();
  });
  const loginResponse = await heldLogin.pending;
  await page.evaluate(() => CandleBackend.logout());
  await loginResponse.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { RefreshToken: 'obsolete-provider-token' },
    body: '{}',
  });
  await page.evaluate(() => window.lateLogin);
  assert.equal(await page.evaluate(() => localStorage.getItem('refreshToken')), null);
  assert.match(page.url(), /#signup$/);
  await heldLogin.remove();

  await page.evaluate(() => {
    CandleBackend.login('kakao');
    return receiveKakaoToken('new-user');
  });
  const heldRead = await holdNext('**/api/reward/latest*');
  await page.evaluate(() => {
    window.oldRead = latest_myreward().catch((error) => error.status);
  });
  const readResponse = await heldRead.pending;
  await page.evaluate(() => CandleBackend.logout());
  await page.evaluate(() => {
    CandleBackend.login('google');
    return receiveGoogleCredential('next-user-id', 'next-user-access');
  });
  const freshToken = await page.evaluate(() => localStorage.getItem('accessToken'));
  const authBeforeOldRead = authNumber;
  await readResponse.fulfill({
    status: 401,
    contentType: 'application/json',
    body: '{}',
  });
  assert.equal(await page.evaluate(() => window.oldRead), -1);
  assert.equal(authNumber, authBeforeOldRead);
  assert.equal(await page.evaluate(() => localStorage.getItem('accessToken')), freshToken);
  await heldRead.remove();

  const heldRefresh = await holdNext('**/api/auth');
  await page.evaluate(() => {
    localStorage.setItem('accessToken', 'expired');
    window.oldRefresh = count_myheart().catch((error) => error.status);
  });
  const refreshResponse = await heldRefresh.pending;
  await page.evaluate(() => CandleBackend.logout());
  await page.evaluate(() => {
    CandleBackend.login('naver');
    return receiveNaverToken('newer-user');
  });
  const newerToken = await page.evaluate(() => localStorage.getItem('accessToken'));
  await refreshResponse.fulfill({
    status: 401,
    contentType: 'application/json',
    body: '{}',
  });
  assert.equal(await page.evaluate(() => window.oldRefresh), -1);
  assert.equal(await page.evaluate(() => localStorage.getItem('accessToken')), newerToken);
  assert.equal(await page.evaluate(() => localStorage.getItem('refreshToken')), 'fixture-refresh');
  await heldRefresh.remove();
  await page.evaluate(() =>
    receiveFromFlutter({
      type: 'localStorage',
      key: 'refreshToken',
      value: 'obsolete-native-token',
    })
  );
  assert.equal(await page.evaluate(() => localStorage.getItem('refreshToken')), 'fixture-refresh');

  // The newest detail wins even when the same topic is selected again.
  const heldDetail = await holdNext('**/api/topic?*');
  await page.evaluate(() => {
    CandleUI.openTopic('101');
    window.firstDetail = CandleBackend.selected();
  });
  const detailResponse = await heldDetail.pending;
  await page.evaluate(() => {
    CandleUI.openTopic('102');
    return CandleBackend.selected();
  });
  await page.evaluate(() => {
    CandleUI.openTopic('101');
    return CandleBackend.selected();
  });
  await detailResponse.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: 101,
      code: '005930',
      title: 'Old response',
      cate: '110',
      price: 10000,
      rate: 1,
    }),
  });
  await page.evaluate(() => window.firstDetail);
  assert.match(await page.locator('[data-server-value="price"]').innerText(), /71,200/);
  assert.equal(await page.locator('[data-stock-name-value]').first().innerText(), '삼성전자');
  await heldDetail.remove();
  await page.route('**/api/heart/count*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"amount":true,"ad":null}',
    })
  );
  assert.equal(
    await page.evaluate(() =>
      count_myheart().then(
        () => 'accepted',
        (error) => error.status
      )
    ),
    502
  );
  await page.unroute('**/api/heart/count*');

  await page.evaluate(() =>
    receiveFromFlutter({
      type: 'push',
      data: { url: 'prediction.html?id=102' },
    })
  );
  await page.waitForURL(/#prediction$/);
  await page.waitForFunction(() =>
    document.querySelector('[data-stock-meta-value]').textContent.startsWith('000660')
  );
  assert.equal(await page.evaluate(() => CandleUI.selection().topicId), '102');
  await page.evaluate(() => receiveFromFlutter({ type: 'push', data: { url: 'history.html' } }));
  await page.waitForURL(/#wallet$/);
  assert.equal(
    await page.locator('#wallet [data-wallet-tab="use"]').getAttribute('aria-pressed'),
    'true'
  );
  await page.evaluate(() =>
    receiveFromFlutter({ type: 'push', data: { url: 'legal-privacy.html' } })
  );
  await page.waitForURL(/#legal$/);
  assert.match(await page.locator('#legal h1').innerText(), /개인정보/);
  const beforeLateFcm = requests.length;
  await page.evaluate(() => {
    CandleBackend.logout();
    receiveFromFlutter({ type: 'fcmToken', data: { token: 'obsolete-fcm' } });
    receiveFromFlutter({
      type: 'localStorage',
      key: 'refreshToken',
      value: 'obsolete-native-token',
    });
  });
  await page.waitForTimeout(50);
  assert.equal(requests.slice(beforeLateFcm).filter((row) => row.method === 'PUT').length, 0);
  assert.equal(await page.evaluate(() => localStorage.getItem('refreshToken')), null);
  const heldRestore = await holdNext('**/api/auth');
  await page.evaluate(() => {
    localStorage.setItem('refreshToken', 'fixture-refresh');
    window.pendingRestore = getAccessToken('home').catch((error) => error.status);
  });
  const restoreResponse = await heldRestore.pending;
  await page.evaluate(() => {
    window.KakaoLogin = { postMessage() {} };
    CandleBackend.login('kakao');
  });
  await restoreResponse.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { Authorization: 'obsolete-access' },
    body: '{}',
  });
  assert.equal(await page.evaluate(() => window.pendingRestore), -1);
  assert.match(page.url(), /#signup$/);
  assert.equal(await page.evaluate(() => localStorage.getItem('accessToken')), null);
  await heldRestore.remove();
  const beforeCancelledLogin = requests.length;
  await page.evaluate(() => {
    CandleBackend.login('kakao');
    CandleBackend.logout();
    receiveKakaoToken('cancelled-provider-token');
  });
  await page.waitForTimeout(50);
  assert.equal(requests.length, beforeCancelledLogin);
  assert.equal(await page.evaluate(() => localStorage.getItem('refreshToken')), null);
  assert.deepEqual(errors, []);
  await context.close();
  console.log(
    `PASS: ${checks} tidy layout checks; temporary/native login, token refresh, server stocks, prediction guards/payloads/errors, FCM and forms (${apiCount} local fixture requests).`
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
