import { createApiClient, ApiError } from './api-client.mjs';
import { validateChallengeReward } from './challenge-reward.mjs';

export const mutations = {
  consent: ['POST', '/legal/agreements'],
  prediction: ['POST', '/predictions'],
  attendance: ['POST', '/missions/attendance'],
  claim: ['POST', '/predictions/claim'],
  reward: ['POST', '/reward-claims'],
  challengeReward: ['POST', '/challenges/ten-wins/claims'],
  adStart: ['POST', '/ads/sessions'],
  adComplete: ['POST', '/ads/sessions/verify'],
  logout: ['POST', '/auth/logout'],
};

export function resolveConfig(raw = {}, hostname = location.hostname, search = location.search) {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  const apiPreview = local && new URLSearchParams(search).get('mode') === 'api';
  return {
    mode: local && raw.mode !== 'api' && !apiPreview ? 'demo' : 'api',
    baseUrl: raw.apiBaseUrl || '/api/v1',
    timeoutMs: raw.requestTimeoutMs || 12000,
  };
}

const requireValue = (condition) => {
  if (!condition) throw new ApiError('INVALID_RESPONSE');
};
const integer = (value) => Number.isSafeInteger(value) && value >= 0;
export function validateSession(session) {
  requireValue(
    session &&
      Array.isArray(session.providers) &&
      session.providers.every((p) => ['kakao', 'naver', 'google', 'apple'].includes(p))
  );
  requireValue(
    session.user === null ||
      (typeof session.user?.id === 'string' &&
        typeof session.user?.nickname === 'string' &&
        typeof session.user?.consentRequired === 'boolean')
  );
  requireValue(!session.user || (typeof session.csrfToken === 'string' && session.csrfToken.length > 0));
  return session;
}

export function validateLegal(legal) {
  requireValue(Array.isArray(legal?.items) && legal.items.length > 0);
  requireValue(
    legal.items.every(
      (a) =>
        typeof a.id === 'string' &&
        /^[a-z][a-z0-9-]*$/.test(a.id) &&
        typeof a.title === 'string' &&
        typeof a.version === 'string' &&
        typeof a.body === 'string' &&
        typeof a.required === 'boolean'
    )
  );
  requireValue(
    new Set(legal.items.map((a) => a.id)).size === legal.items.length && legal.items.some((a) => a.required)
  );
  return legal;
}

export function normalizeStocks(rows) {
  requireValue(Array.isArray(rows));
  return rows.map((row) => {
    const price = Number(row.currentPrice),
      change = Number(row.changeRate);
    requireValue(
      /^\d{6}$/.test(row.ticker) &&
        typeof row.name === 'string' &&
        Number.isFinite(price) &&
        price > 0 &&
        Number.isFinite(change)
    );
    return {
      code: row.ticker,
      name: row.name,
      market: row.market || '국내 주식',
      price: `${price.toLocaleString('ko-KR')}원`,
      change: `${change >= 0 ? '+' : ''}${change}%`,
    };
  });
}

export function validateSnapshot(data) {
  requireValue(data && Array.isArray(data.stocks));
  for (const kind of ['predictions', 'wallet', 'claims'])
    requireValue(data[kind]?.nextCursor === null || typeof data[kind]?.nextCursor === 'string');
  requireValue(integer(data.wallet?.balance) && Array.isArray(data.wallet?.items));
  requireValue(
    data.wallet.items.every(
      (x) =>
        typeof x.id === 'string' &&
        typeof x.title === 'string' &&
        Number.isSafeInteger(x.amount) &&
        typeof x.createdAt === 'string' &&
        (x.claimId === undefined || typeof x.claimId === 'string')
    )
  );
  requireValue(
    ['free', 'ad', 'adCount', 'adLimit'].every((k) => integer(data.tickets?.[k])) &&
      data.tickets.adCount <= data.tickets.adLimit
  );
  requireValue(
    ['OPEN', 'CLOSED', 'SCHEDULED'].includes(data.predictions?.status) &&
      Number.isFinite(Date.parse(data.predictions.serverTime)) &&
      Number.isFinite(Date.parse(data.predictions.closesAt)) &&
      integer(data.predictions.streak) &&
      integer(data.predictions.bestStreak)
  );
  requireValue(
    Array.isArray(data.predictions.items) &&
      data.predictions.items.every(
        (p) =>
          typeof p.id === 'string' &&
          /^\d{6}$/.test(p.stockCode) &&
          typeof p.stockName === 'string' &&
          ['up', 'down'].includes(p.direction) &&
          ['free', 'ad'].includes(p.ticket) &&
          ['PENDING', 'WON', 'LOST', 'VOID'].includes(p.status) &&
          typeof p.today === 'boolean' &&
          typeof p.claimed === 'boolean' &&
          integer(p.points)
      )
  );
  requireValue(
    typeof data.missions?.attended === 'boolean' &&
      integer(data.missions?.streak) &&
      Array.isArray(data.missions?.items)
  );
  requireValue(
    data.missions.items.every(
      (m) => typeof m.title === 'string' && integer(m.points) && typeof m.complete === 'boolean'
    )
  );
  requireValue(
    Array.isArray(data.catalog?.items) &&
      data.catalog.items.every(
        (p) =>
          typeof p.id === 'string' &&
          typeof p.title === 'string' &&
          integer(p.points) &&
          p.points > 0 &&
          integer(p.amount) &&
          typeof p.available === 'boolean' &&
          typeof p.deliveryNotice === 'string' &&
          typeof p.agreementVersion === 'string' &&
          typeof p.agreementBody === 'string'
      )
  );
  requireValue(
    Array.isArray(data.claims?.items) &&
      data.claims.items.every(
        (c) =>
          typeof c.id === 'string' &&
          typeof c.title === 'string' &&
          integer(c.points) &&
          ['REQUESTED', 'PROCESSING', 'PAID', 'FAILED', 'REJECTED', 'CANCELED'].includes(c.status) &&
          typeof c.createdAt === 'string'
      )
  );
  return data;
}

export function createCandleService(config) {
  const api = createApiClient(config);
  return {
    mode: 'api',
    async session() {
      const session = validateSession(await api.request('/auth/session'));
      api.setCsrfToken(session.csrfToken);
      return session;
    },
    async legal() {
      return validateLegal(await api.request('/legal/agreements/current'));
    },
    async challengeReward() {
      return validateChallengeReward(await api.request('/challenges/ten-wins/reward'));
    },
    async load() {
      const [stocks, tickets, predictions, wallet, missions, catalog, claims] = await Promise.all([
        api.request('/stocks/top-list'),
        api.request('/prediction-tickets'),
        api.request('/predictions/today'),
        api.request('/wallet'),
        api.request('/missions'),
        api.request('/rewards/catalog'),
        api.request('/reward-claims'),
      ]);
      return validateSnapshot({
        stocks: normalizeStocks(stocks),
        tickets,
        predictions,
        wallet,
        missions,
        catalog,
        claims,
      });
    },
    async page(kind, cursor) {
      const paths = {
        predictions: '/predictions/history',
        wallet: '/wallet/transactions',
        claims: '/reward-claims',
      };
      return api.request(`${paths[kind]}?cursor=${encodeURIComponent(cursor)}&limit=20`);
    },
    loginUrl(provider) {
      const url = new URL(config.baseUrl.replace(/\/$/, '') + `/auth/${provider}/start`, location.href);
      const callback = new URL('index.html', location.href);
      url.searchParams.set('returnTo', callback.href);
      return url.href;
    },
    async mutate(action, body, key) {
      const [method, path] = mutations[action];
      return api.request(path, { method, body, key });
    },
  };
}
