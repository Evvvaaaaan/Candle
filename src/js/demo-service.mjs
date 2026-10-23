import {
  AD_LIMIT,
  STORAGE_KEY,
  dayKey,
  emptyLedger,
  restoreLedger,
  ticketBalance,
  submitPrediction,
  rewardAd,
} from './prediction-ledger.mjs';
import { ApiError } from './api-client.mjs';
import { validRecipient } from './challenge-reward.mjs';

export function demoChallengeReward(account = {}) {
  return {
    status: account.challengeClaim ? 'REQUESTED' : 'ELIGIBLE',
    awardId: 'preview-ten-wins',
    claimId: account.challengeClaim?.id || null,
    amount: 1000000,
    payoutPoints: 1000000,
    method: 'NAVER_ID',
    serverTime: new Date().toISOString(),
    claimDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    taxNotice: '미리보기 지급 예시입니다. 실제 세금 부담 및 실수령 포인트는 운영 정책 확정 후 안내합니다.',
    deliveryNotice: '미리보기에서는 신청 흐름만 확인하며 실제 적립이나 쿠폰 발송은 발생하지 않습니다.',
    statusNote: '미리보기 신청을 접수했습니다. 실제 당첨 또는 지급 내역이 아닙니다.',
    agreements: [
      {
        id: 'collection',
        title: '수령 정보 수집·이용 동의',
        version: 'preview-prize-1',
        body: '흐름 확인용 예시입니다. 운영 시 수집 주체, 네이버 ID 수집 목적·항목, 보유 기간, 거부 권리와 수령 제한을 명시해야 합니다. 이 미리보기는 입력 원문을 저장하지 않습니다.',
      },
      {
        id: 'provision',
        title: '개인정보 제3자 제공 동의',
        version: 'preview-prize-1',
        body: '흐름 확인용 예시입니다. 운영 시 네이버파이낸셜 등 실제 제공받는 자, 포인트 적립 목적, 제공 항목, 보유 기간, 거부 권리와 수령 제한을 승인된 문구로 제공합니다. 미리보기에서는 외부 제공이 없습니다.',
      },
    ],
  };
}

export const ACCOUNT_KEY = 'candle.demo.account.v1';
export const demoLegal = {
  items: [
    {
      id: 'age',
      title: '만 14세 이상입니다',
      version: 'preview-1',
      required: true,
      body: '미리보기 가입 흐름 확인용 연령 확인 항목입니다. 운영 정책은 서비스 출시 전에 확정합니다.',
    },
    {
      id: 'terms',
      title: '서비스 이용약관 동의',
      version: 'preview-1',
      required: true,
      body: '이 화면은 기능 확인용 미리보기입니다. 예측·포인트·리워드는 실제 금전적 가치가 없으며 실제 지급은 발생하지 않습니다. 운영용 이용약관은 백엔드에서 승인된 버전으로 제공해야 합니다.',
    },
    {
      id: 'privacy',
      title: '개인정보 처리방침 동의',
      version: 'preview-1',
      required: true,
      body: '미리보기에는 실제 개인정보를 입력하지 마세요. 미리보기 기록은 현재 브라우저에 저장됩니다. 지급 폼의 이름과 전화번호 원문은 저장하지 않습니다. 운영용 개인정보 처리방침은 처리 목적, 항목, 보관 기간과 책임자를 확정한 뒤 제공합니다.',
    },
  ],
};

export const demoStocks = [
  ['005930', '삼성전자', '코스피', 72400, 1.4],
  ['000660', 'SK하이닉스', '코스피', 188700, 2.1],
  ['035420', 'NAVER', '코스피', 212000, -0.7],
  ['005380', '현대차', '코스피', 247500, 0.8],
  ['068270', '셀트리온', '코스피', 185100, -1.2],
  ['035720', '카카오', '코스피', 42800, 0.5],
  ['247540', '에코프로비엠', '코스닥', 168600, 1.8],
].map(([code, name, market, price, change]) => ({
  code,
  name,
  market,
  price: `${price.toLocaleString('ko-KR')}원`,
  change: `${change >= 0 ? '+' : ''}${change}%`,
}));

