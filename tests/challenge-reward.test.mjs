import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChallengeReward, validRecipient } from '../src/js/challenge-reward.mjs';
import { demoChallengeReward, createDemoService, demoLegal } from '../src/js/demo-service.mjs';

test('prize claims require complete server eligibility, payout policy and versioned consent', () => {
  const base = demoChallengeReward();
  assert.equal(validateChallengeReward(base), base);
  for (const patch of [
    { status: 'UNKNOWN' },
    { amount: 1 },
    { payoutPoints: 0 },
    { payoutPoints: 1000001 },
    { awardId: null },
    { claimDeadline: null },
    { claimDeadline: 'bad' },
    { taxNotice: '' },
    { agreements: [] },
    { agreements: base.agreements.slice(0, 1) },
    { status: 'PAID', claimId: null },
    { method: 'BANK' },
  ])
    assert.throws(() => validateChallengeReward({ ...base, ...patch }), /INVALID_RESPONSE/);
  assert.ok(
    validateChallengeReward({ ...base, method: 'COUPON_SMS', agreements: base.agreements.slice(0, 1) })
  );
  assert.ok(
    validateChallengeReward({
      ...base,
      status: 'NOT_ELIGIBLE',
      awardId: null,
      claimDeadline: null,
      agreements: [],
    })
  );
});

test('recipient input distinguishes coupon phone from a Naver login identifier', () => {
  assert.ok(validRecipient('COUPON_SMS', '010-1234-5678'));
  assert.ok(!validRecipient('COUPON_SMS', '010123'));
  assert.ok(validRecipient('NAVER_ID', 'candle_test'));
  assert.ok(!validRecipient('NAVER_ID', ' '));
  assert.ok(!validRecipient('NAVER_ID', '<script>'));
});

test('prize submission is separate from wallet, deduplicates and persists no recipient', async () => {
  const values = new Map();
  const storage = { getItem: (k) => values.get(k) || null, setItem: (k, v) => values.set(k, v) };
  const service = createDemoService(storage);
  await service.login();
  await service.mutate(
    'consent',
    { agreements: demoLegal.items.map((a) => ({ ...a, accepted: true })) },
    'consent'
  );
  const reward = await service.challengeReward();
  const body = {
    awardId: reward.awardId,
    method: reward.method,
    recipient: { naverId: 'private_test_user' },
    npayTermsConfirmed: true,
    agreements: reward.agreements.map((a) => ({ id: a.id, version: a.version, accepted: true })),
  };
  await assert.rejects(
    service.mutate('challengeReward', { ...body, awardId: 'forged' }, 'invalid'),
    /VALIDATION_ERROR/
  );
  await assert.rejects(
    service.mutate('challengeReward', { ...body, agreements: [] }, 'missing'),
    /AGREEMENT_REQUIRED/
  );
  await assert.rejects(
    service.mutate(
      'challengeReward',
      { ...body, agreements: body.agreements.map((a) => ({ ...a, version: 'old' })) },
      'old'
    ),
    /AGREEMENT_REQUIRED/
  );
  const before = await service.load();
  assert.deepEqual(await service.mutate('challengeReward', body, 'prize1'), { id: 'prize1' });
  assert.deepEqual(await service.mutate('challengeReward', body, 'prize1'), { id: 'prize1' });
  await assert.rejects(service.mutate('challengeReward', body, 'prize2'), /ALREADY_CLAIMED/);
  const after = await service.load();
  assert.deepEqual(after.wallet, before.wallet);
  assert.deepEqual(after.claims, before.claims);
  assert.equal((await createDemoService(storage).challengeReward()).status, 'REQUESTED');
  assert.ok(![...values.values()].join('').includes('private_test_user'));
});
