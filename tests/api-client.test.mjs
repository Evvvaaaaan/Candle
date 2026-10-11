import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/js/api-client.mjs';
import {
  resolveConfig,
  normalizeStocks,
  validateSession,
  validateSnapshot,
} from '../src/js/candle-service.mjs';
import { demoSnapshot } from '../src/js/demo-service.mjs';

test('remote hosts cannot enable demo using config or URL', () => {
  assert.equal(resolveConfig({ mode: 'demo' }, 'candle.example', '?mode=demo').mode, 'api');
  assert.equal(resolveConfig({}, '127.0.0.1', '').mode, 'demo');
  assert.equal(resolveConfig({}, '127.0.0.1', '?mode=api').mode, 'api');
});
test('existing Spring StockPriceDto is normalized without invented prices', () => {
  assert.deepEqual(
    normalizeStocks([{ ticker: '005930', name: '삼성전자', currentPrice: '72400', changeRate: '-1.4' }])[0],
    { code: '005930', name: '삼성전자', market: '국내 주식', price: '72,400원', change: '-1.4%' }
  );
  assert.throws(
    () =>
      normalizeStocks([{ ticker: '005930', name: '삼성전자', currentPrice: 'not-a-price', changeRate: '1' }]),
    /INVALID_RESPONSE/
  );
});
test('malformed contract data is rejected before rendering', () => {
  assert.throws(() => validateSession({ providers: ['unknown'], user: null }), /INVALID_RESPONSE/);
  const data = demoSnapshot();
  data.wallet.balance = -1;
  assert.throws(() => validateSnapshot(data), /INVALID_RESPONSE/);
  assert.ok(validateSnapshot(demoSnapshot()));
});
test('cookies, CSRF and idempotency are sent and response envelope unwrapped', async () => {
  let captured;
  const client = createApiClient({
    baseUrl: '/api/v1/',
    fetcher: async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({ success: true, data: { id: '1' } }));
    },
  });
  client.setCsrfToken('csrf');
  assert.deepEqual(
    await client.request('/predictions', { method: 'POST', body: { direction: 'up' }, key: 'attempt-1' }),
    { id: '1' }
  );
  assert.equal(captured.url, '/api/v1/predictions');
  assert.equal(captured.init.credentials, 'include');
  assert.equal(captured.init.headers['X-CSRF-Token'], 'csrf');
  assert.equal(captured.init.headers['Idempotency-Key'], 'attempt-1');
  assert.equal(captured.init.cache, 'no-store');
});
test('mutation without session token does not call fetch', async () => {
  const client = createApiClient({ fetcher: () => assert.fail('must not send') });
  await assert.rejects(client.request('/reward-claims', { method: 'POST' }), /SESSION_EXPIRED/);
});
test('empty successful responses and malformed JSON are handled', async () => {
  assert.equal(
    await createApiClient({ fetcher: async () => new Response(null, { status: 204 }) }).request('/empty'),
    null
  );
  await assert.rejects(
    createApiClient({ fetcher: async () => new Response('<html>') }).request('/broken'),
    /INVALID_RESPONSE/
  );
});
test('authentication and domain errors preserve stable codes without exposing messages', async () => {
  await assert.rejects(
    createApiClient({ fetcher: async () => new Response('{}', { status: 401 }) }).request('/me'),
    /SESSION_EXPIRED/
  );
  await assert.rejects(
    createApiClient({
      fetcher: async () =>
        new Response(JSON.stringify({ error: { code: 'INSUFFICIENT_POINTS', message: 'private' } }), {
          status: 409,
        }),
    }).request('/claim'),
    /INSUFFICIENT_POINTS/
  );
});
test('network failures and timeout reject once without automatic mutation retry', async () => {
  let calls = 0;
  const client = createApiClient({
    fetcher: async () => {
      calls++;
      throw Error('offline');
    },
  });
  await assert.rejects(client.request('/x'), /NETWORK_ERROR/);
  assert.equal(calls, 1);
  const timeout = createApiClient({
    timeoutMs: 5,
    fetcher: (_url, { signal }) =>
      new Promise((_, reject) => signal.addEventListener('abort', () => reject(Error('abort')))),
  });
  await assert.rejects(timeout.request('/slow'), /TIMEOUT/);
});
