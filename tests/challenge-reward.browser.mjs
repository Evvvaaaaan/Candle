import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from '../scripts/serve.mjs';
import { demoChallengeReward } from '../src/js/demo-service.mjs';
import { rewardStatuses } from '../src/js/challenge-reward.mjs';

const server = createServer({ contract: true, directory: new URL('../dist/', import.meta.url).pathname });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  ...(process.env.PLAYWRIGHT_CHANNEL
    ? { channel: process.env.PLAYWRIGHT_CHANNEL }
    : process.platform === 'darwin'
      ? { channel: 'chrome' }
      : {}),
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const checks = [],
  errors = [];
const check = (name, value) => {
  assert.ok(value, name);
  checks.push(name);
};
page.on('pageerror', (error) => errors.push(error.message));
const endpoint = '**/api/v1/challenges/ten-wins/reward';
const claimEndpoint = '**/api/v1/challenges/ten-wins/claims';
const open = async () => {
  await page.goto(`${base}/#challenge-reward`);
  await page.locator('.prize-hero').waitFor();
};
const agree = async () => {
  for (const checkbox of await page.locator('.prize-agreements input').all()) await checkbox.check();
};
await mkdir('test-results', { recursive: true });
try {
  await page.goto(base);
  await page.locator('[data-login=naver]').click();
  await page.locator('#agree-all').check();
  await page.locator('#consent-submit').click();
  await page.locator('.bottom-nav [data-route=profile]').click();
  await page.locator('[data-route=challenge-reward]').click();
  await page.locator('#challenge-reward-form').waitFor();
  check(
    'prize receipt is reachable through the real profile menu flow',
    page.url().endsWith('#challenge-reward')
  );
  await page.locator('#submit-challenge-reward').click();
  check(
    'empty recipient reports an inline error',
    (await page.locator('#reward-recipient').getAttribute('aria-invalid')) === 'true'
  );
  await page.locator('#reward-recipient').fill('candle_private_test');
  await page.locator('#reward-confirm').fill('different_id');
  await page.locator('#submit-challenge-reward').click();
  check(
    'mismatched recipient confirmation blocks submission',
    (await page.locator('#reward-form-error').textContent()).includes('일치')
  );
  await page.locator('#reward-confirm').fill('candle_private_test');
  await page.locator('#submit-challenge-reward').click();
  check(
    'missing consent blocks submission',
    (await page.locator('#reward-form-error').textContent()).includes('필수 동의')
  );
  await agree();
  const keys = [];
  await page.route(claimEndpoint, async (route) => {
    keys.push(route.request().headers()['idempotency-key']);
    if (keys.length === 1) await route.abort();
    else await route.continue();
  });
  await page.locator('#submit-challenge-reward').click();
  await page.locator('#action-error').waitFor();
  const stored = await page.evaluate(() =>
    JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)])
  );
  check('network retry metadata excludes recipient PII', !stored.includes('candle_private_test'));
  check(
    'failed submission preserves the form for retry',
    (await page.locator('#reward-recipient').inputValue()) === 'candle_private_test'
  );
  await page.locator('#submit-challenge-reward').click();
  await page.locator('.prize-status h2').waitFor();
  check('retry uses the same idempotency key', keys.length === 2 && keys[0] === keys[1]);
  check(
    'successful submission shows REQUESTED, not PAID',
    (await page.locator('.prize-status h2').textContent()).includes('접수')
  );
  check(
    'submitted recipient is removed from the page',
    (await page.locator('#reward-recipient').count()) === 0
  );
  check(
    'prize does not spend wallet points',
    (await (await page.request.get(`${base}/api/v1/wallet`)).json()).balance === 12800
  );
  await page.screenshot({ path: 'test-results/challenge-reward-requested-mobile.png' });
  await open();
  check('receipt survives reload', (await page.locator('.prize-status h2').textContent()).includes('접수'));
  await page.unroute(claimEndpoint);

  let fixture = demoChallengeReward();
  await page.route(endpoint, (route) => route.fulfill({ json: fixture }));
  for (const status of Object.keys(rewardStatuses)) {
    fixture = {
      ...demoChallengeReward(),
      status,
      claimId: ['REQUESTED', 'PROCESSING', 'PAID'].includes(status) ? 'claim-test' : null,
    };
    await open();
    check(
      `${status} exposes a form only for eligible recipients`,
      (await page.locator('#challenge-reward-form').count()) === (status === 'ELIGIBLE' ? 1 : 0)
    );
    check(
      `${status} renders its own status heading`,
      (await page.locator('.prize-hero h2').textContent()) === rewardStatuses[status][0]
    );
  }
  fixture = demoChallengeReward();
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [1440, 900],
  ]) {
    await page.setViewportSize({ width, height });
    await open();
    check(
      `${width} reward form stays inside the viewport`,
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <= innerWidth &&
          [...document.querySelectorAll('.prize-form input')].every(
            (x) => x.getBoundingClientRect().right <= innerWidth
          )
      )
    );
    await page.screenshot({ path: `test-results/challenge-reward-${width}.png` });
    await page.locator('#submit-challenge-reward').scrollIntoViewIfNeeded();
    check(
      `${width} submit is reachable above navigation`,
      await page
        .locator('#submit-challenge-reward')
        .evaluate(
          (x) =>
            x.getBoundingClientRect().bottom <=
            document.querySelector('.bottom-nav').getBoundingClientRect().top
        )
    );
    if (width === 390) await page.screenshot({ path: 'test-results/challenge-reward-form-mobile.png' });
  }
  fixture = {
    ...demoChallengeReward(),
    method: 'COUPON_SMS',
    agreements: demoChallengeReward().agreements.slice(0, 1),
  };
  await page.setViewportSize({ width: 390, height: 844 });
  await open();
  check(
    'coupon delivery asks for a phone, not a Naver ID',
    (await page.locator('#reward-recipient').getAttribute('type')) === 'tel'
  );
  await page.locator('#reward-recipient').fill('010-1234-5678');
  await page.locator('#reward-confirm').fill('01012345678');
  await agree();
  let couponBody;
  await page.route(claimEndpoint, async (route) => {
    couponBody = route.request().postDataJSON();
    fixture = { ...fixture, status: 'REQUESTED', claimId: 'coupon-claim' };
    await route.fulfill({ json: { id: 'coupon-claim' } });
  });
  await page.locator('#submit-challenge-reward').click();
  await page.locator('.prize-status h2').waitFor();
  check(
    'coupon request sends only the normalized phone',
    JSON.stringify(couponBody.recipient) === JSON.stringify({ phone: '01012345678' })
  );
  await page.unroute(claimEndpoint);
  fixture = { ...demoChallengeReward(), claimDeadline: new Date(Date.now() - 1000).toISOString() };
  await open();
  await page.locator('#submit-challenge-reward').click();
  check(
    'expired deadline prevents submission',
    (await page.locator('#reward-form-error').textContent()).includes('기간이 지났')
  );
  await page.unroute(endpoint);
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 503, json: { error: { code: 'SERVER_ERROR' } } })
  );
  await page.goto(`${base}/#challenge-reward`);
  await page.locator('#retry-reward').waitFor();
  check(
    'unavailable backend gives a recoverable state',
    (await page.locator('.prize-status').textContent()).includes('준비 중')
  );
  await page.unroute(endpoint);
  await page.locator('#retry-reward').click();
  await page.locator('.prize-hero').waitFor();
  check(
    'retry recovers from an unavailable endpoint',
    (await page.locator('.prize-status h2').count()) === 1
  );
  await page.route(endpoint, (route) =>
    route.fulfill({ status: 401, json: { error: { code: 'SESSION_EXPIRED' } } })
  );
  await page.locator('#retry-reward').click();
  await page.locator('[data-screen=signup]').waitFor();
  check('expired authentication removes the reward page', (await page.locator('.prize-hero').count()) === 0);
  check('no uncaught JavaScript errors', errors.length === 0);
  await writeFile(
    'test-results/challenge-reward-results.json',
    JSON.stringify({ passed: checks.length, checks, errors }, null, 2)
  );
  console.log(`PASS ${checks.length} prize browser checks; ${errors.length} JavaScript errors.`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