export const demoCatalog = {
  items: [5000, 10000, 50000, 100000].map((points) => ({
    id: `naverpay-${points}`,
    title: `네이버페이 ${points.toLocaleString('ko-KR')}원권`,
    points,
    amount: points,
    available: true,
    deliveryNotice: '미리보기 · 실제 발송 없음',
    agreementVersion: 'preview-reward-1',
    agreementBody:
      '교환 흐름 확인용 미리보기입니다. 실제 개인정보를 입력하지 마세요. 입력한 이름과 전화번호 원문은 저장하지 않으며 실제 지급 신청이나 발송은 발생하지 않습니다.',
  })),
};

export function freshAccount() {
  return {
    balance: 12800,
    attendedDay: null,
    streak: 3,
    claimed: [],
    claims: [],
    transactions: [],
    completed: {},
    user: null,
  };
}

export function demoSnapshot(account = freshAccount(), ledger = emptyLedger()) {
  const balance = ticketBalance(ledger);
  return {
    stocks: demoStocks,
    wallet: { balance: account.balance, items: account.transactions, nextCursor: null },
    tickets: { free: balance.free, ad: balance.ad, adCount: balance.adCount, adLimit: AD_LIMIT },
    predictions: {
      status: 'OPEN',
      serverTime: new Date().toISOString(),
      closesAt: `${dayKey()}T23:59:59+09:00`,
      nextCursor: null,
      items: [
        ...ledger.predictions.map((p) => ({
          ...p,
          stockName: demoStocks.find((s) => s.code === p.stockCode)?.name || p.stockCode,
          today: true,
          status: 'PENDING',
          points: 0,
          claimed: false,
        })),
        {
          id: 'demo-result',
          stockCode: '005930',
          stockName: '삼성전자',
          direction: 'up',
          ticket: 'free',
          today: false,
          status: 'WON',
          points: 15,
          claimed: account.claimed.includes('demo-result'),
        },
      ],
    },
    missions: {
      attended: account.attendedDay === dayKey(),
      streak: account.streak,
      items: [
        { title: '오늘의 예측 완료', points: 10, complete: ledger.predictions.length > 0 },
        { title: '광고 예측권 받기', points: 5, complete: ledger.adRewards.length > 0 },
      ],
    },
    catalog: demoCatalog,
    claims: { items: account.claims, nextCursor: null },
  };
}

