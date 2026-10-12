import { uiIcon } from './ui/icons.mjs';
import renderRewardAdSheet from './ui/reward-ad-sheet.mjs';
import { recipientValue, validRecipient, validateChallengeReward } from './challenge-reward.mjs';
import { pages, screens } from './screens/index.mjs';
import { ApiError, errorMessage } from './api-client.mjs';
import { createCandleService, resolveConfig, validateSnapshot } from './candle-service.mjs';

const config = resolveConfig(window.CANDLE_CONFIG);
const service =
  config.mode === 'demo'
    ? (await import('./demo-service.mjs')).createDemoService()
    : createCandleService(config);
const demo = service.mode === 'demo';
const app = document.getElementById('app');

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
  adReturn: 'prediction',
  legalId: 'terms',
  legalReturn: 'settings',
  consent: {},
  payoutDraft: null,
  operation: null,
  errors: '',
  challengeReward: null,
  rewardError: '',
};
let rewardLoading = false,
  rewardRevision = 0,
  rewardLoadedAt = 0;
const e = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
const n = (value) => Number(value).toLocaleString('ko-KR');
const icon = (name) => `./src/assets/core-flow/${name}`;
const routeName = () =>
  screens.some(([id]) => id === location.hash.slice(1))
    ? location.hash.slice(1)
    : session?.user
      ? session.user.consentRequired
        ? 'consent'
        : 'home'
      : 'signup';
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
  `<div class="empty-state"><span class="icon-tile empty-icon">${uiIcon('inbox')}</span><p>${e(text)}</p>${button(action, route, 'secondary-button')}</div>`;
const statusBar = () => '<div class="status-bar" aria-hidden="true"></div>';
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
const pointsCard = (showHistory = true) =>
  `<section class="card points-card"><div class="points-copy"><p class="card-label">보유 포인트</p><p class="number">${n(data.wallet.balance)} P</p></div>${showHistory ? button('내역 보기 ›', 'wallet', 'link-button') : `<span class="icon-tile points-icon">${uiIcon('coin')}</span>`}</section>`;
const ticketSummary = () =>
  `<span class="ticket-breakdown"><span>기본 무료 <strong>${n(data.tickets.free)}회</strong></span><span>광고 예측권 <strong>${n(data.tickets.ad)}장</strong></span></span>`;
const ticketCard = () =>
  `<button class="ticket-card" type="button" data-route="pass"><span class="row-between"><span>사용 가능한 예측권</span><strong class="ticket-total">${n(totalTickets())}회</strong></span>${ticketSummary()}</button>`;
const rewardAdButton = (label = '광고 보고 예측권 받기', disabled = false) => {
  const available = data.tickets.adCount < data.tickets.adLimit;
  return `<button class="primary-button" type="button" data-reward-ad${disabled || !available ? ' disabled' : ''}>${available ? e(label) : '오늘 광고 참여를 모두 마쳤어요'}</button>`;
};
const directionCard = (direction, disabled = false) =>
  `<button class="direction-card${state.direction === direction ? ' selected' : ''}" type="button" data-direction="${direction}" aria-pressed="${state.direction === direction}"${disabled ? ' disabled' : ''}><span class="direction-icon${direction === 'down' ? ' down' : ''}"><img src="${icon(direction === 'up' ? 'arrow-up.svg' : 'arrow-down.svg')}" alt=""></span><span><span class="direction-title">${direction === 'up' ? '상승' : '하락'}</span><span class="direction-caption">${direction === 'up' ? '오를 것 같아요' : '내릴 것 같아요'}</span></span></button>`;
