import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AD_LIMIT,
  dayKey,
  emptyLedger,
  restoreLedger,
  ticketBalance,
  submitPrediction,
  rewardAd,
} from '../src/js/prediction-ledger.mjs';

const day = '2026-09-30';
const attempt = (id, stockCode = '005930') => ({ id, stockCode, direction: 'down' });
const adSession = (id) => ({ id, day });

test('Korean calendar day changes at midnight in Seoul', () => {
  assert.equal(dayKey(new Date('2026-09-30T14:59:59Z')), day);
  assert.equal(dayKey(new Date('2026-09-30T15:00:00Z')), '2026-10-01');
});

test('one daily free ticket is available before watching an ad', () => {
  assert.deepEqual(ticketBalance(emptyLedger(day)), {
    free: 1,
    ad: 0,
    total: 1,
    adCount: 0,
    adRemaining: AD_LIMIT,
  });
});

test('submission consumes one free ticket and keeps an immutable record', () => {
  const initial = emptyLedger(day);
  const result = submitPrediction(initial, attempt('first'));
  assert.equal(result.status, 'accepted');
  assert.equal(result.record.ticket, 'free');
  assert.equal(result.record.direction, 'down');
  assert.equal(ticketBalance(result.ledger).total, 0);
  assert.equal(initial.predictions.length, 0);
});

test('a replayed submission id cannot spend another ticket', () => {
  let ledger = rewardAd(emptyLedger(day), adSession('ad-one')).ledger;
  ledger = submitPrediction(ledger, attempt('first')).ledger;
  const repeated = submitPrediction(ledger, attempt('first'));
  assert.equal(repeated.status, 'duplicate');
  assert.equal(repeated.ledger, ledger);
  assert.equal(ticketBalance(ledger).ad, 1);
});

test('a new submission without tickets is rejected', () => {
  const ledger = submitPrediction(emptyLedger(day), attempt('first')).ledger;
  const result = submitPrediction(ledger, attempt('second', '035420'));
  assert.equal(result.status, 'empty');
  assert.equal(result.ledger.predictions.length, 1);
});

test('the same stock cannot be predicted again, even with a different direction and a spare ticket', () => {
  let ledger = rewardAd(emptyLedger(day), adSession('ad-one')).ledger;
  ledger = submitPrediction(ledger, attempt('first')).ledger;
  const result = submitPrediction(ledger, { ...attempt('second'), direction: 'up' });
  assert.equal(result.status, 'stock-used');
  assert.equal(result.ledger, ledger);
  assert.equal(ticketBalance(result.ledger).ad, 1);
});

test('free tickets are used before ad tickets, then one ad ticket is consumed', () => {
  let ledger = rewardAd(emptyLedger(day), adSession('ad-one')).ledger;
  const free = submitPrediction(ledger, attempt('first'));
  assert.equal(free.record.ticket, 'free');
  assert.deepEqual(ticketBalance(free.ledger), {
    free: 0,
    ad: 1,
    total: 1,
    adCount: 1,
    adRemaining: AD_LIMIT - 1,
  });
  const ad = submitPrediction(free.ledger, attempt('second', '035420'));
  assert.equal(ad.record.ticket, 'ad');
  assert.equal(ticketBalance(ad.ledger).total, 0);
});

test('an ad completion is rewarded once', () => {
  const first = rewardAd(emptyLedger(day), adSession('ad-one'));
  const repeated = rewardAd(first.ledger, adSession('ad-one'));
  assert.equal(repeated.status, 'duplicate');
  assert.equal(repeated.ledger, first.ledger);
  assert.equal(ticketBalance(repeated.ledger).ad, 1);
});

test('ad completion cannot exceed the daily limit even after tickets are spent', () => {
  let ledger = emptyLedger(day);
  for (let i = 0; i < AD_LIMIT; i++) ledger = rewardAd(ledger, adSession(`ad-${i}`)).ledger;
  ledger = submitPrediction(ledger, attempt('free')).ledger;
  ledger = submitPrediction(ledger, attempt('paid', '035420')).ledger;
  const result = rewardAd(ledger, adSession('over-limit'));
  assert.equal(result.status, 'limit');
  assert.equal(ticketBalance(result.ledger).adCount, AD_LIMIT);
});

test('restoring saved state does not grant another free ticket', () => {
  const ledger = submitPrediction(emptyLedger(day), attempt('first')).ledger;
  assert.deepEqual(restoreLedger(JSON.parse(JSON.stringify(ledger)), day), ledger);
  assert.equal(ticketBalance(restoreLedger(ledger, day)).free, 0);
});

test('a new day resets daily limits without discarding unused ad tickets', () => {
  const ledger = rewardAd(
    submitPrediction(emptyLedger(day), attempt('first')).ledger,
    adSession('ad-one')
  ).ledger;
  assert.deepEqual(restoreLedger(ledger, '2026-10-01'), { ...emptyLedger('2026-10-01'), adCarry: 1 });
  assert.equal(rewardAd(emptyLedger('2026-10-01'), adSession('old-ad')).status, 'invalid');
});

test('invalid stored data and invalid submissions do not corrupt balances', () => {
  assert.deepEqual(restoreLedger({ day, predictions: null }, day), emptyLedger(day));
  const ledger = restoreLedger(
    {
      day,
      adRewards: ['same', 'same'],
      predictions: [
        null,
        { ...attempt('first'), ticket: 'free' },
        { ...attempt('first'), ticket: 'free' },
        { ...attempt('second'), ticket: 'free' },
      ],
    },
    day
  );
  assert.equal(ledger.adRewards.length, 1);
  assert.equal(ledger.predictions.length, 1);
  assert.equal(
    submitPrediction(ledger, { id: 'invalid', stockCode: '<script>', direction: 'up' }).status,
    'invalid'
  );
});
