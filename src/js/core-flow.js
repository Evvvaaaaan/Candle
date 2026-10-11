import { ApiError, errorMessage } from './api-client.mjs';
import { createCandleService, resolveConfig, validateSnapshot } from './candle-service.mjs';

const config = resolveConfig(window.CANDLE_CONFIG);
const service =
  config.mode === 'demo'
    ? (await import('./demo-service.mjs')).createDemoService()
    : createCandleService(config);
const demo = service.mode === 'demo';
const app = document.getElementById('app');
const picker = document.getElementById('screen-picker');
document.querySelector('.prototype-panel').hidden = !demo;
document.querySelector('.prototype-shell').classList.toggle('live-shell', !demo);
const screens = [
  ['splash', '시작'],
  ['signup', '로그인'],
  ['consent', '가입 전 확인'],
  ['home', '홈'],
  ['stock-select', '종목 선택'],
  ['prediction', '예측'],
  ['confirm', '예측 확인'],
  ['submitted', '접수 완료'],
  ['pass', '예측권'],
  ['ad', '광고'],
  ['result', '결과'],
  ['missions', '미션'],
  ['shop', '포인트 샵'],
  ['exchange', '교환 확인'],
  ['history', '교환 내역'],
  ['profile', '내 정보'],
  ['payout', '지급 신청'],
  ['prediction-history', '예측 내역'],
  ['wallet', '포인트 내역'],
  ['settings', '계정 설정'],
  ['legal', '약관 보기'],
];
const navConfig = [
  ['home', '홈', 'home'],
  ['prediction', '예측', 'prediction'],
  ['missions', '미션', 'mission'],
  ['shop', '상점', 'shop'],
  ['profile', '내 정보', 'profile'],
];
let session = null,
  legal = null,
  data = null,
  loadedAt = 0,
  busy = false,
  loading = false,
  fatal = null;
let revision = 0,
  adTimer = null;
const state = {
  stockCode: null,
  direction: 'up',
  productId: null,
  stockReturn: 'home',
  search: '',
  market: 'all',
  attempt: null,
  receiptId: null,
  ad: null,
  legalId: 'terms',
  legalReturn: 'settings',
  consent: {},
  payoutDraft: null,
  operation: null,
  errors: '',
};
const e = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const n = (value) => Number(value).toLocaleString('ko-KR');
const icon = (name) => `./src/assets/core-flow/${name}`;
const routeName = () =>
  screens.some(([id]) => id === location.hash.slice(1)) ? location.hash.slice(1) : 'splash';
const stock = () => data?.stocks.find((s) => s.code === state.stockCode) || data?.stocks[0];
const product = () => data?.catalog.items.find((p) => p.id === state.productId);
const totalTickets = () => (data?.tickets.free || 0) + (data?.tickets.ad || 0);
const todayPrediction = (code) => data?.predictions.items.find((p) => p.today && p.stockCode === code);
const isOpen = () =>
  data?.predictions.status === 'OPEN' &&
  Date.parse(data.predictions.closesAt) >
    Date.parse(data.predictions.serverTime) + (performance.now() - loadedAt);
const button = (text, route, cls = 'primary-button', disabled = false) =>
  `<button class="${cls}" type="button" data-route="${route}"${disabled ? ' disabled' : ''}>${e(text)}</button>`;
const empty = (text, route = 'home', action = '홈으로') =>
  `<div class="empty-state"><p>${e(text)}</p>${button(action, route, 'secondary-button')}</div>`;
const statusBar = () =>
  demo
    ? '<div class="status-bar"><span class="status-time">DEMO</span><span>실제 지급 없음</span></div>'
    : '<div class="status-bar" aria-hidden="true"></div>';
const header = () =>
  `<header class="app-header"><div class="brand"><img src="${icon('candle-logo.png')}" alt=""><span>Candle</span></div></header>`;
const backHeader = (title, route) =>
  `<header class="transaction-header"><button class="back-button" type="button" data-route="${route}" aria-label="이전 화면"><img src="${icon('chevron-left.svg')}" alt=""></button><h1>${e(title)}</h1></header>`;
const nav = (active) =>
  `<nav class="bottom-nav" aria-label="하단 메뉴">${navConfig.map(([id, label, asset]) => `<button class="nav-item${id === active ? ' active' : ''}" type="button" data-route="${id}"${id === active ? ' aria-current="page"' : ''}><img src="${icon(`nav-${asset}${id === active ? '-active' : ''}.svg`)}" alt=""><span>${label}</span></button>`).join('')}</nav>`;
const title = (heading, sub = '') =>
  `<h1 class="heading" tabindex="-1">${e(heading)}</h1>${sub ? `<p class="subheading">${e(sub)}</p>` : ''}`;
const more = (kind) =>
  data[kind].nextCursor
    ? `<button class="secondary-button" type="button" data-more="${kind}">이전 내역 더 보기</button>`
    : '';
const shell = (name, body, active = 'home') =>
  `<section class="screen-view" data-screen="${name}">${statusBar()}${header()}<div class="content">${body}</div>${nav(active)}</section>`;
const pointsCard = () =>
  `<section class="card points-card"><div><p class="card-label">보유 포인트</p><p class="number">${n(data.wallet.balance)} P</p></div>${button('내역 보기 ›', 'wallet', 'link-button')}</section>`;
