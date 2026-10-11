import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoService, demoLegal } from '../src/js/demo-service.mjs';
const setup = () => {
  const values = new Map();
  const storage = { getItem: (k) => values.get(k) || null, setItem: (k, v) => values.set(k, v) };
  return { service: createDemoService(storage), values, storage };
};
test('attendance and result claims update wallet once and survive reload', async () => {
  const { service, storage } = setup();
  await service.mutate('attendance', {}, 'attendance-1');
  await service.mutate('attendance', {}, 'attendance-1');
  await service.mutate('claim', { predictionId: 'demo-result' }, 'claim-1');
  const reloaded = await createDemoService(storage).load();
  assert.equal(reloaded.wallet.balance, 12825);
  assert.equal(reloaded.wallet.items.length, 2);
  assert.ok(reloaded.missions.attended);
  await assert.rejects(
    service.mutate('claim', { predictionId: 'demo-result' }, 'claim-2'),
    /ALREADY_CLAIMED/
  );
});
test('reward request debits wallet, creates history, deduplicates and never stores recipient', async () => {
  const { service, values } = setup();
  const body = {
    rewardId: 'naverpay-5000',
    recipient: { name: '테스트고객', phone: '01012345678' },
    agreementVersion: 'demo-reward-1',
  };
  await service.mutate('reward', body, 'reward-1');
  await service.mutate('reward', body, 'reward-1');
  const data = await service.load();
  assert.equal(data.wallet.balance, 7800);
  assert.equal(data.claims.items.length, 1);
  const saved = [...values.values()].join('');
  assert.ok(!saved.includes(body.recipient.name));
  assert.ok(!saved.includes(body.recipient.phone));
  await assert.rejects(
    service.mutate('reward', { ...body, rewardId: 'naverpay-100000' }, 'reward-2'),
    /INSUFFICIENT_POINTS/
  );
});
test('prediction retries do not spend a second ticket; no local timer can award a real ad', async () => {
  const { service } = setup();
  const body = { stockCode: '005930', direction: 'down' };
  await service.mutate('prediction', body, 'p1');
  await service.mutate('prediction', body, 'p1');
  assert.equal((await service.load()).tickets.free, 0);
  await service.mutate('adStart', {}, 'ad1');
  await assert.rejects(service.mutate('adComplete', { sessionId: 'ad1' }, 'ad-complete'), /AD_NOT_VERIFIED/);
});
test('versioned consent is required and logout clears the demo session', async () => {
  const { service } = setup();
  await service.login();
  assert.ok((await service.session()).user.consentRequired);
  await assert.rejects(service.mutate('consent', { agreements: [] }, 'c1'), /AGREEMENT_REQUIRED/);
  await service.mutate(
    'consent',
    { agreements: demoLegal.items.map((a) => ({ id: a.id, version: a.version, accepted: true })) },
    'c2'
  );
  assert.equal((await service.session()).user.consentRequired, false);
  await service.mutate('logout', {}, 'logout');
  assert.equal((await service.session()).user, null);
});
test('blocked browser storage causes a visible error, never a success', async () => {
  const service = createDemoService({
    getItem: () => null,
    setItem: () => {
      throw Error('blocked');
    },
  });
  await assert.rejects(service.mutate('attendance', {}, 'a1'), /STORAGE_UNAVAILABLE/);
});
