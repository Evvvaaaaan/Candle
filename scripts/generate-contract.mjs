import { writeFile } from 'node:fs/promises';
import { demoSnapshot, demoLegal } from '../src/js/demo-service.mjs';
const text = { type: 'string' },
  bool = { type: 'boolean' },
  count = { type: 'integer', minimum: 0 };
const obj = (properties, required = Object.keys(properties)) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
});
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const array = (items) => ({ type: 'array', items });
const cursor = { type: ['string', 'null'] };
const paged = (item) => obj({ items: array(item), nextCursor: cursor });
const schemas = {
  Error: obj({
    success: { const: false },
    error: obj({ code: text, message: text, requestId: text }, ['code']),
  }),
  User: obj({ id: text, nickname: text, consentRequired: bool }),
  Session: obj({
    user: { oneOf: [ref('User'), { type: 'null' }] },
    providers: array({ enum: ['kakao', 'naver', 'google', 'apple'] }),
    csrfToken: { type: ['string', 'null'] },
  }),
  Agreement: obj({
    id: { type: 'string', pattern: '^[a-z][a-z0-9-]*$' },
    title: text,
    version: text,
    body: text,
    required: bool,
  }),
  Agreements: obj({ items: array(ref('Agreement')) }),
  Consent: obj({ agreements: array(obj({ id: text, version: text, accepted: bool })) }),
  StockPriceDto: obj(
    {
      ticker: { type: 'string', pattern: '^\\d{6}$' },
      name: text,
      currentPrice: text,
      changeRate: text,
      changePrice: text,
      logoUrl: { type: ['string', 'null'] },
      market: text,
    },
    ['ticker', 'name', 'currentPrice', 'changeRate']
  ),
  Tickets: obj({ free: count, ad: count, adCount: count, adLimit: count }),
  Prediction: obj({
    id: text,
    stockCode: { type: 'string', pattern: '^\\d{6}$' },
    stockName: text,
    direction: { enum: ['up', 'down'] },
    ticket: { enum: ['free', 'ad'] },
    today: bool,
    status: { enum: ['PENDING', 'WON', 'LOST', 'VOID'] },
    points: count,
    claimed: bool,
  }),
  Predictions: obj({
    status: { enum: ['OPEN', 'CLOSED', 'SCHEDULED'] },
    serverTime: { type: 'string', format: 'date-time' },
    closesAt: { type: 'string', format: 'date-time' },
    items: array(ref('Prediction')),
    nextCursor: cursor,
  }),
  PredictionPage: paged(ref('Prediction')),
  PredictionRequest: obj({
    stockCode: { type: 'string', pattern: '^\\d{6}$' },
    direction: { enum: ['up', 'down'] },
  }),
  Transaction: obj({
    id: text,
    title: text,
    amount: { type: 'integer' },
    createdAt: { type: 'string', format: 'date-time' },
  }),
  Wallet: obj({ balance: count, items: array(ref('Transaction')), nextCursor: cursor }),
  TransactionPage: paged(ref('Transaction')),
  Missions: obj({
    attended: bool,
    streak: count,
    items: array(obj({ title: text, points: count, complete: bool })),
  }),
  Product: obj({
    id: text,
    title: text,
    points: { type: 'integer', minimum: 1 },
    amount: count,
    available: bool,
    deliveryNotice: text,
    agreementVersion: text,
    agreementBody: text,
  }),
  Catalog: obj({ items: array(ref('Product')) }),
  RewardClaim: obj({
    id: text,
    title: text,
    points: count,
    status: { enum: ['REQUESTED', 'PROCESSING', 'PAID', 'FAILED', 'REJECTED', 'CANCELED'] },
    createdAt: { type: 'string', format: 'date-time' },
  }),
  ClaimPage: paged(ref('RewardClaim')),
  RewardRequest: obj({
    rewardId: text,
    recipient: obj({
      phone: { type: 'string', pattern: '^010\\d{8}$' },
      name: { type: 'string', minLength: 2, maxLength: 40 },
    }),
    agreementVersion: text,
  }),
  Id: obj({ id: text }),
  AdSession: obj({
    id: text,
    status: { const: 'READY' },
    launchUrl: { type: 'string', format: 'uri', pattern: '^https://' },
  }),
  AdVerified: obj({ status: { const: 'VERIFIED' } }),
  Ok: obj({ success: { const: true } }, []),
};
const snapshot = demoSnapshot();
const examples = {
  Session: {
    user: { id: 'user-123', nickname: 'Candle 회원', consentRequired: false },
    providers: ['kakao', 'google'],
    csrfToken: 'session-csrf-token',
  },
  Agreements: demoLegal,
  Tickets: snapshot.tickets,
  Predictions: snapshot.predictions,
  Wallet: snapshot.wallet,
  Missions: snapshot.missions,
  Catalog: snapshot.catalog,
  ClaimPage: snapshot.claims,
};
const paths = {};
function endpoint(
  path,
  method,
  schema,
  {
    body,
    publicRoute = false,
    implemented = false,
    description = '프론트에서 호출하는 제안 계약. 백엔드 구현 필요.',
    pagination = false,
  } = {}
) {
  const parameters = [];
  if (method !== 'get')
    parameters.push(
      { name: 'X-CSRF-Token', in: 'header', required: true, schema: text },
      {
        name: 'Idempotency-Key',
        in: 'header',
        required: true,
        schema: { type: 'string', minLength: 1, maxLength: 200 },
      }
    );
  if (pagination)
    parameters.push(
      { name: 'cursor', in: 'query', schema: text },
      { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }
    );
  const responseSchema = typeof schema === 'string' ? ref(schema) : schema;
  const responses = {
    200: {
      description: '성공. 직접 JSON 응답이 기준이며 success/data 래퍼도 프론트에서 지원한다.',
      content: {
        'application/json': {
          schema: responseSchema,
          ...(examples[schema] ? { example: examples[schema] } : {}),
        },
      },
    },
  };
  for (const code of ['400', '401', '403', '409', '429', '500', '503'])
    responses[code] = {
      description: '오류. 본문 code에 따라 프론트가 안전한 사용자 문구를 표시한다.',
      content: { 'application/json': { schema: ref('Error') } },
    };
  paths[path] ??= {};
  paths[path][method] = {
    operationId: method + path.replace(/[^a-z0-9]+(.)/gi, (_, c) => c.toUpperCase()),
    description,
    'x-implementation-status': implemented ? 'verified-in-local-backend' : 'proposed',
    security: publicRoute ? [] : [{ sessionCookie: [] }],
    parameters,
    responses,
    ...(body
      ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: typeof body === 'string' ? ref(body) : body } },
          },
        }
      : {}),
  };
}
endpoint('/auth/session', 'get', 'Session', {
  publicRoute: true,
  description:
    '미로그인 상태도 200과 user:null을 반환한다. 인증된 세션은 CSRF 토큰과 온보딩 상태를 반환한다.',
});
endpoint('/legal/agreements/current', 'get', 'Agreements', { publicRoute: true });
endpoint('/stocks/top-list', 'get', array(ref('StockPriceDto')), {
  publicRoute: true,
  implemented: true,
  description:
    '로컬 StockController에서 확인한 기존 API. currentPrice/changeRate는 문자열. currentPrice 0인 미수신 종목은 서버가 제외한다.',
});
for (const [path, schema] of [
  ['/prediction-tickets', 'Tickets'],
  ['/predictions/today', 'Predictions'],
  ['/wallet', 'Wallet'],
  ['/missions', 'Missions'],
  ['/rewards/catalog', 'Catalog'],
  ['/reward-claims', 'ClaimPage'],
])
  endpoint(path, 'get', schema, { pagination: path === '/reward-claims' });