const ticketSummary = () =>
  `<span class="ticket-breakdown"><span>기본 무료 <strong>${n(data.tickets.free)}회</strong></span><span>광고 예측권 <strong>${n(data.tickets.ad)}장</strong></span></span>`;
const ticketCard = () =>
  `<button class="ticket-card" type="button" data-route="pass"><span class="row-between"><span>사용 가능한 예측권</span><strong class="ticket-total">${n(totalTickets())}회</strong></span>${ticketSummary()}</button>`;
const directionCard = (direction, disabled = false) =>
  `<button class="direction-card${state.direction === direction ? ' selected' : ''}" type="button" data-direction="${direction}" aria-pressed="${state.direction === direction}"${disabled ? ' disabled' : ''}><span class="direction-icon${direction === 'down' ? ' down' : ''}"><img src="${icon(direction === 'up' ? 'arrow-up.svg' : 'arrow-down.svg')}" alt=""></span><span><span class="direction-title">${direction === 'up' ? '상승' : '하락'}</span><span class="direction-caption">${direction === 'up' ? '오를 것 같아요' : '내릴 것 같아요'}</span></span></button>`;
function stockCard(changeable = true) {
  const s = stock();
  if (!s) return empty('지금 조회 가능한 종목이 없어요.');
  return `<section class="card stock-card"><div class="stock-top"><div><p class="card-label">선택한 종목</p><p class="stock-name">${e(s.name)}</p><p class="card-label">${e(s.code)} · ${e(s.market)}</p></div>${changeable ? '<button class="stock-change" type="button" data-stock-picker>종목 변경</button>' : ''}</div>${demo ? `<img class="stock-chart" src="${icon('stock-chart.svg')}" alt="실제 시세가 아닌 데모 차트">` : ''}<div class="quote-row"><span>${demo ? '예시 가격' : '조회 가격'} ${e(s.price)}</span><span class="${s.change.startsWith('-') ? 'down-text' : 'up-text'}">${e(s.change)}</span></div><p class="card-label">${demo ? '기능 확인용 예시 시세입니다.' : '조회 시점의 시세이며 실시간 가격과 차이가 있을 수 있습니다.'}</p></section>`;
}
function productCard(p, compact = false) {
  return `<${compact ? 'div' : 'button'} class="product-card${compact ? ' compact' : ''}"${compact ? '' : ` type="button" data-product="${e(p.id)}"${p.available ? '' : ' disabled'}`}><span class="npay-logo">Npay</span><span class="product-copy"><small>${e(p.title)}</small><strong>${n(p.amount)}원권</strong><span>${n(p.points)}P${p.available ? '' : ' · 준비 중'}</span></span></${compact ? 'div' : 'button'}>`;
}
function renderSplash() {
  return `<section class="screen-view splash-screen" data-screen="splash"><div class="splash-lockup"><img src="${icon('candle-logo.png')}" alt="Candle 로고"><h1>Candle</h1><p>오늘의 선택이 내일의 포인트로</p></div>${button('시장 예측 리워드 서비스', session?.user && !session.user.consentRequired ? 'home' : 'signup', 'launch-note')}</section>`;
}
function renderSignup() {
  const names = { kakao: '카카오', naver: '네이버', google: 'Google', apple: 'Apple' };
  return `<section class="screen-view signup-screen" data-screen="signup">${statusBar()}<div class="signup-content"><div class="signup-brand"><img src="${icon('candle-logo.png')}" alt=""><span>Candle</span></div><div class="signup-intro"><h1 tabindex="-1">로그인</h1><p>오늘의 시장을 예측하고<br>포인트를 모아보세요.</p>${demo ? '<span>데모 체험 · 실제 지급 없음</span>' : ''}</div><div class="signup-auth"><h2 class="auth-label">간편 로그인</h2><div class="auth-list">${session.providers.map((p) => `<button class="auth-button ${p}" type="button" data-login="${p}"><img src="${icon(p === 'apple' ? 'apple.png' : `${p}.svg`)}" alt="">${names[p]}로 계속하기</button>`).join('') || '<p class="empty-state">현재 이용 가능한 로그인 방법이 없습니다.</p>'}</div></div></div><p class="signup-note">처음 이용하는 경우 다음 단계에서 필수 약관을 확인합니다.</p></section>`;
}
function renderConsent() {
  return `<section class="screen-view consent-screen" data-screen="consent">${statusBar()}${backHeader('가입 전 확인', 'signup')}<div class="consent-main">${title('약관에 동의해 주세요', '필수 내용을 확인한 뒤 계속해 주세요.')}<div class="consent-icon"><img src="${icon('consent-check.svg')}" alt=""></div><div class="agree-all"><label class="check-row"><input id="agree-all" type="checkbox"><strong>약관 전체 동의</strong></label></div><div class="card agreement-card">${legal.items.map((a, i) => `${i ? '<hr>' : ''}<div class="agreement-line"><label class="check-row"><input id="${e(a.id)}" class="agreement-checkbox${a.required ? ' required-agreement' : ''}" type="checkbox" data-agreement="${e(a.id)}"${state.consent[a.id] ? ' checked' : ''}><span>${e(a.title)} (${a.required ? '필수' : '선택'})</span></label><button type="button" data-legal="${e(a.id)}">보기</button></div>`).join('')}</div></div><button id="consent-submit" class="primary-button consent-action" type="button" disabled>동의하고 계속하기</button><p class="consent-footer">필수 항목에 동의해야 가입을 진행할 수 있습니다.</p></section>`;
}
function renderHome() {
  return shell(
    'home',
    `${title('오늘의 종목을 예측해 보세요', isOpen() ? '다음 거래일 방향을 선택하세요.' : '현재 예측 참여 시간이 아닙니다.')}${pointsCard()}${stockCard()}${stock() ? `<h2 class="section-title">다음 거래일 종가는?</h2><div class="direction-grid">${directionCard('up', !isOpen() || !!todayPrediction(stock().code))}${directionCard('down', !isOpen() || !!todayPrediction(stock().code))}</div>` : ''}${button('예측 결과 확인', 'result', 'secondary-button')}`
  );
}
function renderStockSelect() {
  const rows = data.stocks.filter(
    (s) =>
      (state.market === 'all' || s.market === state.market) &&
      `${s.name} ${s.code}`.toLowerCase().includes(state.search.toLowerCase())
  );
  return `<section class="screen-view stock-select-screen" data-screen="stock-select">${statusBar()}${backHeader('종목 선택', state.stockReturn)}<div class="stock-select-content">${title('예측할 종목을 선택하세요')}<label class="stock-search"><span aria-hidden="true">⌕</span><input id="stock-search-input" type="search" aria-label="종목명 또는 종목코드 검색" placeholder="종목명 또는 종목코드 검색" value="${e(state.search)}"></label><div class="stock-market-tabs" role="group" aria-label="시장 구분">${['all', ...new Set(data.stocks.map((s) => s.market))].map((m) => `<button type="button" data-market="${e(m)}" aria-pressed="${m === state.market}" class="${m === state.market ? 'active' : ''}">${m === 'all' ? '전체' : e(m)}</button>`).join('')}</div><div class="stock-list-heading"><h2>국내 종목</h2><span id="stock-result-count">${rows.length}개</span></div><div id="stock-select-list" class="card stock-select-list">${rows.map((s) => `<button class="stock-select-row" type="button" data-stock-code="${s.code}"><span class="stock-symbol">${e(s.name.slice(0, 1))}</span><span class="stock-row-copy"><strong>${e(s.name)}</strong><small>${s.code} · ${e(s.market)}</small></span><span class="stock-row-state">${todayPrediction(s.code) ? '오늘 예측 완료' : s.code === state.stockCode ? '선택됨' : '선택'}</span></button>`).join('')}</div>${rows.length ? '' : '<p id="stock-empty" class="stock-empty">검색 결과가 없습니다.</p>'}</div></section>`;
}
function renderPrediction() {
  const s = stock(),
    submitted = s && todayPrediction(s.code);
  return shell(
    'prediction',
    `${title(s?.name || '예측할 종목이 없어요', isOpen() ? '다음 거래일 종가를 예측해 보세요.' : '현재 참여 시간이 아닙니다.')}${stockCard()}${ticketCard()}${s ? `<div class="direction-grid">${directionCard('up', !!submitted || !isOpen() || !totalTickets())}${directionCard('down', !!submitted || !isOpen() || !totalTickets())}</div>${submitted ? `<div class="prediction-status"><p>오늘 이 종목은 예측을 마쳤어요.</p><button class="secondary-button" type="button" data-stock-picker>다른 종목 선택하기</button></div>` : button(totalTickets() ? '예측 확인' : '예측권 받기', totalTickets() ? 'confirm' : 'pass', 'primary-button', !isOpen())}` : ''}<p class="ticket-policy">최종 마감 여부와 예측권 사용은 ${demo ? '데모 규칙' : '서버'}에서 확인합니다.</p>`,
    'prediction'
  );
}
function renderConfirm() {
  if (!state.attempt || !stock() || !isOpen() || !totalTickets() || todayPrediction(stock().code))
    return shell(
      'confirm',
      empty('예측 상태가 변경되었어요. 종목과 방향을 다시 확인해 주세요.', 'prediction', '예측 화면으로'),
      'prediction'
    );
  return shell(
    'confirm',
    `${title('예측 확인')}${stockCard(false)}<section class="summary-card"><p class="sheet-title">${state.attempt.direction === 'up' ? '상승' : '하락'} 예측을 제출할까요?</p><p class="sheet-copy">${data.tickets.free ? '기본 무료권' : '광고 예측권'} 1장 사용 · 제출 후 ${totalTickets() - 1}회 남음</p><div class="sheet-actions">${button('취소', 'prediction', 'secondary-button')}<button id="submit-prediction" class="primary-button" type="button">예측 제출</button></div></section>`,
    'prediction'
  );
}
function renderSubmitted() {
  const p =
    data.predictions.items.find((p) => p.id === state.receiptId) ||
    data.predictions.items.find((p) => p.today);
  if (!p)
    return shell(
      'submitted',
      empty('아직 접수한 예측이 없어요.', 'prediction', '예측하러 가기'),
      'prediction'
    );
  return shell(
    'submitted',
    `${title('예측이 접수되었습니다')}<div class="success-state"><div class="success-icon"><img src="${icon('success-check.svg')}" alt=""></div><h2 class="success-title">${p.direction === 'up' ? '상승' : '하락'} 예측 접수 완료</h2><p class="success-caption">${e(p.stockName)}</p></div><section class="summary-card"><div class="summary-row"><span>예측 방향</span><strong>${p.direction === 'up' ? '↗ 상승' : '↘ 하락'}</strong></div><div class="summary-row"><span>사용 예측권</span><strong>${p.ticket === 'free' ? '기본 무료권' : '광고 예측권'} 1장</strong></div><div class="summary-row"><span>남은 예측권</span><strong>${totalTickets()}회</strong></div></section>${button('다른 종목 예측하기', 'prediction')}${button('홈으로', 'home', 'secondary-button')}`,
    'prediction'
  );
}
function renderPass() {
  const t = data.tickets;
  return shell(
    'pass',
    `${title('추가 예측권', '영상 광고의 완료가 확인되면 예측권을 받을 수 있습니다.')}<section class="card balance-card ticket-wallet"><strong class="ticket-total">${totalTickets()}회</strong>${ticketSummary()}</section><section class="card ad-progress"><p>오늘의 광고 참여</p><p class="number">${t.adCount} / ${t.adLimit}회</p></section><section class="card promo-card"><h2>${t.adCount < t.adLimit ? '광고 보고 예측권 받기' : '오늘 참여를 마쳤어요'}</h2><p>${demo ? '데모 광고는 15초입니다. 실제 보상은 발생하지 않습니다.' : '광고 제공자의 완료 확인 후 서버가 보상을 지급합니다.'}</p><button id="watch-ad" class="primary-button" type="button"${t.adCount < t.adLimit ? '' : ' disabled'}>광고 시작하기</button></section>${button('예측하러 가기', 'prediction', 'secondary-button')}`,
    'prediction'
  );
}
function renderAd() {
  if (!state.ad)
    return shell('ad', empty('광고 세션을 먼저 시작해 주세요.', 'pass', '예측권 화면으로'), 'prediction');
  return shell(
    'ad',
    `${title(demo ? '데모 광고 체험' : '광고 참여')}<section class="card"><p>${demo ? '15초 뒤 데모 완료 확인이 가능합니다.' : '광고를 시청한 후 돌아와 완료 여부를 확인해 주세요.'}</p>${demo ? '<p id="ad-countdown" class="number">15초</p>' : `<a class="primary-button" href="${e(state.ad.launchUrl)}" target="_blank" rel="noopener noreferrer">광고 열기</a>`}</section><button id="verify-ad" class="primary-button" type="button"${demo && Date.now() - state.ad.startedAt < 15000 ? ' disabled' : ''}>시청 완료 확인</button>${button('닫기', 'pass', 'secondary-button')}`,
    'prediction'
  );
}
const resultLabels = { PENDING: '결과 대기', WON: '적중', LOST: '미적중', VOID: '무효' };
function renderResults(history = false) {
  return shell(
    history ? 'prediction-history' : 'result',
    `${title(history ? '예측 내역' : '예측 결과', '확정된 결과와 보상을 확인하세요.')}${data.predictions.items.map((p) => `<section class="card result-card"><div class="row-between"><strong>${e(p.stockName)}</strong><span class="badge">${resultLabels[p.status]}</span></div><div class="summary-row"><span>내 예측</span><strong>${p.direction === 'up' ? '↗ 상승' : '↘ 하락'}</strong></div><p>${n(p.points)}P · ${p.claimed ? '수령 완료' : p.status === 'PENDING' ? '결과 확정 후 확인' : '확정된 보상'}</p>${p.status === 'WON' && p.points > 0 ? `<button class="primary-button" type="button" data-claim="${e(p.id)}"${p.claimed ? ' disabled' : ''}>${p.claimed ? '수령 완료' : `${n(p.points)}P 수령하기`}</button>` : ''}</section>`).join('') || empty('아직 예측 내역이 없어요.', 'prediction', '예측 시작하기')}${more('predictions')}`,
    'prediction'
  );
}
function renderMissions() {
  const m = data.missions;
  return shell(
    'missions',
    `${title('오늘의 미션', '출석과 활동 현황을 확인하세요.')}<section class="card attendance-card"><p class="card-label">연속 출석</p><p class="number">${m.streak}일째</p><button id="attendance" class="primary-button" type="button"${m.attended ? ' disabled' : ''}>${m.attended ? '출석 완료' : '오늘 출석하기'}</button></section>${m.items.map((x) => `<section class="card mission-row"><div class="row-between"><strong>${e(x.title)}</strong><span>${n(x.points)}P</span></div><p>${x.complete ? '완료' : '참여 전'}</p></section>`).join('')}`,
    'missions'
  );
}
function renderShop() {
  return shell(
    'shop',
    `${title('포인트 샵', '보유 포인트로 교환을 신청하세요.')}${pointsCard()}${data.catalog.items.map((p) => productCard(p)).join('') || empty('현재 교환 가능한 상품이 없어요.')}${button('교환 내역', 'history', 'secondary-button')}`,
    'shop'
  );
}
function renderExchange() {
  const p = product();
  if (!p) return shell('exchange', empty('상품을 먼저 선택해 주세요.', 'shop', '상품 보기'), 'shop');
  const enough = data.wallet.balance >= p.points;
  return shell(
    'exchange',
    `${title('교환 확인')}${productCard(p, true)}<section class="summary-card"><div class="summary-row"><span>보유 포인트</span><strong>${n(data.wallet.balance)}P</strong></div><div class="summary-row"><span>${enough ? '교환 후 잔액' : '부족한 포인트'}</span><strong>${n(Math.abs(data.wallet.balance - p.points))}P</strong></div></section><p class="field-help">${e(p.deliveryNotice)}</p>${button(enough ? '수령 정보 입력' : '포인트가 부족해요', 'payout', 'primary-button', !enough || !p.available)}`,
    'shop'
  );
}
const claimLabels = {
  REQUESTED: '신청 접수',
  PROCESSING: '처리 중',
  PAID: '지급 완료',
  FAILED: '지급 실패',
  REJECTED: '반려',
  CANCELED: '취소',
};
function renderHistory() {
  return shell(
    'history',
    `${title('교환 내역', '신청 상태는 서버의 처리 결과를 따릅니다.')}${data.claims.items.map((c) => `<section class="card request-card"><div class="row-between"><strong>${e(c.title)}</strong><span class="badge">${claimLabels[c.status]}</span></div><p>${e(c.createdAt.slice(0, 10))}</p><p>${n(c.points)}P</p></section>`).join('') || empty('아직 교환 신청 내역이 없어요.', 'shop', '상품 보기')}${more('claims')}`,
    'shop'
  );
}
function renderWallet() {
  return shell(
    'wallet',
    `${title('포인트 내역')}${pointsCard()}${data.wallet.items.map((t) => `<section class="card"><div class="row-between"><strong>${e(t.title)}</strong><span>${t.amount > 0 ? '+' : ''}${n(t.amount)}P</span></div><p class="card-label">${e(t.createdAt.slice(0, 10))}</p></section>`).join('') || empty('아직 포인트 변동 내역이 없어요.')}${more('wallet')}`,
    'profile'
  );
}
function renderProfile() {
  const total = data.predictions.items.length,
    won = data.predictions.items.filter((p) => p.status === 'WON').length;
  return shell(
    'profile',
    `${title('내 정보')}<section class="card account-card"><strong>${e(session.user.nickname)}</strong></section>${pointsCard()}<section class="card stats-card"><p>조회된 예측 내역</p><div class="stats-grid"><div><strong>${total}회</strong><span>예측</span></div><div><strong>${won}회</strong><span>적중</span></div></div></section><section class="card menu-card">${[
      ['예측 내역', 'prediction-history'],
      ['포인트 내역', 'wallet'],
      ['교환 내역', 'history'],
      ['계정 · 약관', 'settings'],
    ]
      .map(([label, r]) => button(label, r, 'menu-row'))
      .join('<hr>')}</section>`,
    'profile'
  );
}
function renderSettings() {
  return shell(
    'settings',
    `${title('계정 · 약관')}<section class="card menu-card">${legal.items.map((a) => `<button class="menu-row" type="button" data-legal="${e(a.id)}"><span>${e(a.title)}</span><span>›</span></button>`).join('<hr>')}</section><button id="logout" class="secondary-button" type="button">로그아웃</button>`,
    'profile'
  );
}
function renderLegal() {
  const a =
    state.legalId === 'reward'
      ? product() && {
          title: '지급 안내 및 개인정보 동의',
          body: product().agreementBody,
          version: product().agreementVersion,
        }
      : legal.items.find((a) => a.id === state.legalId);
  return `<section class="screen-view legal-screen" data-screen="legal">${statusBar()}${backHeader(a?.title || '약관', state.legalReturn)}<div class="consent-main">${title(a?.title || '약관')}<p class="field-help">버전 ${e(a?.version)}</p><div class="legal-copy">${e(a?.body || '문서를 불러오지 못했습니다.')}</div></div></section>`;
}
function renderPayout() {
  const p = product();
  if (!p) return shell('payout', empty('상품을 다시 선택해 주세요.', 'shop', '상품 보기'), 'shop');
  return `<section class="screen-view payout-screen" data-screen="payout">${statusBar()}${backHeader('지급 신청', 'exchange')}<div class="payout-content">${title('수령 정보 입력', demo ? '데모입니다. 실제 개인정보를 입력하지 마세요.' : '수령할 계정 정보를 정확히 입력해 주세요.')}<section class="card payout-summary"><p>${e(p.title)}</p><p class="number">${n(p.amount)}원</p><p>${e(p.deliveryNotice)}</p></section><form id="payout-form" class="payout-form"><div class="form-field"><label for="phone">휴대폰 번호</label><input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="13" placeholder="01012345678" required></div><div class="form-field"><label for="name">이름</label><input id="name" name="name" autocomplete="name" maxlength="40" required></div></form><button class="link-button" type="button" data-legal="reward">지급 안내 및 개인정보 동의 내용 보기</button></div><label class="payout-consent"><input id="payout-agree" type="checkbox"><span>지급 안내 및 개인정보 처리에 동의합니다. (필수)</span></label><button id="payout-submit" class="primary-button payout-action" type="button" disabled>${demo ? '데모 교환 신청' : '지급 신청하기'}</button><p class="fraud-note">신청 결과는 교환 내역에서 확인할 수 있습니다.</p></section>`;
}
const renderers = {
  splash: renderSplash,
  signup: renderSignup,
  consent: renderConsent,
  home: renderHome,
  'stock-select': renderStockSelect,
  prediction: renderPrediction,
  confirm: renderConfirm,
  submitted: renderSubmitted,
  pass: renderPass,
  ad: renderAd,
  result: () => renderResults(),
  missions: renderMissions,
  shop: renderShop,
  exchange: renderExchange,
  history: renderHistory,
  profile: renderProfile,
  payout: renderPayout,
  'prediction-history': () => renderResults(true),
  wallet: renderWallet,
  settings: renderSettings,
  legal: renderLegal,
};

