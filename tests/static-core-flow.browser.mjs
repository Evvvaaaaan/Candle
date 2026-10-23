import assert from 'node:assert/strict';
import { access, copyFile, mkdir, mkdtemp, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from '../scripts/serve.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const routes = [
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
];
const html = await readFile(path.join(root, 'core-flow.html'), 'utf8');
assert.equal(html, await readFile(path.join(root, 'index.html'), 'utf8'));
assert.doesNotMatch(html, /\son\w+\s*=|javascript:|demo-service|config\.js/i);
const files = await readdir(path.join(root, 'dist'), { recursive: true });
assert.deepEqual(files.sort(), ['_headers', 'core-flow.html', 'index.html']);
const isolatedDirectory = await mkdtemp(path.join(tmpdir(), 'candle-standalone-'));
const isolatedFile = path.join(isolatedDirectory, 'core-flow.html');
await copyFile(path.join(root, 'core-flow.html'), isolatedFile);
assert.deepEqual(await readdir(isolatedDirectory), ['core-flow.html']);

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
  let layoutChecks = 0;
  const targets = servers.map((server) => ({
    rootUrl: `http://127.0.0.1:${server.address().port}/`,
    entryUrl: `http://127.0.0.1:${server.address().port}/core-flow.html`,
    offline: false,
  }));
  targets.push({
    rootUrl: pathToFileURL(isolatedFile).href,
    entryUrl: pathToFileURL(isolatedFile).href,
    offline: true,
  });
  for (const [index, target] of targets.entries()) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      offline: target.offline,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    const errors = [],
      serverRequests = [],
      resourceRequests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (['fetch', 'xhr'].includes(request.resourceType()) || /\/api\/|\/auth\//.test(request.url()))
        serverRequests.push(request.url());
      if (request.resourceType() !== 'document' && /^(https?|file):/.test(request.url()))
        resourceRequests.push(request.url());
      if (target.offline && request.resourceType() === 'document')
        assert.equal(request.url().split('#')[0], target.entryUrl);
    });
    page.on('requestfailed', (request) =>
      errors.push(`${request.failure()?.errorText}: ${request.url().slice(0, 200)}`)
    );
    page.on('response', (response) => {
      if (new URL(response.url()).hostname === '127.0.0.1' && response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    const visible = async (route) => {
      await page.locator(`#${route}`).waitFor({ state: 'visible' });
      assert.deepEqual(
        await page.locator('.screen-view:visible').evaluateAll((nodes) => nodes.map((node) => node.id)),
        [route]
      );
    };
    const go = async (route) => {
      await page.goto(`${target.entryUrl}#${route}`);
      await visible(route);
    };
    const serverError = async (target = '#action-error') =>
      assert.match(await page.locator(target).innerText(), /실제 서버 연결이 필요합니다/);
    const serverFacts = async () =>
      page.evaluate(() => ({
        values: [...document.querySelectorAll('[data-server-value], .ticket-breakdown, .badge')].map(
          (node) => node.textContent
        ),
        wallet: document.querySelector('#wallet .transaction-list').textContent,
        submitted: document.querySelector('#submitted .content').textContent,
        attendance: document.querySelector('#attendance').textContent,
      }));
    await page.goto(target.rootUrl);
    await visible('signup');
    assert.equal(await page.locator('#signup .auth-button small').count(), 0);
    assert.equal(await page.locator('.static-splash-note, .static-next').count(), 0);
    await page.screenshot({ path: path.join(root, `test-results/input-${index}-signup.png`) });
    for (const provider of ['kakao', 'naver', 'google', 'apple']) {
      await go('signup');
      await page.locator(`[data-login=${provider}]`).click();
      await visible('home');
      assert.equal(await page.locator('#action-error').count(), 0);
      assert.deepEqual(await context.cookies(), []);
      assert.deepEqual(
        await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })),
        { local: {}, session: {} }
      );
    }
    const storageWorks = await page.evaluate(() => {
      try {
        localStorage.setItem('candle.tutorial.probe', '1');
        localStorage.removeItem('candle.tutorial.probe');
        return true;
      } catch {
        return false;
      }
    });
    const tutorial = page.locator('#tutorial-dialog');
    const tutorialOpen = () => tutorial.evaluate((node) => node.open);
    const waitForHomeRoute = async () => {
      await visible('home');
      await page.waitForFunction(() => document.title === 'Candle · 홈');
    };
    await go('signup');
    await page.locator('[data-login=kakao]').click();
    await waitForHomeRoute();
    assert.equal(await tutorialOpen(), true, 'first login shows the tutorial');
    assert.equal(await page.locator('#tutorial-dialog .tutorial-slide.active').count(), 1);
    assert.equal(await page.locator('#tutorial-next').innerText(), '다음');
    await page.locator('#tutorial-next').click();
    await page.locator('#tutorial-next').click();
    assert.equal(await page.locator('#tutorial-next').innerText(), '시작하기');
    assert.equal(await page.locator('.tutorial-slide.active').getAttribute('data-tutorial-slide'), '2');
    await page.locator('#tutorial-next').click();
    assert.equal(await tutorialOpen(), false, 'last step closes the tutorial');
    assert.equal(
      await page.evaluate(() => localStorage.getItem('candle.tutorial.seen')),
      storageWorks ? '1' : null
    );
    await go('settings');
    await page.locator('[data-tutorial-replay]').click();
    assert.equal(await tutorialOpen(), true, 'settings replays the tutorial');
    await page.locator('#tutorial-skip').click();
    assert.equal(await tutorialOpen(), false);
    if (storageWorks) {
      await go('signup');
      await page.locator('[data-login=kakao]').click();
      await waitForHomeRoute();
      assert.equal(await tutorialOpen(), false, 'tutorial is not shown twice');
      await page.evaluate(() => localStorage.clear());
    }
    await go('consent');
    assert.ok(await page.locator('#consent-submit').isDisabled());
    await page.locator('#agree-all').check();
    assert.equal(await page.locator('[data-agreement]:checked').count(), 3);
    assert.ok(await page.locator('#consent-submit').isEnabled());
    await page.locator('#privacy').uncheck();
    assert.ok(await page.locator('#agree-all').evaluate((node) => node.indeterminate));
    assert.ok(await page.locator('#consent-submit').isDisabled());
    await page.locator('#privacy').check();
    assert.ok(await page.locator('#agree-all').isChecked());
    await page.locator('#consent-submit').click();
    await visible('consent');
    await serverError();
    await page.locator('#consent [data-legal=privacy]').click();
    await visible('legal');
    assert.equal(await page.locator('#legal .heading').innerText(), '개인정보 처리방침 동의');
    await page.locator('#legal .back-button').click();
    await visible('consent');
    assert.ok(await page.locator('#agree-all').isChecked());

    await go('missions');
    await page.locator('#missions .bottom-nav [data-route=stock-select]').click();
    await visible('stock-select');
    assert.equal(await page.locator('#stock-select .nav-item.active').innerText(), '예측');
    assert.equal(await page.locator('#stock-select .back-button').count(), 0);
    await page.locator('[data-stock-code="035420"]').click();
    await visible('prediction');
    assert.equal(await page.locator('#prediction .heading').innerText(), 'NAVER');
    const watchlistToggle = page.locator('#prediction [data-watchlist-toggle]');
    assert.equal(await watchlistToggle.getAttribute('aria-pressed'), 'false');
    await watchlistToggle.click();
    assert.equal(await watchlistToggle.getAttribute('aria-pressed'), 'true');
    await page.locator('#prediction .back-button').click();
    await visible('stock-select');
    await page.locator('[data-market=watchlist]').click();
    assert.equal(await page.locator('#stock-list-title').innerText(), '관심종목');
    assert.equal(await page.locator('[data-stock-code]:visible').count(), 1);
    assert.equal(
      await page
        .locator('[data-stock-code="035420"]')
        .evaluate((row) => getComputedStyle(row).borderBottomWidth),
      '0px'
    );
    await page.locator('[data-stock-code="035420"]').click();
    await visible('prediction');
    await watchlistToggle.click();
    assert.equal(await watchlistToggle.getAttribute('aria-pressed'), 'false');
    await page.locator('#prediction .bottom-nav [data-route=stock-select]').click();
    await page.locator('[data-market=watchlist]').click();
    assert.equal(await page.locator('[data-stock-code]:visible').count(), 0);
    assert.match(await page.locator('#stock-empty').innerText(), /관심종목이 없습니다/);
    await go('home');
    await page.locator('#home .home-ad-slot').click();
    await visible('stock-select');

    const walletTab = () => page.locator('#wallet .wallet-tabs [aria-pressed=true]').innerText();
    await go('shop');
    await page.locator('#shop .points-card [data-wallet-tab]').click();
    await visible('wallet');
    assert.equal(await walletTab(), '사용');
    await page.locator('#wallet [data-wallet-tab=earn]').click();
    assert.equal(await walletTab(), '적립');
    await go('profile');
    await page.locator('#profile .menu-row[data-route=wallet]').click();
    await visible('wallet');
    assert.equal(await walletTab(), '전체');
    await page.goto(`${target.entryUrl}#history`);
    await visible('wallet');
    assert.equal(await walletTab(), '사용');

    await go('home');
    const initial = await serverFacts();
    assert.equal(await page.locator('#home .points-card .number').innerText(), '— P');
    assert.equal(await page.locator('#home .stock-card [data-direction]').count(), 2);
    assert.equal(await page.locator('#home .selected, #home [aria-pressed]').count(), 0);
    await page.locator('#home [data-direction=down]').click();
    await visible('prediction');
    assert.equal(
      await page.locator('#prediction [data-direction=down]').getAttribute('aria-pressed'),
      'true'
    );
    await page.locator('#prediction [data-stock-picker]').click();
    await visible('stock-select');
    const search = page.locator('#stock-search-input');
    await search.fill('naver');
    assert.equal(await page.locator('[data-stock-code]:visible').count(), 1);
    assert.equal(await page.locator('[data-stock-code]:visible').getAttribute('data-stock-code'), '035420');
    await search.fill('000660');
    await page.locator('[data-stock-code="000660"]').click();
    await visible('prediction');
    assert.equal(await page.locator('#prediction .heading').innerText(), 'SK하이닉스');
    await page.locator('#prediction [data-route=confirm]').click();
    await visible('confirm');
    assert.equal(await page.locator('#confirm .stock-name').innerText(), 'SK하이닉스');
    assert.match(await page.locator('#confirm .sheet-title').innerText(), /하락/);
    await page.locator('#submit-prediction').click();
    await visible('confirm');
    await serverError();
    assert.deepEqual(await serverFacts(), initial);
    await page.goBack();
    await visible('prediction');
    assert.equal(
      await page.locator('#prediction [data-direction=down]').getAttribute('aria-pressed'),
      'true'
    );
    await page.locator('#prediction [data-stock-picker]').click();
    await page.locator('[data-market="코스닥"]').click();
    assert.equal(await page.locator('[data-stock-code]:visible').count(), 1);
    assert.equal(await page.locator('#stock-result-count').innerText(), '1개');
    await search.fill('NAVER');
    assert.ok(await page.locator('#stock-empty').isVisible());
    await search.fill('');
    await page.locator('[data-market=all]').click();
    assert.equal(await page.locator('[data-stock-code]:visible').count(), 7);
    await search.fill('없는종목');
    assert.ok(await page.locator('#stock-empty').isVisible());

    await go('shop');
    await page.locator('[data-product=naverpay-50000]').click();
    await visible('exchange');
    assert.match(await page.locator('#exchange .product-copy').innerText(), /50,000/);
    await page.locator('#exchange [data-route=payout]').click();
    await visible('payout');
    assert.match(await page.locator('.payout-amount').innerText(), /50,000/);
    await page.locator('#phone').fill('123');
    await page.locator('#name').fill('A');
    await page.locator('#payout-agree').check();
    assert.ok(await page.locator('#payout-submit').isDisabled());
    assert.equal(await page.locator('#phone').evaluate((node) => node.checkValidity()), false);
    await page.locator('#phone').fill('010-1234-5678');
    await page.locator('#name').fill('Test Recipient');
    assert.ok(await page.locator('#payout-submit').isEnabled());
    await page.locator('#payout [data-legal=reward]').click();
    await visible('legal');
    await page.locator('#legal .back-button').click();
    await visible('payout');
    assert.equal(await page.locator('#phone').inputValue(), '010-1234-5678');
    await page.locator('#payout-submit').click();
    await visible('payout');
    await serverError('#payout-error');
    assert.deepEqual(await serverFacts(), initial);
    await page.locator('#name').press('Enter');
    await serverError('#payout-error');
    await visible('payout');
    assert.equal(new URL(page.url()).search, '');
    await page.goto(`${target.entryUrl}#home`);
    assert.equal(await page.locator('#phone').inputValue(), '');

    await go('challenge-reward');
    await page.locator('#reward-recipient').fill('test_account');
    await page.locator('#reward-confirm').fill('other_account');
    await page.locator('#submit-challenge-reward').click();
    assert.match(await page.locator('#reward-form-error').innerText(), /일치하지/);
    await page.locator('#reward-confirm').fill('test_account');
    await page.locator('#submit-challenge-reward').click();
    assert.match(await page.locator('#reward-form-error').innerText(), /필수 동의/);
    for (const input of await page.locator('#challenge-reward-form input[type=checkbox]').all())
      await input.check();
    await page.locator('#submit-challenge-reward').click();
    await serverError('#reward-form-error');
    await visible('challenge-reward');
    assert.deepEqual(await serverFacts(), initial);

    await go('home');
    await page.locator('#home [data-reward-ad]').click();
    assert.ok(await page.locator('#reward-ad-dialog').isVisible());
    await page.locator('#cancel-reward-ad').click();
    assert.ok(!(await page.locator('#reward-ad-dialog').isVisible()));
    await page.locator('#home [data-reward-ad]').click();
    await page.locator('#start-reward-ad').click();
    await serverError();
    await go('ad');
    await page.locator('#verify-ad').click();
    await serverError();
    await go('missions');
    await page.locator('#attendance').click();
    await serverError();
    await go('result');
    await page.locator('#result [data-claim]').click();
    await serverError();
    await go('settings');
    await page.locator('#logout').click();
    await serverError();
    assert.deepEqual(await serverFacts(), initial);
    assert.deepEqual(await context.cookies(), []);
    assert.deepEqual(
      await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } })),
      { local: {}, session: {} }
    );

    const structure = await page.evaluate(() => {
      const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
      return {
        duplicates: ids.filter((id, i) => ids.indexOf(id) !== i),
        invalidReferences: [
          ...document.querySelectorAll('[for], [aria-describedby], [aria-labelledby]'),
        ].flatMap((node) =>
          ['for', 'aria-describedby', 'aria-labelledby'].flatMap((attr) =>
            (node.getAttribute(attr) || '')
              .split(/\s+/)
              .filter(Boolean)
              .filter((id) => !document.getElementById(id))
          )
        ),
      };
    });
    assert.deepEqual(structure, { duplicates: [], invalidReferences: [] });
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 320, height: 568 },
      { width: 430, height: 932 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      for (const route of routes) {
        await go(route);
        const layout = await page.locator(`#${route}`).evaluate((node) => {
          const content =
            node.querySelector(
              '.content, .signup-content, .consent-main, .payout-content, .stock-select-content'
            ) || node;
          return {
            width: content.clientWidth,
            scrollWidth: content.scrollWidth,
            brokenImages: [...node.querySelectorAll('img')]
              .filter((img) => !img.complete || img.naturalWidth === 0)
              .map((img) => img.src),
            statusHeight: node.querySelector('.status-bar')?.getBoundingClientRect().height,
            header: (() => {
              const header = node.querySelector('.app-header, .transaction-header');
              if (!header) return null;
              const rect = header.getBoundingClientRect();
              return { height: rect.height, bottom: rect.bottom };
            })(),
            contentTop: content.getBoundingClientRect().top,
            introMargin:
              node.querySelector('.signup-intro') &&
              parseFloat(getComputedStyle(node.querySelector('.signup-intro')).marginTop),
          };
        });
        assert.ok(
          layout.scrollWidth <= layout.width + 1,
          `${route} overflows at ${viewport.width}: ${JSON.stringify(layout)}`
        );
        assert.deepEqual(layout.brokenImages, []);
        if (layout.statusHeight !== undefined)
          assert.equal(layout.statusHeight, 0, 'browser viewport must not reserve a fake status bar');
        if (layout.header)
          assert.ok(
            layout.header.height >= 44 && layout.header.height <= 56,
            `${route}: compact header keeps usable tap targets`
          );
        if (route === 'home' || route === 'stock-select') {
          const gap = layout.contentTop - layout.header.bottom;
          assert.ok(
            gap >= 7.9 && gap <= 16.1,
            `${route}: content follows the header without excess space or overlap`
          );
        }
        if (route === 'signup')
          assert.ok(
            layout.introMargin >= 24 && layout.introMargin <= 48,
            'login title spacing adapts within compact bounds'
          );
        layoutChecks++;
      }
    }
    await go('home');
    await page.locator('.phone').evaluate((node) => node.style.setProperty('--safe-area-top', '59px'));
    for (const route of ['home', 'stock-select', 'payout', 'consent']) {
      await go(route);
      assert.equal(
        await page.locator(`#${route} .status-bar`).evaluate((node) => node.getBoundingClientRect().height),
        59
      );
      const header = page.locator(
        `#${route} .app-header, #${route} .transaction-header, #${route} .consent-header`
      );
      assert.equal(
        await header.evaluate((node) => node.getBoundingClientRect().top),
        59,
        'safe area is applied once above the header'
      );
    }
    await page.locator('.phone').evaluate((node) => node.style.removeProperty('--safe-area-top'));
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ['home', 'consent', 'prediction', 'payout']) {
      await go(route);
      await page.reload();
      await page.screenshot({ path: path.join(root, `test-results/input-${index}-${route}.png`) });
    }
    await page.goto(`${target.entryUrl}#stock-select`);
    await page.locator('#stock-search-input').fill('NAVER');
    assert.equal(await page.locator('[data-stock-code]:visible').count(), 1);
    assert.deepEqual(serverRequests, [], 'no fake authentication or business API requests');
    assert.deepEqual(resourceRequests, [], 'no external styles, scripts, fonts, images or other files');
    const embedded = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        externalTags: document.querySelectorAll('script[src], link[rel="stylesheet"], link[rel="preconnect"]')
          .length,
        nonEmbeddedImages: [...document.images].filter(
          (img) => !img.src.startsWith('data:') || img.naturalWidth === 0
        ).length,
        fonts: [...document.fonts].map((font) => ({
          family: font.family,
          weight: font.weight,
          status: font.status,
        })),
      };
    });
    assert.equal(embedded.externalTags, 0);
    assert.equal(embedded.nonEmbeddedImages, 0);
    assert.equal(embedded.fonts.length, 4);
    assert.ok(embedded.fonts.every((font) => font.status === 'loaded'));
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    `PASS: ${layoutChecks} screen/layout checks; all controls and validation work in source/dist and an isolated offline HTML file; no external resources, business requests, storage or fabricated server state.`
  );
} finally {
  await browser?.close();
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
}
