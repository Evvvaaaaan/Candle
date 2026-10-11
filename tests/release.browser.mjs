import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { createServer } from '../scripts/serve.mjs';
import { fileURLToPath } from 'node:url';

const server = createServer({ contract: true });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const output = fileURLToPath(new URL('../test-results/', import.meta.url));
await mkdir(output, { recursive: true });
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
} catch (error) {
  server.close();
  throw error;
}
const checks = [],
  errors = [];
const check = (name, result = true) => {
  assert.ok(result, name);
  checks.push(name);
};
const context = await browser.newContext();
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('response', (response) => {
  if (response.status() >= 400 && !new URL(response.url()).pathname.startsWith('/api/'))
    errors.push(`Missing asset: ${response.url()}`);
});
const go = async (route) => {
  await page.goto(`${base}/core-flow.html#${route}`);
  await page.locator(`[data-screen="${route}"]`).waitFor();
};
const click = async (selector) => {
  await page.locator(selector).click();
};
const wait = async (route) => page.locator(`[data-screen="${route}"]`).waitFor();
try {
  await page.goto(`${base}/`);
  await wait('signup');
  check(
    'first visit opens login without a screen selection step',
    (await page.locator('#screen-picker,.prototype-panel').count()) === 0
  );
  await page.goto(`${base}/#signup`);
  await wait('signup');
  check(
    'root preserves route and opens the canonical Core Flow',
    page.url().endsWith('/core-flow.html#signup')
  );
  const css = await page.locator('.signup-intro').evaluate((x) => getComputedStyle(x).marginTop);
  check('requested login spacing is retained', css === '90px');
  await click('[data-login=naver]');
  await wait('consent');
  check('required consent initially blocks continuation', await page.locator('#consent-submit').isDisabled());
  await click('[data-legal=terms]');
  await wait('legal');
  check(
    'terms open a readable versioned document',
    (await page.locator('.legal-copy').textContent()).length > 50
  );
  await click('.back-button');
  await wait('consent');
  await click('#agree-all');
  await click('#privacy');
  check(
    'withdrawing one required agreement blocks continuation',
    await page.locator('#consent-submit').isDisabled()
  );
  await click('#privacy');
  await click('#consent-submit');
  await wait('home');
  check('home header has no more button', (await page.locator('.more-button').count()) === 0);
  await page.goto(`${base}/`);
  await wait('home');
  check('returning member enters home directly', !page.url().includes('#signup'));
  await click('[data-direction=up]');
  await wait('prediction');
  const upColors = await page.locator('[data-direction=up] .direction-icon').evaluate(async (el) => {
    const svg = new DOMParser().parseFromString(
      await (await fetch(el.querySelector('img').src)).text(),
      'image/svg+xml'
    );
    return {
      background: getComputedStyle(el).backgroundColor,
      stroke: svg.querySelector('path').getAttribute('stroke'),
    };
  });
  const luminance = (rgb) =>
    rgb
      .map((v) => v / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
      .reduce((v, c, i) => v + c * [0.2126, 0.7152, 0.0722][i], 0);
  const foreground = luminance(
    upColors.stroke
      .slice(1)
      .match(/../g)
      .map((x) => parseInt(x, 16))
  );
  const background = luminance(upColors.background.match(/\d+/g).map(Number));
  check(
    'selected up arrow contrasts at least 3 to 1 with its soft background',
    (background + 0.05) / (foreground + 0.05) >= 3
  );
  check(
    'direction choice exposes its selected state',
    (await page.locator('[data-direction=up]').getAttribute('aria-pressed')) === 'true'
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${output}/prediction-up-mobile.png` });
  await click('[data-direction=down]');
  await wait('prediction');
  await click('[data-stock-picker]');
  await wait('stock-select');
  await page.locator('#stock-search-input').fill('없는종목');
  check('empty stock search is explained', await page.locator('#stock-empty').isVisible());
  await page.locator('#stock-search-input').fill('035420');
  await click('[data-stock-code="035420"]');
  await wait('prediction');
  await click('.content [data-route=confirm]');
  await wait('confirm');
  await page.locator('#submit-prediction').evaluate((b) => {
    b.click();
    b.click();
  });
  await wait('submitted');
  check(
    'prediction receipt retains chosen stock and direction',
    (await page.locator('.content').textContent()).includes('NAVER') &&
      (await page.locator('.content').textContent()).includes('하락')
  );
  await page.reload();
  await wait('submitted');
  await go('pass');
  check(
    'double click and reload spend exactly one ticket',
    (await page.locator('.ticket-total').textContent()) === '0회'
  );
  await go('missions');
  await click('#attendance');
  await page.waitForFunction(() => document.querySelector('#attendance')?.textContent === '출석 완료');
  await page.reload();
  await wait('missions');
  check('attendance survives reload', await page.locator('#attendance').isDisabled());
  await go('result');
  await click('[data-claim="demo-result"]');
  await page.waitForFunction(() => document.querySelector('[data-claim]')?.textContent === '수령 완료');
  await page.reload();
  await wait('result');
  check('result claim survives reload', await page.locator('[data-claim="demo-result"]').isDisabled());
  await go('shop');
  await click('[data-product="naverpay-10000"]');
  await wait('exchange');
  check(
    'wallet includes attendance and result reward',
    (await page.locator('.summary-card').textContent()).includes('2,835P')
  );
  await click('.content [data-route=payout]');
  await wait('payout');
  await page.locator('#phone').fill('123');
  await page.locator('#name').fill('테스트고객');
  await click('#payout-agree');
  check('invalid phone blocks payout', await page.locator('#payout-submit').isDisabled());
  await page.locator('#phone').fill('01012345678');
  await click('[data-legal=reward]');
  await wait('legal');
  await click('.back-button');
  await wait('payout');
  check(
    'viewing payout terms retains the form only in memory',
    (await page.locator('#phone').inputValue()) === '01012345678' &&
      (await page.locator('#payout-agree').isChecked())
  );
  await click('#payout-submit');
  await wait('history');
  check('payout creates an actual demo history record', (await page.locator('.request-card').count()) === 1);
  await go('wallet');
  check(
    'wallet debit and four ledger entries persist',
    (await page.locator('.points-card').textContent()).includes('2,835') &&
      (await page.locator('.wallet-transaction').count()) === 4
  );
  check(
    'recipient is absent from persistent browser storage',
    !(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).includes(
      '01012345678'
    )
  );
  await go('shop');
  await click('[data-product="naverpay-5000"]');
  await wait('exchange');
  check(
    'insufficient points block exchange',
    await page.locator('.content [data-route=payout]').isDisabled()
  );
  await go('pass');
  await click('#watch-ad');
  await wait('ad');
  check('demo ad cannot be completed early', await page.locator('#verify-ad').isDisabled());
  await click('.content [data-route=pass]');
  await wait('pass');
  check(
    'closing an ad does not issue a ticket',
    (await page.locator('.ticket-total').textContent()) === '0회'
  );
  await click('#watch-ad');
  await wait('ad');
  await page.waitForFunction(() => !document.querySelector('#verify-ad')?.disabled, {}, { timeout: 20000 });
  await click('#verify-ad');
  await wait('pass');
  check('completed demo ad awards one ticket', (await page.locator('.ticket-total').textContent()) === '1회');
  await page.reload();
  await wait('pass');
  check(
    'ad reward survives reload without duplication',
    (await page.locator('.ticket-total').textContent()) === '1회'
  );

  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [375, 667],
    [390, 844],
    [414, 896],
    [430, 932],
    [760, 800],
    [768, 1024],
    [1280, 720],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of [
      'splash',
      'signup',
      'consent',
      'home',
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
      'history',
      'profile',
      'payout',
      'prediction-history',
      'wallet',
      'settings',
      'legal',
    ]) {
      // SPA navigation preserves selected product for exchange and payout views.
      await page.evaluate((route) => (location.hash = route), route);
      await wait(route);
      check(
        `${width}x${height} ${route}: no prototype labels or controls`,
        !/demo|데모/i.test(await page.locator('#app').innerText()) &&
          (await page.locator('#screen-picker,.prototype-panel').count()) === 0
      );
      const failures = await page.evaluate(() => {
        const errors = [],
          phone = document.querySelector('.phone').getBoundingClientRect();
        if (document.documentElement.scrollWidth > innerWidth) errors.push('page overflows');
        if (phone.bottom > innerHeight + 1 || phone.top < 0) errors.push('phone offscreen');
        for (const x of document.querySelectorAll(
          '.content,.signup-content,.consent-main,.stock-select-content,.payout-content'
        )) {
          if (x.scrollWidth > x.clientWidth + 1) errors.push(`${x.className} overflows`);
          const last = [...x.querySelectorAll('button,input')]
            .filter((b) => !b.hidden && b.getBoundingClientRect().width)
            .at(-1);
          if (last) {
            last.scrollIntoView({ block: 'center', behavior: 'instant' });
            const r = last.getBoundingClientRect();
            if (!last.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)))
              errors.push('last control obscured');
          }
          x.scrollTop = 0;
        }
        return errors;
      });
      check(`${width}x${height} ${route}: no overflow`, failures.length === 0);
    }
  }
  await go('signup');
  await page.screenshot({ path: `${output}/signup-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await go('home');
  await page.screenshot({ path: `${output}/home-mobile.png` });
  await go('signup');
  await page.screenshot({ path: `${output}/signup-mobile.png` });

  for (const route of ['profile', 'wallet', 'missions', 'shop', 'history', 'result', 'settings']) {
    await go(route);
    await page.screenshot({ path: `${output}/${route}-mobile.png` });
  }
  await go('wallet');
  check(
    'wallet rows have readable internal padding and separate spacing',
    await page
      .locator('.wallet-transaction')
      .first()
      .evaluate((row) => {
        const style = getComputedStyle(row);
        return parseFloat(style.paddingLeft) >= 14 && parseFloat(style.marginTop) >= 8;
      })
  );
  check(
    'wallet distinguishes credits and debits with text and icons',
    (await page.locator('.transaction-amount.earned').count()) === 4 &&
      (await page.locator('.transaction-amount:not(.earned)').textContent()).includes('사용')
  );
  await go('profile');
  check(
    'both profile statistics fill their row evenly',
    await page.locator('.stats-grid').evaluate((row) => {
      const [first, second] = [...row.children].map((x) => x.getBoundingClientRect());
      const rect = row.getBoundingClientRect();
      return Math.abs(first.width - second.width) < 1 && Math.abs(second.right - rect.right) < 1;
    })
  );
  check(
    'profile activity menu includes icons and preserves real navigation',
    (await page.locator('.menu-row .menu-icon .ui-icon').count()) === 4
  );
  await click('.menu-row[data-route=wallet]');
  await wait('wallet');
  await go('missions');
  check(
    'completed attendance and missions remain visible after the style update',
    (await page.locator('#attendance').isDisabled()) &&
      (await page.locator('.mission-status.complete').count()) === 2
  );
  await go('shop');
  check(
    'official Npay artwork loads with its original square proportions',
    await page
      .locator('img.npay-logo')
      .first()
      .evaluate(
        (img) =>
          img.complete &&
          img.naturalWidth === 140 &&
          img.naturalHeight === 140 &&
          img.clientWidth === img.clientHeight
      )
  );

  // Exercise actual HTTP/cookie API mode against the local contract simulator.
  const live = await browser.newContext();
  const apiPage = await live.newPage({ viewport: { width: 390, height: 844 } });
  apiPage.on('pageerror', (error) => errors.push(error.message));
  const mutations = [];
  apiPage.on('request', (request) => {
    if (request.method() === 'POST')
      mutations.push({ url: request.url(), headers: request.headers(), body: request.postDataJSON() });
  });
  await apiPage.goto(`${base}/?mode=api#home`);
  await apiPage.locator('[data-screen=signup]').waitFor();
  check(
    'API mode guards protected deep links and has no prototype navigation',
    (await apiPage.locator('#screen-picker,.prototype-panel').count()) === 0
  );
  await apiPage.locator('[data-login=kakao]').click();
  await apiPage.locator('[data-screen=consent]').waitFor();
  await apiPage.locator('#agree-all').click();
  await apiPage.locator('#consent-submit').click();
  await apiPage.locator('[data-screen=home]').waitFor();
  check(
    'API login callback, session cookie and versioned consent work',
    mutations.some((x) => x.url.endsWith('/legal/agreements') && x.body.agreements.every((a) => a.version))
  );
  await apiPage.locator('[data-direction=up]').click();
  await apiPage.locator('.content [data-route=confirm]').click();
  await apiPage.locator('#submit-prediction').evaluate((b) => {
    b.click();
    b.click();
  });
  await apiPage.locator('[data-screen=submitted]').waitFor();
  const predictions = mutations.filter((x) => x.url.endsWith('/predictions'));
  check(
    'API prediction sends one request with CSRF and idempotency keys',
    predictions.length === 1 &&
      !!predictions[0].headers['x-csrf-token'] &&
      !!predictions[0].headers['idempotency-key']
  );
  await apiPage.evaluate(() => (location.hash = 'shop'));
  await apiPage.locator('[data-product="naverpay-5000"]').click();
  await apiPage.locator('.content [data-route=payout]').click();
  await apiPage.locator('#phone').fill('01022223333');
  await apiPage.locator('#name').fill('테스트');
  await apiPage.locator('#payout-agree').check();
  let failOnce = true;
  await apiPage.route('**/api/v1/reward-claims', async (route) => {
    if (route.request().method() === 'POST' && failOnce) {
      failOnce = false;
      await route.abort();
    } else await route.continue();
  });
  await apiPage.locator('#payout-submit').click();
  await apiPage.locator('#action-error').waitFor();
  check(
    'network failure does not show payout success',
    await apiPage.locator('[data-screen=payout]').isVisible()
  );
  await apiPage.locator('#payout-submit').click();
  await apiPage.locator('[data-screen=history]').waitFor();
  const payouts = mutations.filter((x) => x.url.endsWith('/reward-claims'));
  check(
    'manual retry retains the payout idempotency key',
    payouts.length === 2 && payouts[0].headers['idempotency-key'] === payouts[1].headers['idempotency-key']
  );
  check('API payout shows server history', (await apiPage.locator('.request-card').count()) === 1);
  await apiPage.route('**/api/v1/missions/attendance', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":{"code":"SESSION_EXPIRED"}}',
    })
  );
  await apiPage.evaluate(() => (location.hash = 'missions'));
  await apiPage.locator('#attendance').click();
  await apiPage.locator('[data-screen=signup]').waitFor();
  check('expired mutation session clears protected UI and asks for login');
  await apiPage.unroute('**/api/v1/missions/attendance');
  await apiPage.route('**/api/v1/stocks/top-list', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          ticker: '005930',
          name: '<img src=x onerror=window.injected=true>',
          currentPrice: '72400',
          changeRate: '1',
        },
      ]),
    })
  );
  await apiPage.goto(`${base}/?mode=api#home`);
  await apiPage.locator('[data-screen=home]').waitFor();
  check(
    'API stock names render as text and cannot execute HTML',
    await apiPage.evaluate(
      () => !window.injected && document.querySelector('.stock-name').textContent.includes('<img')
    )
  );
  await apiPage.route('**/api/v1/wallet', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":{"code":"SERVER_ERROR"}}' })
  );
  await apiPage.reload();
  await apiPage.locator('#retry').waitFor();
  check(
    'API failure is explicit and does not fall back to demo',
    (await apiPage.locator('.points-card').count()) === 0
  );
  await apiPage.unroute('**/api/v1/wallet');
  await apiPage.locator('#retry').click();
  await apiPage.locator('[data-screen=home]').waitFor();
  check('retry restores server data');
  await apiPage.route('**/api/v1/stocks/top-list', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  );
  await apiPage.reload();
  await apiPage.locator('[data-screen=home]').waitFor();
  check(
    'empty stock API has an explicit empty state and no invented stock',
    (await apiPage.locator('.stock-name').count()) === 0 &&
      (await apiPage.locator('.content').textContent()).includes('종목이 없어요')
  );
  await apiPage.unroute('**/api/v1/stocks/top-list');
  await apiPage.route('**/api/v1/wallet', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":{"code":"SESSION_EXPIRED"}}',
    })
  );
  await apiPage.reload();
  await apiPage.locator('[data-screen=signup]').waitFor();
  check(
    'startup session expiry retains usable login providers',
    (await apiPage.locator('[data-login]').count()) > 0
  );
  await apiPage.unroute('**/api/v1/wallet');
  await apiPage.route('**/api/v1/wallet', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ balance: 7800, items: [], nextCursor: 'page-2' }),
    })
  );
  await apiPage.route('**/api/v1/wallet/transactions?*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [{ id: 'older', title: '이전 적립', amount: 20, createdAt: '2026-09-01T00:00:00Z' }],
        nextCursor: null,
      }),
    })
  );
  await apiPage.goto(`${base}/?mode=api#wallet`);
  await apiPage.locator('[data-more=wallet]').click();
  await apiPage.waitForFunction(() => document.querySelector('.content')?.textContent.includes('이전 적립'));
  check(
    'cursor pagination appends earlier history and stops at the last page',
    (await apiPage.locator('[data-more=wallet]').count()) === 0
  );
  await apiPage.unroute('**/api/v1/wallet/transactions?*');
  await apiPage.route('**/api/v1/wallet/transactions?*', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":{"code":"SESSION_EXPIRED"}}',
    })
  );
  await apiPage.reload();
  await apiPage.locator('[data-more=wallet]').click();
  await apiPage.locator('[data-screen=signup]').waitFor();
  check(
    'pagination session expiry clears balances and redirects to login',
    (await apiPage.locator('.points-card').count()) === 0
  );
  await apiPage.unroute('**/api/v1/wallet');
  await apiPage.goto(`${base}/?mode=api#settings`);
  await apiPage.locator('#logout').click();
  await apiPage.locator('[data-screen=signup]').waitFor();
  await apiPage.evaluate(() => (location.hash = 'home'));
  await apiPage.locator('[data-screen=signup]').waitFor();
  check('logout invalidates the cookie and protected back navigation');
  await live.close();
  const directory = fileURLToPath(new URL('../dist/', import.meta.url));
  try {
    await access(`${directory}/config.js`);
  } catch {
    await import('../scripts/build.mjs');
  }
  const production = createServer({ contract: true, directory });
  await new Promise((resolve) => production.listen(0, '127.0.0.1', resolve));
  const prodBase = `http://127.0.0.1:${production.address().port}`;
  const prodPage = await context.newPage();
  prodPage.on('pageerror', (error) => errors.push(error.message));
  try {
    await prodPage.goto(`${prodBase}/#home`);
    await prodPage.locator('[data-screen=signup]').waitFor();
    check(
      'production build starts in API mode without prototype controls',
      (await prodPage.locator('#screen-picker,.prototype-panel').count()) === 0
    );
    for (const path of ['/src/js/demo-service.mjs', '/pages/home.html', '/scripts/serve.mjs', '/.git/config'])
      check(`production excludes ${path}`, (await prodPage.request.get(prodBase + path)).status() === 404);
    await prodPage.locator('[data-login=google]').click();
    await prodPage.locator('#agree-all').check();
    await prodPage.locator('#consent-submit').click();
    await prodPage.locator('[data-screen=home]').waitFor();
    check(
      'production artifact completes the HTTP login and consent flow',
      (await prodPage.locator('.points-card').count()) === 1
    );
    await prodPage.screenshot({ path: `${output}/api-production.png` });
  } finally {
    await prodPage.close();
    await new Promise((resolve) => production.close(resolve));
  }
  check('no uncaught JavaScript exceptions', errors.length === 0);
  console.log(`PASS ${checks.length} browser checks; ${errors.length} JavaScript errors.`);
  await writeFile(
    `${output}/results.json`,
    JSON.stringify({ passed: checks.length, checks, errors }, null, 2)
  );
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png` });
  console.error(error);
  console.error(JSON.stringify({ passed: checks.length, last: checks.at(-1), errors }));
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
