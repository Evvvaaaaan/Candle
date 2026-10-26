import assert from 'node:assert/strict';
import { access, mkdir, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from '../scripts/serve.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = (await readdir(path.join(root, 'html'))).filter((file) => file.endsWith('.html')).sort();
assert.equal(pages.length, 28);
// Building must preserve the exact editable handoff, including all relative assets.
for (const file of await readdir(path.join(root, 'html'), { recursive: true, withFileTypes: true })) {
  if (!file.isFile()) continue;
  const relative = path.relative(path.join(root, 'html'), path.join(file.parentPath, file.name));
  assert.deepEqual(
    await readFile(path.join(root, 'dist/html', relative)),
    await readFile(path.join(root, 'html', relative))
  );
}
const servers = [createServer(), createServer({ directory: path.join(root, 'dist') })];
await Promise.all(servers.map((server) => new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))));
let channel = process.env.PLAYWRIGHT_CHANNEL;
if (!channel && process.platform === 'darwin') {
  try {
    await access('/Applications/Google Chrome.app');
    channel = 'chrome';
  } catch {}
}
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  await mkdir(path.join(root, 'test-results'), { recursive: true });
  let checks = 0;
  for (const [targetIndex, server] of servers.entries()) {
    const base = `http://127.0.0.1:${server.address().port}/html/`;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [],
      businessRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('requestfailed', (request) => {
      // Moving between documents can cancel the outgoing page's remaining loads.
      if (request.failure()?.errorText !== 'net::ERR_ABORTED')
        errors.push(`${request.failure()?.errorText} ${request.url()}`);
    });
    page.on('response', (response) => {
      if (response.status() >= 400 && !response.url().startsWith('http://localhost:8080/'))
        errors.push(`${response.status()} ${response.url()}`);
    });
    page.on('request', (request) => {
      if (['xhr', 'fetch'].includes(request.resourceType())) businessRequests.push(request.url());
    });
    const go = async (file) => {
      await page.goto(base + file);
    };
    for (const viewport of targetIndex === 0
      ? [
          { width: 360, height: 800 },
          { width: 390, height: 844 },
          { width: 1440, height: 1000 },
        ]
      : [{ width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      for (const file of pages) {
        await go(file);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.evaluate(() => typeof window.CandleUI), 'object', file);
        assert.equal(await page.locator('.screen-view').count(), 1, file);
        assert.equal(await page.locator('.screen-view:visible').count(), 1, file);
        assert.deepEqual(
          await page
            .locator('img')
            .evaluateAll((images) =>
              images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src)
            ),
          [],
          file
        );
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          true,
          `overflow in ${file} at ${viewport.width}`
        );
        for (const link of await page
          .locator('a[href]')
          .evaluateAll((links) => links.map((link) => link.getAttribute('href')))) {
          assert(!link.startsWith('#'), `fragment navigation remains: ${file} ${link}`);
          const destination = new URL(link, base);
          assert.equal(destination.origin, new URL(base).origin);
          await access(path.join(root, decodeURIComponent(destination.pathname)));
        }
        if (
          targetIndex === 0 &&
          viewport.width === 390 &&
          ['home.html', 'stock-select.html', 'prediction.html', 'payout.html'].includes(file)
        ) {
          await page.screenshot({
            path: path.join(root, 'test-results', `handoff-${file.replace('.html', '')}-mobile.png`),
            fullPage: true,
          });
        }
        checks++;
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await go('home.html');
    await page.locator('[data-stock-picker]').click();
    await page.waitForURL(/stock-select\.html/);
    await page.locator('#stock-search-input').fill('하이닉스');
    assert.equal(await page.locator('[data-stock-code]:visible').count(), 1);
    await page.locator('[data-stock-code="000660"]').evaluate((row) => {
      row.dataset.topicId = 'fixture-topic-42';
      CandleUI.syncSelection();
    });
    await page.locator('[data-stock-code="000660"]').click();
    await page.waitForURL(/home\.html/);
    assert.equal(await page.locator('[data-stock-name-value]').first().innerText(), 'SK하이닉스');
    await page.locator('[data-direction="down"]').click();
    await page.waitForURL(/prediction\.html/);
    assert.equal(await page.locator('[data-direction="down"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-watchlist-toggle]').click();
    await page.locator('[data-route="confirm"]').click();
    await page.waitForURL(/confirm\.html/);
    assert.equal(new URL(page.url()).searchParams.get('topicId'), 'fixture-topic-42');
    assert.match(await page.locator('[data-direction-confirm]').innerText(), /하락/);
    await page.locator('#submit-prediction').click();
    assert.match(await page.locator('#action-error').innerText(), /실제 서버 연결이 필요합니다/);
    assert.match(page.url(), /confirm\.html/);
    await go('stock-select.html');
    await page.locator('[data-market="watchlist"]').click();
    assert.equal(await page.locator('[data-stock-code]:visible').count(), 1);
    assert.equal(await page.locator('[data-stock-code]:visible').getAttribute('data-stock-code'), '000660');
    await page.locator('#stock-search-input').fill('no-such-stock');
    assert.equal(await page.locator('#stock-empty').isVisible(), true);

    await go('shop.html');
    await page.locator('[data-wallet-tab="use"]').click();
    await page.waitForURL(/wallet\.html/);
    assert.equal(await page.locator('[data-wallet-tab="use"]').getAttribute('aria-pressed'), 'true');
    await go('history.html');
    assert.equal(await page.locator('[data-wallet-tab="use"]').getAttribute('aria-pressed'), 'true');
    await go('shop.html');
    await page.locator('[data-product="naverpay-10000"]').click();
    await page.waitForURL(/exchange\.html/);
    assert.match(await page.locator('[data-product-amount-value]').innerText(), /10,000/);
    await page.locator('[data-route="payout"]').click();
    await page.waitForURL(/payout\.html/);
    assert.match(await page.locator('[data-payout-amount-value]').innerText(), /10,000/);
    await page.locator('#phone').fill('01012345678');
    await page.locator('#name').fill('Test Recipient');
    await page.locator('#payout-agree').check();
    await page.locator('[data-legal="reward"]').click();
    assert.equal(await page.locator('#legal-dialog').evaluate((dialog) => dialog.open), true);
    await page.locator('#close-legal').click();
    assert.equal(await page.locator('#phone').inputValue(), '01012345678');
    assert.equal(await page.locator('#payout-submit').isEnabled(), true);
    await page.locator('#payout-submit').click();
    assert.match(await page.locator('#action-error').innerText(), /실제 서버 연결이 필요합니다/);
    assert(!page.url().includes('01012345678'));
    const stored = await page.evaluate(() =>
      JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } })
    );
    assert(!stored.includes('01012345678') && !stored.includes('Test Recipient'));
    await page.locator('[data-route="exchange"]').click();
    await page.goBack();
    assert.equal(await page.locator('#phone').inputValue(), '');

    await go('consent.html');
    assert.equal(await page.locator('#consent-submit').isDisabled(), true);
    await page.locator('#agree-all').check();
    assert.equal(await page.locator('#consent-submit').isEnabled(), true);
    await page.locator('[data-agreement]').first().uncheck();
    assert.equal(await page.locator('#agree-all').evaluate((input) => input.indeterminate), true);
    await page.locator('#agree-all').check();
    await page.locator('#consent-submit').click();
    assert.match(await page.locator('#action-error').innerText(), /실제 서버 연결이 필요합니다/);
    await go('challenge-reward.html');
    await page.locator('#reward-recipient').fill('naver-user');
    await page.locator('#reward-confirm').fill('different-user');
    for (const checkbox of await page.locator('#challenge-reward-form input[type="checkbox"]').all())
      await checkbox.check();
    await page.locator('#challenge-reward-form').evaluate((form) => form.requestSubmit());
    assert.match(await page.locator('#reward-form-error').innerText(), /일치하지/);
    await page.locator('#reward-confirm').fill('naver-user');
    await page.locator('#challenge-reward-form').evaluate((form) => form.requestSubmit());
    assert.match(await page.locator('#action-error').innerText(), /실제 서버 연결이 필요합니다/);

    await go('home.html');
    await page.locator('[data-reward-ad]').first().click();
    assert.equal(await page.locator('#reward-ad-dialog').evaluate((dialog) => dialog.open), true);
    await page.locator('#start-reward-ad').click();
    assert.match(await page.locator('#action-error').innerText(), /실제 서버 연결이 필요합니다/);
    await go('settings.html');
    await page.locator('[data-tutorial-replay]').click();
    assert.equal(await page.locator('#tutorial-dialog').evaluate((dialog) => dialog.open), true);
    await page.locator('#tutorial-next').click();
    await page.locator('#tutorial-next').click();
    await page.locator('#tutorial-next').click();
    assert.equal(await page.locator('#tutorial-dialog').evaluate((dialog) => dialog.open), false);
    await go('signup.html');
    for (const provider of ['kakao', 'naver', 'google', 'apple']) {
      await page.locator(`[data-login="${provider}"]`).click();
      assert.match(page.url(), /signup\.html/);
      assert.match(await page.locator('#action-error').innerText(), /앱에서만/);
    }
    assert.deepEqual(businessRequests, [], 'unconnected business actions must not send requests');
    // Intercept only local fixture responses, never reach a real login server.
    const calls = [];
    await page.route('http://localhost:8080/**', async (route) => {
      const request = route.request();
      calls.push({
        url: new URL(request.url()).pathname,
        method: request.method(),
        headers: request.headers(),
        body: request.postDataJSON(),
      });
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': new URL(base).origin,
          'Access-Control-Expose-Headers': 'Authorization, RefreshToken',
          Authorization: 'fixture-access',
          RefreshToken: 'fixture-refresh',
        },
        body: '{}',
      });
    });
    for (const [callback, args, provider, payload] of [
      ['receiveKakaoToken', ['kakao-token'], 'kakao', { accessToken: 'kakao-token' }],
      ['receiveNaverToken', ['naver-token'], 'naver', { accessToken: 'naver-token' }],
      [
        'receiveGoogleCredential',
        ['google-id', 'google-access'],
        'google',
        { token: 'google-id', accessToken: 'google-access' },
      ],
      [
        'receiveAppleCredential',
        ['apple-code', 'apple-id'],
        'apple',
        { authorizationCode: 'apple-code', identityToken: 'apple-id' },
      ],
    ]) {
      await go('signup.html');
      const offset = calls.length;
      await page.evaluate(({ callback, args }) => window[callback](...args), { callback, args });
      await page.waitForURL(/consent\.html$/);
      assert.equal(calls[offset].url, `/api/user/${provider}`);
      assert.equal(calls[offset].method, 'POST');
      assert.deepEqual(calls[offset].body, payload);
      assert.equal(calls[offset + 1].url, '/api/auth');
      assert.equal(calls[offset + 1].headers.refreshtoken, 'fixture-refresh');
      assert.deepEqual(
        await page.evaluate(() => [
          localStorage.getItem('refreshToken'),
          localStorage.getItem('accessToken'),
        ]),
        ['fixture-refresh', 'fixture-access']
      );
    }
    // Verify the copied helper's refresh and original-query retry contract.
    let reads = 0;
    await page.route('http://localhost:8080/api/user?*', async (route) => {
      reads++;
      assert.equal(
        route.request().headers().authorization,
        reads === 1 ? 'expired-fixture' : 'fixture-access'
      );
      await route.fulfill({ status: reads === 1 ? 401 : 200, contentType: 'application/json', body: '{}' });
    });
    const result = await page.evaluate(
      () =>
        new Promise((resolve) => {
          localStorage.setItem('accessToken', 'expired-fixture');
          func_ajax({
            url: '/api/user',
            type: 'GET',
            param: { id: 0 },
            success: () => resolve('ok'),
            error: () => resolve('error'),
          });
        })
    );
    assert.equal(result, 'ok');
    assert.equal(reads, 2);
    assert.deepEqual(errors, []);
    await context.close();
    // HTML links and the current screen survive without any scripts.
    const noJs = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const plain = await noJs.newPage();
    await plain.goto(base + 'home.html');
    await plain.locator('[data-route="shop"]').click();
    await plain.waitForURL(/shop\.html$/);
    assert.equal(await plain.locator('#shop').isVisible(), true);
    await noJs.close();
  }
  // Copying only html/ works independently of the repository's root preview.
  const fileContext = await browser.newContext();
  const local = await fileContext.newPage();
  await local.goto(pathToFileURL(path.join(root, 'html/home.html')).href);
  await local.locator('[data-route="shop"]').click();
  assert.equal(await local.locator('#shop').isVisible(), true);
  await fileContext.close();
  console.log(
    `PASS: ${checks} handoff page/layout checks; source/build navigation, forms, native login payloads and token refresh verified.`
  );
} finally {
  await browser?.close();
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
}