export function createDemoService(storage = localStorage) {
  let adSession = null;
  function read() {
    try {
      const raw = storage.getItem(ACCOUNT_KEY);
      const account = raw ? JSON.parse(raw) : freshAccount();
      if (
        !Number.isSafeInteger(account.balance) ||
        account.balance < 0 ||
        !Array.isArray(account.claims) ||
        !Array.isArray(account.transactions) ||
        !Array.isArray(account.claimed) ||
        !account.completed
      )
        throw Error('invalid');
      if (account.user?.nickname === '데모 회원') account.user.nickname = '캔들 회원';
      account.transactions.forEach((item) => {
        item.title = item.title.replace(/^데모 /, '');
      });
      const ledger = restoreLedger(JSON.parse(storage.getItem(STORAGE_KEY) || 'null'));
      account.ledger = restoreLedger(account.ledger || ledger);
      return { account, ledger: account.ledger };
    } catch {
      throw new ApiError('STORAGE_UNAVAILABLE');
    }
  }
  function save(account, ledger) {
    try {
      if (ledger) account.ledger = ledger;
      storage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    } catch {
      throw new ApiError('STORAGE_UNAVAILABLE');
    }
  }
  const transaction = (account, title, amount, id, claimId) => {
    account.balance += amount;
    account.transactions.unshift({
      id,
      title,
      amount,
      createdAt: new Date().toISOString(),
      ...(claimId && { claimId }),
    });
  };
  async function mutate(action, body = {}, key) {
    const { account, ledger } = read();
    if (key && account.completed[key]) return account.completed[key];
    let result = { success: true };
    if (action === 'consent') {
      if (
        !demoLegal.items.every((a) =>
          body.agreements?.some((x) => x.id === a.id && x.version === a.version && x.accepted)
        )
      )
        throw new ApiError('AGREEMENT_REQUIRED');
      account.user = { id: 'demo-user', nickname: '캔들 회원', consentRequired: false };
    } else if (action === 'prediction') {
      const submitted = submitPrediction(ledger, {
        id: key,
        stockCode: body.stockCode,
        direction: body.direction,
      });
      if (submitted.status === 'empty') throw new ApiError('INSUFFICIENT_TICKETS');
      if (submitted.status === 'stock-used') throw new ApiError('ALREADY_PREDICTED');
      if (submitted.status === 'invalid') throw new ApiError('VALIDATION_ERROR');
      if (submitted.status === 'accepted' && !ledger.predictions.length)
        transaction(account, '예측 미션', 10, `prediction-${ledger.day}`);
      save(account, submitted.ledger);
      return { id: submitted.record.id };
    } else if (action === 'attendance') {
      if (account.attendedDay === dayKey()) throw new ApiError('ALREADY_CLAIMED');
      account.attendedDay = dayKey();
      account.streak += 1;
      transaction(account, '출석 보상', 10, key);
    } else if (action === 'claim') {
      if (body.predictionId !== 'demo-result' || account.claimed.includes(body.predictionId))
        throw new ApiError('ALREADY_CLAIMED');
      account.claimed.push(body.predictionId);
      transaction(account, '예측 적중 보상', 15, key);
    } else if (action === 'challengeReward') {
      const reward = demoChallengeReward(account);
      if (!account.user || account.user.consentRequired) throw new ApiError('SESSION_EXPIRED', 401);
      if (reward.status !== 'ELIGIBLE') throw new ApiError('ALREADY_CLAIMED', 409);
      if (
        body.awardId !== reward.awardId ||
        body.method !== reward.method ||
        !validRecipient(reward.method, body.recipient?.naverId || '') ||
        !body.npayTermsConfirmed
      )
        throw new ApiError('VALIDATION_ERROR', 400);
      if (
        !reward.agreements.every((a) =>
          body.agreements?.some((x) => x.id === a.id && x.version === a.version && x.accepted)
        )
      )
        throw new ApiError('AGREEMENT_REQUIRED', 400);
      account.challengeClaim = { id: key, createdAt: new Date().toISOString() };
      result = { id: key };
    } else if (action === 'reward') {
      const product = demoCatalog.items.find((p) => p.id === body.rewardId);
      if (
        !product ||
        body.agreementVersion !== product.agreementVersion ||
        !/^010\d{8}$/.test(body.recipient?.phone) ||
        !body.recipient?.name?.trim()
      )
        throw new ApiError('VALIDATION_ERROR');
      if (account.balance < product.points) throw new ApiError('INSUFFICIENT_POINTS');
      const claim = {
        id: key,
        title: product.title,
        points: product.points,
        status: 'REQUESTED',
        createdAt: new Date().toISOString(),
      };
      account.claims.unshift(claim);
      transaction(account, '포인트 교환', -product.points, key, claim.id);
      result = { id: claim.id };
    } else if (action === 'adStart') {
      if (!ticketBalance(ledger).adRemaining) throw new ApiError('AD_UNAVAILABLE');
      adSession = { id: key, day: ledger.day, startedAt: Date.now() };
      return { id: key, status: 'READY' };
    } else if (action === 'adComplete') {
      if (!adSession || body.sessionId !== adSession.id || Date.now() - adSession.startedAt < 15000)
        throw new ApiError('AD_NOT_VERIFIED');
      const reward = rewardAd(ledger, adSession);
      if (!['awarded', 'duplicate'].includes(reward.status)) throw new ApiError('AD_UNAVAILABLE');
      if (reward.status === 'awarded' && !ledger.adRewards.length)
        transaction(account, '광고 미션', 5, `ad-${ledger.day}`);
      save(account, reward.ledger);
      return { status: 'VERIFIED' };
    } else if (action === 'logout') {
      account.user = null;
    } else throw new ApiError('VALIDATION_ERROR');
    if (key) account.completed[key] = result;
    save(account);
    return result;
  }
  return {
    mode: 'demo',
    async session() {
      return {
        providers: ['kakao', 'naver', 'google', 'apple'],
        user: read().account.user,
        csrfToken: 'demo-only',
      };
    },
    async legal() {
      return structuredClone(demoLegal);
    },
    async challengeReward() {
      return demoChallengeReward(read().account);
    },
    async load() {
      const { account, ledger } = read();
      return demoSnapshot(account, ledger);
    },
    async login() {
      const { account } = read();
      account.user = { id: 'demo-user', nickname: '캔들 회원', consentRequired: true };
      save(account);
    },
    mutate(action, body, key) {
      const run = () => mutate(action, body, key);
      return globalThis.navigator?.locks ? navigator.locks.request('candle-demo', run) : run();
    },
  };
}