function notify(message) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  app.append(toast);
  setTimeout(() => toast.remove(), 5000);
}
function route(name) {
  if (busy) return;
  if (!['payout', 'legal'].includes(name)) state.payoutDraft = null;
  state.errors = '';
  if (name === 'confirm') {
    if (!stock() || !isOpen() || !totalTickets() || todayPrediction(stock().code)) {
      notify('예측 상태를 다시 확인해 주세요.');
      return;
    }
    state.attempt = { stockCode: stock().code, direction: state.direction, key: crypto.randomUUID() };
  }
  if (name !== 'ad') state.ad = null;
  if (location.hash === `#${name}`) render();
  else location.hash = name;
}
function render() {
  clearInterval(adTimer);
  const active = routeName();
  if (loading) {
    app.innerHTML =
      '<section class="screen-view"><div class="loading-state" role="status">불러오는 중…</div></section>';
    return;
  }
  if (fatal) {
    app.innerHTML = `<section class="screen-view"><div class="empty-state" role="alert"><h1>잠시 연결하지 못했어요</h1><p>${e(state.errors || errorMessage(fatal))}</p><button id="retry" class="primary-button" type="button">다시 시도</button></div></section>`;
    document.getElementById('retry').onclick = () => initialize();
    return;
  }
  const publicRoute = ['splash', 'signup', 'legal'].includes(active);
  if (!session?.user && !publicRoute) {
    location.replace('#signup');
    return;
  }
  if (session?.user?.consentRequired && !['splash', 'signup', 'consent', 'legal'].includes(active)) {
    location.replace('#consent');
    return;
  }
  if (!data && !['splash', 'signup', 'consent', 'legal'].includes(active)) {
    initialize();
    return;
  }
  app.innerHTML = renderers[active]();
  picker.innerHTML = demo
    ? screens
        .map(
          ([id, label]) =>
            `<button type="button" data-route="${id}"${active === id ? ' aria-current="page"' : ''}>${label}</button>`
        )
        .join('')
    : '';
  document.querySelector('.prototype-panel').hidden = !demo;
  document.querySelector('.prototype-shell').classList.toggle('live-shell', !demo);
  document.title = `Candle · ${screens.find(([id]) => id === active)[1]}`;
  bind();
  if (state.errors) showError(state.errors);
  if (active === 'ad' && demo && state.ad) {
    const update = () => {
      const remaining = Math.max(0, 15 - Math.floor((Date.now() - state.ad.startedAt) / 1000));
      const count = document.getElementById('ad-countdown');
      if (count) count.textContent = `${remaining}초`;
      const verify = document.getElementById('verify-ad');
      if (verify) verify.disabled = remaining > 0;
    };
    update();
    adTimer = setInterval(update, 250);
  }
}
function showError(message) {
  let box = document.getElementById('action-error');
  if (!box) {
    box = document.createElement('div');
    box.id = 'action-error';
    box.className = 'action-error';
    box.setAttribute('role', 'alert');
    app.append(box);
  }
  box.textContent = message;
}
function expireSession() {
  data = null;
  session = { user: null, providers: session?.providers || [] };
  state.attempt = null;
  state.receiptId = null;
  state.payoutDraft = null;
  state.operation = null;
  state.ad = null;
  state.consent = {};
  try {
    sessionStorage.removeItem('candle.pending-operations.v1');
  } catch {}
  busy = false;
  location.replace('#signup');
  render();
}
async function initialize() {
  const seq = ++revision;
  loading = true;
  fatal = null;
  state.errors = '';
  render();
  try {
    const [nextSession, nextLegal] = await Promise.all([service.session(), service.legal()]);
    if (seq !== revision) return;
    session = nextSession;
    legal = nextLegal;
    const nextData = nextSession.user && !nextSession.user.consentRequired ? await service.load() : null;
    if (seq !== revision) return;
    session = nextSession;
    legal = nextLegal;
    data = nextData;
    loadedAt = performance.now();
    state.stockCode = data?.stocks.some((s) => s.code === state.stockCode)
      ? state.stockCode
      : data?.stocks[0]?.code;
  } catch (error) {
    if (seq === revision) {
      if (error.code === 'SESSION_EXPIRED') {
        expireSession();
      } else fatal = error;
    }
  } finally {
    if (seq === revision) {
      loading = false;
      render();
    }
  }
}
async function action(name, body, destination, onSuccess) {
  if (busy) return;
  // Retain the same key after an unknown network outcome, including across a reload.
  // Store only a fingerprint for non-PII payloads; reward retries use a non-PII product ID.
  const fingerprint = JSON.stringify(name === 'reward' ? { rewardId: body.rewardId } : body);
  const storageKey = 'candle.pending-operations.v1';
  const identity = JSON.stringify([session?.user?.id, name, fingerprint]);
  let operations = state.operation || {};
  try {
    operations = JSON.parse(sessionStorage.getItem(storageKey) || 'null') || operations;
  } catch {}
  const pending = operations[identity] || {
    key: name === 'prediction' ? state.attempt.key : crypto.randomUUID(),
  };
  operations[identity] = pending;
  state.operation = operations;
  const persist = () => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(operations));
    } catch {}
  };
  persist();
  busy = true;
  state.errors = '';
  document.getElementById('action-error')?.remove();
  app.setAttribute('aria-busy', 'true');
  document.querySelectorAll('button').forEach((b) => {
    b.dataset.wasDisabled = String(b.disabled);
    b.disabled = true;
  });
  let committed = false;
  try {
    const result = await service.mutate(name, body, pending.key);
    if ((name === 'prediction' || name === 'reward' || name === 'adStart') && typeof result?.id !== 'string')
      throw new ApiError('INVALID_RESPONSE');
    if (name === 'adComplete' && result?.status !== 'VERIFIED') throw new ApiError('AD_NOT_VERIFIED');
    committed = true;
    delete operations[identity];
    persist();
    if (onSuccess) onSuccess(result);
    if (name === 'logout') {
      session = null;
      data = null;
      state.attempt = null;
      state.receiptId = null;
      state.payoutDraft = null;
      state.operation = null;
      try {
        sessionStorage.removeItem(storageKey);
      } catch {}
    }
    if (name !== 'adStart') {
      session = await service.session();
      data = session.user && !session.user.consentRequired ? await service.load() : null;
      loadedAt = performance.now();
    }
    busy = false;
    if (destination) route(destination);
    else render();
  } catch (error) {
    if (error.code === 'SESSION_EXPIRED') {
      expireSession();
      notify(errorMessage(error));
    } else {
      if (error.status >= 400 && error.status < 500 && error.status !== 408) {
        delete operations[identity];
        persist();
      }
      state.errors = committed
        ? '처리는 완료되었지만 최신 내역을 불러오지 못했어요. 새로고침해 내역을 확인해 주세요.'
        : errorMessage(error);
      if (committed) {
        fatal = new ApiError('NETWORK_ERROR');
        render();
      } else showError(state.errors);
    }
  } finally {
    busy = false;
    app.removeAttribute('aria-busy');
    document.querySelectorAll('button[data-was-disabled]').forEach((b) => {
      b.disabled = b.dataset.wasDisabled === 'true';
      delete b.dataset.wasDisabled;
    });
  }
}
function bind() {
  document.querySelectorAll('[data-route]').forEach((b) => (b.onclick = () => route(b.dataset.route)));
  document.querySelectorAll('[data-login]').forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          if (demo) {
            await service.login();
            session = await service.session();
            route('consent');
          } else location.assign(service.loginUrl(b.dataset.login));
        } catch (error) {
          showError(errorMessage(error));
        }
      })
  );
  document.querySelectorAll('[data-more]').forEach(
    (b) =>
      (b.onclick = async () => {
        const kind = b.dataset.more;
        b.disabled = true;
        try {
          const page = await service.page(kind, data[kind].nextCursor);
          if (!Array.isArray(page?.items)) throw new ApiError('INVALID_RESPONSE');
          const existing = new Set(data[kind].items.map((x) => x.id));
          const next = {
            ...data,
            [kind]: {
              ...data[kind],
              items: [...data[kind].items, ...page.items.filter((x) => !existing.has(x.id))],
              nextCursor: page.nextCursor,
            },
          };
          data = validateSnapshot(next);
          render();
        } catch (error) {
          if (error.code === 'SESSION_EXPIRED') expireSession();
          else {
            showError(errorMessage(error));
            b.disabled = false;
          }
        }
      })
  );
  document.querySelectorAll('[data-legal]').forEach(
    (b) =>
      (b.onclick = () => {
        state.legalId = b.dataset.legal;
        state.legalReturn = routeName();
        route('legal');
      })
  );
  document.querySelectorAll('[data-direction]').forEach(
    (b) =>
      (b.onclick = () => {
        state.direction = b.dataset.direction;
        if (routeName() === 'home') route('prediction');
        else {
          const y = app.querySelector('.content').scrollTop;
          render();
          app.querySelector('.content').scrollTop = y;
          app.querySelector(`[data-direction="${state.direction}"]`).focus({ preventScroll: true });
        }
      })
  );
  document.querySelectorAll('[data-stock-picker]').forEach(
    (b) =>
      (b.onclick = () => {
        state.stockReturn = routeName();
        state.search = '';
        route('stock-select');
      })
  );
  document.querySelectorAll('[data-stock-code]').forEach(
    (b) =>
      (b.onclick = () => {
        state.stockCode = b.dataset.stockCode;
        state.attempt = null;
        route(state.stockReturn);
      })
  );
  document.querySelectorAll('[data-market]').forEach(
    (b) =>
      (b.onclick = () => {
        state.market = b.dataset.market;
        render();
      })
  );
  const search = document.getElementById('stock-search-input');
  if (search)
    search.oninput = () => {
      state.search = search.value;
      const position = search.selectionStart;
      render();
      const input = document.getElementById('stock-search-input');
      input.focus();
      input.setSelectionRange(position, position);
    };
  document.querySelectorAll('[data-product]').forEach(
    (b) =>
      (b.onclick = () => {
        state.productId = b.dataset.product;
        route('exchange');
      })
  );
  const all = document.getElementById('agree-all'),
    consent = document.getElementById('consent-submit');
  if (all && consent) {
    const sync = () => {
      all.checked = legal.items.every((a) => state.consent[a.id]);
      all.indeterminate = !all.checked && legal.items.some((a) => state.consent[a.id]);
      consent.disabled = !legal.items.filter((a) => a.required).every((a) => state.consent[a.id]);
    };
    all.onchange = () => {
      legal.items.forEach((a) => (state.consent[a.id] = all.checked));
      document.querySelectorAll('[data-agreement]').forEach((c) => (c.checked = all.checked));
      sync();
    };
    document.querySelectorAll('[data-agreement]').forEach(
      (c) =>
        (c.onchange = () => {
          state.consent[c.dataset.agreement] = c.checked;
          sync();
        })
    );
    sync();
    consent.onclick = () =>
      action(
        'consent',
        {
          agreements: legal.items.map((a) => ({
            id: a.id,
            version: a.version,
            accepted: !!state.consent[a.id],
          })),
        },
        'home'
      );
  }
  document.getElementById('submit-prediction')?.addEventListener('click', () => {
    if (!state.attempt || !isOpen()) {
      notify('예측 마감 상태를 다시 확인해 주세요.');
      return;
    }
    action(
      'prediction',
      { stockCode: state.attempt.stockCode, direction: state.attempt.direction },
      'submitted',
      (result) => (state.receiptId = result.id)
    );
  });
  document.getElementById('attendance')?.addEventListener('click', () => action('attendance', {}, null));
  document
    .querySelectorAll('[data-claim]')
    .forEach((b) => (b.onclick = () => action('claim', { predictionId: b.dataset.claim }, null)));
  document.getElementById('logout')?.addEventListener('click', () => action('logout', {}, 'signup'));
  document.getElementById('watch-ad')?.addEventListener('click', () =>
    action('adStart', {}, 'ad', (result) => {
      if (!demo) {
        const url = new URL(result.launchUrl);
        if (url.protocol !== 'https:') throw new ApiError('INVALID_RESPONSE');
      }
      state.ad = { ...result, startedAt: Date.now() };
    })
  );
  document
    .getElementById('verify-ad')
    ?.addEventListener('click', () => action('adComplete', { sessionId: state.ad.id }, 'pass'));
  const phone = document.getElementById('phone'),
    name = document.getElementById('name'),
    agree = document.getElementById('payout-agree'),
    submit = document.getElementById('payout-submit');
  if (phone && name && agree && submit) {
    const valid = () =>
      /^010\d{8}$/.test(phone.value.replace(/[\s-]/g, '')) &&
      name.value.trim().length >= 2 &&
      name.value.trim().length <= 40 &&
      agree.checked &&
      product().available &&
      data.wallet.balance >= product().points;
    if (state.payoutDraft) {
      phone.value = state.payoutDraft.phone;
      name.value = state.payoutDraft.name;
      agree.checked = state.payoutDraft.agreed;
    }
    const sync = () => {
      submit.disabled = !valid();
      state.payoutDraft = { phone: phone.value, name: name.value, agreed: agree.checked };
    };
    [phone, name, agree].forEach((x) => (x.oninput = sync));
    agree.onchange = sync;
    sync();
    document.getElementById('payout-form').onsubmit = (event) => {
      event.preventDefault();
      if (valid()) submit.click();
    };
    submit.onclick = () => {
      if (valid())
        action(
          'reward',
          {
            rewardId: product().id,
            recipient: { phone: phone.value.replace(/[\s-]/g, ''), name: name.value.trim() },
            agreementVersion: product().agreementVersion,
          },
          'history'
        );
    };
  }
}
window.addEventListener('hashchange', () => {
  if (!busy) {
    state.errors = '';
    if (!['payout', 'legal'].includes(routeName())) state.payoutDraft = null;
    if (
      data &&
      performance.now() - loadedAt > 30000 &&
      !['payout', 'consent', 'legal', 'ad', 'confirm'].includes(routeName())
    )
      initialize();
    else render();
    app.querySelector('h1')?.focus({ preventScroll: true });
  }
});
document.addEventListener('visibilitychange', () => {
  if (
    !document.hidden &&
    !busy &&
    data &&
    performance.now() - loadedAt > 30000 &&
    !['payout', 'consent', 'legal', 'ad', 'confirm'].includes(routeName())
  )
    initialize();
});
window.addEventListener('online', () => {
  if (fatal) initialize();
});
window.addEventListener('storage', (event) => {
  if (
    demo &&
    event.key?.startsWith('candle.') &&
    !busy &&
    !['payout', 'consent', 'legal', 'ad'].includes(routeName())
  )
    initialize();
});
await initialize();