endpoint('/predictions/history', 'get', 'PredictionPage', { pagination: true });
endpoint('/wallet/transactions', 'get', 'TransactionPage', { pagination: true });
for (const [path, body, response] of [
  ['/legal/agreements', 'Consent', 'Ok'],
  ['/predictions', 'PredictionRequest', 'Id'],
  ['/missions/attendance', obj({}), 'Ok'],
  ['/predictions/claim', obj({ predictionId: text }), 'Ok'],
  ['/reward-claims', 'RewardRequest', 'Id'],
  ['/ads/sessions', obj({}), 'AdSession'],
  ['/ads/sessions/verify', obj({ sessionId: text }), 'AdVerified'],
  ['/auth/logout', obj({}), 'Ok'],
])
  endpoint(path, 'post', response, { body });
paths['/auth/{provider}/start'] = {
  get: {
    operationId: 'startOAuth',
    description:
      '서버가 OAuth state/nonce 및 필요 시 PKCE를 검증하고 세션 쿠키를 설정한 후 승인된 returnTo 주소로 리다이렉트한다. 토큰은 URL에 넣지 않는다.',
    security: [],
    parameters: [
      {
        name: 'provider',
        in: 'path',
        required: true,
        schema: { enum: ['kakao', 'naver', 'google', 'apple'] },
      },
      { name: 'returnTo', in: 'query', required: true, schema: { type: 'string', format: 'uri' } },
    ],
    responses: {
      302: { description: '제공자 인증 또는 allowlist에 있는 프론트 주소로 이동' },
      400: { description: '허용되지 않은 제공자 또는 returnTo' },
    },
  },
};
const spec = {
  openapi: '3.1.0',
  info: {
    title: 'Candle Frontend Integration Contract',
    version: '1.0.0',
    description:
      '2026-10-11 프론트 연동 계약. stocks/top-list만 로컬 Spring 코드에서 구현을 확인했다. 나머지는 합의/구현이 필요한 계약이며 실서비스 구현 완료를 의미하지 않는다. 예시는 데모 데이터다.',
  },
  servers: [{ url: '/api/v1' }],
  paths,
  components: {
    securitySchemes: {
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'CANDLE_SESSION',
        description: '운영 서버 발급 HttpOnly Secure 쿠키. 프론트는 쿠키를 읽지 않는다.',
      },
    },
    schemas,
  },
};
await writeFile(new URL('../docs/openapi.json', import.meta.url), JSON.stringify(spec, null, 2) + '\n');
console.log(`Wrote ${Object.keys(paths).length} API paths.`);
