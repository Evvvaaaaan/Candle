import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, access } from 'node:fs/promises';
import { createServer } from '../scripts/serve.mjs';

const server = createServer({ contract: true, directory: new URL('../dist/', import.meta.url).pathname });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let channel = process.env.PLAYWRIGHT_CHANNEL;
if (!channel && process.platform === 'darwin') {
  try {
    await access('/Applications/Google Chrome.app');
    channel = 'chrome';
  } catch {}
}
let browser;
const checks = [];
const check = (name, condition) => {
  assert.ok(condition, name);
  checks.push(name);
};
try {
  browser = await chromium.launch({ headless: true, ...(channel ? { channel } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.route('https://example.com/fixture-ad/**', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<title>Ad fixture</title><p>Video provider fixture</p>',
    })
  );
  const page = await context.newPage();
  const errors = [],
    starts = [],
    verifications = [],
    predictions = [];
  const tickets = { free: 0, ad: 0, adCount: 0, adLimit: 2 };
  let failStart = true,
    verifyMode = 'pending';
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().endsWith('/predictions')) predictions.push(request);
  });
  await page.route('**/api/v1/prediction-tickets', (route) => route.fulfill({ json: tickets }));
  await page.route('**/api/v1/ads/sessions', (route) => {
    starts.push(route.request().headers());
    if (failStart) {
      failStart = false;
      return route.abort();
    }
    return route.continue();
  });
  await page.route('**/api/v1/ads/sessions/verify', (route) => {
    verifications.push(route.request().headers());
    if (verifyMode === 'pending')
      return route.fulfill({ status: 409, json: { error: { code: 'AD_NOT_VERIFIED' } } });
    if (verifyMode === 'network') return route.abort();
    tickets.ad += 1;
    tickets.adCount += 1;
    return route.fulfill({ json: { status: 'VERIFIED' } });
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator('[data-login=kakao]').click();
  await page.locator('#agree-all').check();
  await page.locator('#consent-submit').click();
  await page.locator('[data-screen=home]').waitFor();
  await mkdir('test-results', { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/reward-ad-home-mobile.png' });
  check(
    'home offers reward ads separately from its existing advertisement',
    (await page.locator('.reward-ticket-entry [data-reward-ad]').isVisible()) &&
      (await page.locator('.home-ad-slot').getAttribute('data-route')) === 'prediction'
  );
  await page.locator('[data-reward-ad]').click();
  check(
    'home opens the reward sheet without changing route or starting a session',
    page.url().endsWith('#home') &&
      starts.length === 0 &&
      (await page.locator('#reward-ad-dialog').isVisible())
  );
  await page.keyboard.press('Escape');
  await page.locator('#reward-ad-dialog').waitFor({ state: 'detached' });
  check(
    'Escape closes the sheet and restores focus',
    (await page.locator('#reward-ad-dialog').count()) === 0 &&
      (await page.locator('[data-reward-ad]').evaluate((el) => el === document.activeElement))
  );
  await page.locator('.bottom-nav [data-route=prediction]').click();
  await page.locator('[data-stock-picker]').click();
  await page.locator('[data-stock-code="035420"]').click();
  await page.locator('[data-direction=down]').click();
  check(
    'a user with zero tickets can select a direction before watching',
    (await page.locator('[data-direction=down]').getAttribute('aria-pressed')) === 'true'
  );
  await page.locator('[data-reward-ad]').click();
  check(
    'prediction opens the sheet directly with remaining allowance',
    page.url().endsWith('#prediction') &&
      (await page.locator('.reward-ad-allowance').innerText()).includes('2 / 2')
  );
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    const size = await page.locator('#reward-ad-dialog').evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.left >= 0 &&
        rect.right <= innerWidth + 1 &&
        rect.top >= 0 &&
        rect.bottom <= innerHeight + 1 &&
        el.scrollWidth <= el.clientWidth + 1
      );
    });
    check(`${width}px reward sheet fits inside the viewport`, size);
    await page.locator('#cancel-reward-ad').scrollIntoViewIfNeeded();
    check(
      `${width}px sheet controls remain reachable`,
      await page.locator('#cancel-reward-ad').evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      })
    );
    await page.screenshot({ path: `test-results/reward-ad-sheet-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  let popupPromise = context.waitForEvent('page');
  await page.locator('#start-reward-ad').click();
  let popup = await popupPromise;
  await page.locator('#action-error').waitFor();
  if (!popup.isClosed()) await popup.waitForEvent('close');
  check(
    'failed session start closes its blank popup and preserves the prediction',
    starts.length === 1 && page.url().endsWith('#prediction') && popup.isClosed()
  );
  await page.locator('[data-reward-ad]').click();
  popupPromise = context.waitForEvent('page');
  await page.locator('#start-reward-ad').click();
  popup = await popupPromise;
  await popup.waitForURL('https://example.com/fixture-ad/**');
  await page.locator('[data-screen=ad]').waitFor();
  check(
    'a user gesture opens the provider directly with no opener',
    await popup.evaluate(() => opener === null)
  );
  check(
    'uncertain session-start retry reuses its idempotency key',
    starts[0]['idempotency-key'] === starts[1]['idempotency-key']
  );
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.locator('#action-error').waitFor();
  check(
    'returning from an unverified ad does not grant tickets or navigate away',
    verifications.length === 1 && tickets.ad === 0 && page.url().endsWith('#ad')
  );
  verifyMode = 'network';
  await page.locator('#verify-ad').click();
  await page.waitForFunction(() => document.getElementById('action-error')?.textContent.includes('연결'));
  verifyMode = 'verified';
  await page.locator('#verify-ad').click();
  await page.locator('[data-screen=prediction]').waitFor();
  check(
    'verification retries reuse the key after an unknown network outcome',
    verifications[1]['idempotency-key'] === verifications[2]['idempotency-key']
  );
  check(
    'verified reward returns to the selected stock and direction without submitting',
    (await page.locator('.stock-name').innerText()) === 'NAVER' &&
      (await page.locator('[data-direction=down]').getAttribute('aria-pressed')) === 'true' &&
      (await page.locator('.ticket-total').innerText()) === '1회' &&
      predictions.length === 0
  );
  check(
    'reward requests include CSRF and idempotency headers',
    [...starts, ...verifications].every((headers) => headers['x-csrf-token'] && headers['idempotency-key'])
  );
  await popup.close();
  // Some browsers block popups: the explicit provider link must remain available.
  await page.locator('.bottom-nav [data-route=home]').click();
  await page.evaluate(() => {
    window.open = () => null;
  });
  await page.locator('[data-reward-ad]').click();
  await page.locator('#start-reward-ad').click();
  await page.locator('[data-screen=ad]').waitFor();
  check(
    'blocked popup exposes a provider link without inventing a reward',
    (await page.locator('#open-reward-ad').getAttribute('href')).startsWith(
      'https://example.com/fixture-ad/'
    ) && tickets.ad === 1
  );
  popupPromise = context.waitForEvent('page');
  await page.locator('#open-reward-ad').click();
  popup = await popupPromise;
  await popup.waitForURL('https://example.com/fixture-ad/**');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.locator('[data-screen=prediction]').waitFor();
  check(
    'provider-link fallback also verifies automatically on return',
    tickets.ad === 2 && verifications.length === 4 && predictions.length === 0
  );
  await popup.close();
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  check('focusing after completion does not verify or award again', verifications.length === 4);
  await page.locator('.bottom-nav [data-route=home]').click();
  await page.reload();
  await page.locator('[data-screen=home]').waitFor();
  check('daily limit disables the home reward entry', await page.locator('[data-reward-ad]').isDisabled());
  check('no uncaught JavaScript errors', errors.length === 0);
  console.log(`PASS ${checks.length} reward-ad browser checks; ${errors.length} JavaScript errors.`);
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
