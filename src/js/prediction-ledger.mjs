export const AD_LIMIT = 10;
export const STORAGE_KEY = 'candle.core-flow.predictions.v1';

export function dayKey(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function emptyLedger(day = dayKey()) {
  return { day, adCarry: 0, adRewards: [], predictions: [] };
}

export function restoreLedger(raw, day = dayKey()) {
  if (
    !raw ||
    !/^\d{4}-\d{2}-\d{2}$/.test(raw.day) ||
    !Array.isArray(raw.adRewards) ||
    !Array.isArray(raw.predictions)
  )
    return emptyLedger(day);
  const adCarry = Number.isSafeInteger(raw.adCarry) && raw.adCarry >= 0 ? raw.adCarry : 0;
  const adRewards = [...new Set(raw.adRewards.filter((id) => typeof id === 'string' && id))].slice(
    0,
    AD_LIMIT
  );
  const predictions = [];
  for (const record of raw.predictions) {
    if (
      !record ||
      typeof record.id !== 'string' ||
      !record.id ||
      !/^\d{6}$/.test(record.stockCode) ||
      !['up', 'down'].includes(record.direction)
    )
      continue;
    if (predictions.some((item) => item.id === record.id || item.stockCode === record.stockCode)) continue;
    if (record.ticket === 'free' && !predictions.some((item) => item.ticket === 'free'))
      predictions.push({
        id: record.id,
        stockCode: record.stockCode,
        direction: record.direction,
        ticket: 'free',
      });
    if (
      record.ticket === 'ad' &&
      predictions.filter((item) => item.ticket === 'ad').length < adCarry + adRewards.length
    )
      predictions.push({
        id: record.id,
        stockCode: record.stockCode,
        direction: record.direction,
        ticket: 'ad',
      });
  }
  const ledger = { day: raw.day, adCarry, adRewards, predictions };
  return raw.day === day ? ledger : { ...emptyLedger(day), adCarry: ticketBalance(ledger).ad };
}

export function ticketBalance(ledger) {
  const free = ledger.predictions.some((record) => record.ticket === 'free') ? 0 : 1;
  const ad =
    ledger.adCarry +
    ledger.adRewards.length -
    ledger.predictions.filter((record) => record.ticket === 'ad').length;
  return {
    free,
    ad,
    total: free + ad,
    adCount: ledger.adRewards.length,
    adRemaining: AD_LIMIT - ledger.adRewards.length,
  };
}

export function submitPrediction(ledger, attempt) {
  if (
    !attempt ||
    typeof attempt.id !== 'string' ||
    !attempt.id ||
    !/^\d{6}$/.test(attempt.stockCode) ||
    !['up', 'down'].includes(attempt.direction)
  )
    return { status: 'invalid', ledger };
  const existing = ledger.predictions.find((record) => record.id === attempt.id);
  if (existing) return { status: 'duplicate', ledger, record: existing };
  const stockPrediction = ledger.predictions.find((record) => record.stockCode === attempt.stockCode);
  if (stockPrediction) return { status: 'stock-used', ledger, record: stockPrediction };
  const balance = ticketBalance(ledger);
  if (!balance.total) return { status: 'empty', ledger };
  const record = {
    id: attempt.id,
    stockCode: attempt.stockCode,
    direction: attempt.direction,
    ticket: balance.free ? 'free' : 'ad',
  };
  return { status: 'accepted', ledger: { ...ledger, predictions: [...ledger.predictions, record] }, record };
}

export function rewardAd(ledger, session) {
  if (!session || typeof session.id !== 'string' || !session.id || session.day !== ledger.day)
    return { status: 'invalid', ledger };
  if (ledger.adRewards.includes(session.id)) return { status: 'duplicate', ledger };
  if (ledger.adRewards.length >= AD_LIMIT) return { status: 'limit', ledger };
  return { status: 'awarded', ledger: { ...ledger, adRewards: [...ledger.adRewards, session.id] } };
}