function stockCard(changeable = true) {
  const s = stock();
  if (!s) return empty('지금 조회 가능한 종목이 없어요.');
  return `<section class="card stock-card"><div class="stock-top"><div><p class="card-label">선택한 종목</p><p class="stock-name">${e(s.name)}</p><p class="card-label">${e(s.code)} · ${e(s.market)}</p></div>${changeable ? '<button class="stock-change" type="button" data-stock-picker>종목 변경</button>' : ''}</div><div class="quote-row"><span>조회 가격 ${e(s.price)}</span><span class="${s.change.startsWith('-') ? 'down-text' : 'up-text'}">${e(s.change)}</span></div><p class="card-label">조회 시점의 시세이며 실시간 가격과 차이가 있을 수 있습니다.</p></section>`;
}
function productCard(p, compact = false) {
  return `<${compact ? 'div' : 'button'} class="product-card${compact ? ' compact' : ''}"${compact ? '' : ` type="button" data-product="${e(p.id)}"${p.available ? '' : ' disabled'}`}><img class="npay-logo" src="${icon('npay-symbol.svg')}" width="56" height="56" alt="네이버페이"><span class="product-copy"><small>${e(p.title)}</small><strong>${n(p.amount)}원권</strong><span>${n(p.points)}P${p.available ? '' : ' · 준비 중'}</span></span>${compact ? '' : uiIcon('chevron', 'product-chevron')}</${compact ? 'div' : 'button'}>`;
}
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
  app.innerHTML = pages[active].render({
    e,
    n,
    icon,
    demo,
    session,
    data,
    legal,
    state,
    stock,
    product,
    totalTickets,
    todayPrediction,
    isOpen,
    button,
    empty,
    statusBar,
    header,
    backHeader,
    nav,
    title,
    more,
    shell,
    pointsCard,
    ticketSummary,
    ticketCard,
    rewardAdButton,
    directionCard,
    stockCard,
    productCard,
  });
  document.title = `Candle · ${screens.find(([id]) => id === active)[1]}`;
  bind();
  if (active === 'challenge-reward' && !state.challengeReward && !state.rewardError && !rewardLoading)
    loadChallengeReward();
  if (state.errors) showError(state.errors);
  if (active === 'ad' && demo && state.ad) {
    const update = () => {
      const remaining = Math.max(0, 15 - Math.floor((Date.now() - state.ad.startedAt) / 1000));
      const count = document.getElementById('ad-countdown');
      if (count) count.textContent = `${remaining}초`;
      const verify = document.getElementById('verify-ad');
      if (verify) verify.disabled = remaining > 0;
      if (remaining === 0 && !busy && !state.ad.autoChecked) {
        state.ad.autoChecked = true;
        verifyRewardAd();
      }
    };
    update();
    adTimer = setInterval(update, 250);
  }
}
function openRewardAd(trigger) {
  if (busy || document.getElementById('reward-ad-dialog')) return;
  const remaining = data.tickets.adLimit - data.tickets.adCount;
  if (remaining <= 0) return notify('오늘 광고 참여를 모두 마쳤어요.');
  state.adReturn = routeName();
  const dialog = document.createElement('dialog');
  dialog.id = 'reward-ad-dialog';
  dialog.className = 'reward-ad-dialog';
  dialog.setAttribute('aria-labelledby', 'reward-ad-title');
  dialog.setAttribute('aria-describedby', 'reward-ad-description');
  dialog.innerHTML = renderRewardAdSheet({ remaining, limit: data.tickets.adLimit, demo });
  app.append(dialog);
  const closeSheet = () => {
    dialog.close();
    dialog.remove();
    if (trigger.isConnected) trigger.focus({ preventScroll: true });
  };
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeSheet();
  });
  dialog.querySelector('#cancel-reward-ad').onclick = closeSheet;
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientY < rect.top || event.clientX < rect.left || event.clientX > rect.right)
    )
      closeSheet();
  });
  dialog.querySelector('#start-reward-ad').onclick = async () => {
    if (busy) return;
    closeSheet();
    // Reserve the window during the user gesture; blocked popups have a visible link fallback.
    const popup = demo ? null : window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    let started = false;
    await action('adStart', {}, 'ad', (result) => {
      if (!demo && new URL(result.launchUrl).protocol !== 'https:') throw new ApiError('INVALID_RESPONSE');
      state.ad = { ...result, startedAt: Date.now(), awaitingReturn: !!popup };
      if (popup && !popup.closed) popup.location.replace(result.launchUrl);
      started = true;
    });
    if (!started) popup?.close();
  };
  dialog.showModal();
}
async function verifyRewardAd() {
  if (busy || !state.ad || routeName() !== 'ad') return;
  state.ad.awaitingReturn = false;
  await action('adComplete', { sessionId: state.ad.id }, 'prediction');
  if (!state.ad && !fatal && session?.user && routeName() === 'prediction')
    notify('예측권을 받았어요. 선택한 종목으로 예측을 이어가세요.');
}
function checkReturningAd() {
  if (!demo && !document.hidden && state.ad?.awaitingReturn) verifyRewardAd();
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
  rewardRevision++;
  rewardLoading = false;
  state.challengeReward = null;
  state.rewardError = '';
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
  const fingerprint = JSON.stringify(
    name === 'reward'
      ? { rewardId: body.rewardId }
      : name === 'challengeReward'
        ? { awardId: body.awardId }
        : body
  );
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
    if (
      ['prediction', 'reward', 'challengeReward', 'adStart'].includes(name) &&
      typeof result?.id !== 'string'
    )
      throw new ApiError('INVALID_RESPONSE');
    if (name === 'adComplete' && result?.status !== 'VERIFIED') throw new ApiError('AD_NOT_VERIFIED');
    committed = true;
    delete operations[identity];
    persist();
    if (onSuccess) onSuccess(result);
    if (name === 'logout') {
      rewardRevision++;
      rewardLoading = false;
      state.challengeReward = null;
      state.rewardError = '';
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
async function loadChallengeReward() {
  if (rewardLoading) return;
  const seq = ++rewardRevision;
  rewardLoading = true;
  state.challengeReward = null;
  state.rewardError = '';
  if (routeName() === 'challenge-reward') render();
  try {
    const reward = validateChallengeReward(await service.challengeReward());
    if (seq !== rewardRevision) return;
    state.challengeReward = reward;
    rewardLoadedAt = performance.now();
  } catch (error) {
    if (seq !== rewardRevision) return;
    if (error.code === 'SESSION_EXPIRED') return expireSession();
    state.rewardError =
      error.status === 404 || error.status === 503
        ? '리워드 수령 안내를 준비 중이에요. 잠시 후 다시 확인해 주세요.'
        : errorMessage(error);
  } finally {
    if (seq === rewardRevision) {
      rewardLoading = false;
      if (routeName() === 'challenge-reward') render();
    }
  }
}
function bind() {
  document.getElementById('retry-reward')?.addEventListener('click', loadChallengeReward);
  const rewardForm = document.getElementById('challenge-reward-form');
  if (rewardForm)
    rewardForm.onsubmit = (event) => {
      event.preventDefault();
      if (busy) return;
      const r = state.challengeReward;
      const recipient = document.getElementById('reward-recipient');
      const confirm = document.getElementById('reward-confirm');
      const error = document.getElementById('reward-form-error');
      const reject = (message, input) => {
        error.textContent = message;
        if (input) {
          input.setAttribute('aria-invalid', 'true');
          input.focus();
        }
      };
      [recipient, confirm].forEach((input) => input.removeAttribute('aria-invalid'));
      if (r.status !== 'ELIGIBLE') return reject('수령 가능 여부를 다시 확인해 주세요.');
      if (Date.parse(r.claimDeadline) <= Date.parse(r.serverTime) + performance.now() - rewardLoadedAt)
        return reject('수령 신청 기간이 지났어요. 챌린지 안내에서 다시 확인해 주세요.');
      if (!validRecipient(r.method, recipient.value))
        return reject('올바른 수령 정보를 입력해 주세요.', recipient);
      const value = recipientValue(r.method, recipient.value);
      if (value !== recipientValue(r.method, confirm.value))
        return reject('두 번 입력한 수령 정보가 일치하지 않아요.', confirm);
      const agreements = r.agreements.map((a) => ({
        id: a.id,
        version: a.version,
        accepted: document.querySelector(`[data-reward-agreement="${a.id}"]`).checked,
      }));
      if (agreements.some((a) => !a.accepted) || !document.getElementById('reward-account-ready').checked)
        return reject('필수 동의와 네이버페이 이용 준비 여부를 확인해 주세요.');
      error.textContent = '';
      action(
        'challengeReward',
        {
          awardId: r.awardId,
          method: r.method,
          recipient: r.method === 'NAVER_ID' ? { naverId: value } : { phone: value },
          agreements,
          npayTermsConfirmed: true,
        },
        'challenge-reward',
        () => {
          state.challengeReward = null;
          state.rewardError = '';
          rewardForm.reset();
        }
      );
    };
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
  document.querySelectorAll('[data-reward-ad]').forEach((b) => (b.onclick = () => openRewardAd(b)));
  document.getElementById('verify-ad')?.addEventListener('click', verifyRewardAd);
  document.getElementById('open-reward-ad')?.addEventListener('click', () => {
    state.ad.awaitingReturn = true;
  });
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
    if (routeName() === 'challenge-reward') {
      state.challengeReward = null;
      state.rewardError = '';
    }
    state.errors = '';
    if (!['payout', 'legal'].includes(routeName())) state.payoutDraft = null;
    if (
      data &&
      performance.now() - loadedAt > 30000 &&
      !['payout', 'challenge-reward', 'consent', 'legal', 'ad', 'confirm'].includes(routeName())
    )
      initialize();
    else render();
    app.querySelector('h1')?.focus({ preventScroll: true });
  }
});
document.addEventListener('visibilitychange', () => {
  checkReturningAd();
  if (
    !document.hidden &&
    !busy &&
    data &&
    performance.now() - loadedAt > 30000 &&
    !['payout', 'challenge-reward', 'consent', 'legal', 'ad', 'confirm'].includes(routeName())
  )
    initialize();
});
window.addEventListener('focus', checkReturningAd);
window.addEventListener('online', () => {
  if (fatal) initialize();
});
window.addEventListener('storage', (event) => {
  if (
    demo &&
    event.key?.startsWith('candle.') &&
    !busy &&
    !['payout', 'challenge-reward', 'consent', 'legal', 'ad'].includes(routeName())
  )
    initialize();
});
await initialize();
