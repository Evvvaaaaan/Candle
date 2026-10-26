/* Professor-compatible transport. UI and business rules live outside this file. */
var baseUrlForAjax = window.CANDLE_BACKEND_CONFIG.baseUrl.replace(/\/$/, '');
var refreshRequest = null;
function isMissingToken(value) {
  return value == null || ['', 'null', 'undefined'].includes(String(value));
}
function isNull(value) {
  return isMissingToken(value);
}
function candleSessionIdentity() {
  return localStorage.getItem('candle.session') || 'anonymous';
}
function clearCandleSession() {
  localStorage.setItem('candle.session', crypto.randomUUID());
  for (const key of ['accessToken', 'refreshToken']) {
    flutter_setLocalStorage(key, null);
    localStorage.removeItem(key);
  }
  sessionStorage.removeItem('candle.selection');
  sessionStorage.removeItem('candle.watchlist');
}
function listener_logout() {
  clearCandleSession();
}
function authExpired() {
  clearCandleSession();
  // 디자인 확인 모드에서는 로그인 화면으로 되돌리지 않습니다.
  if (localStorage.getItem('candle.preview') === '1') return;
  window.CandleAuth?.expired();
}
function listenerGetAccessToken(callback) {
  const token = localStorage.getItem('refreshToken');
  const identity = candleSessionIdentity();
  const active = () =>
    identity === candleSessionIdentity() && token === localStorage.getItem('refreshToken');
  if (!refreshRequest || refreshRequest.identity !== identity || refreshRequest.token !== token) {
    const promise = new Promise((resolve, reject) => {
      if (isMissingToken(token)) {
        reject({ status: 401 });
        return;
      }
      $.ajax({
        url: baseUrlForAjax + '/api/auth',
        method: 'POST',
        headers: { RefreshToken: token },
        contentType: 'application/json; charset=utf-8',
        timeout: 12000,
        success(body, status, xhr) {
          if (!active()) {
            reject({ status: -1 });
            return;
          }
          const access = xhr.getResponseHeader('Authorization');
          if (isMissingToken(access)) {
            reject({ status: 502 });
            return;
          }
          flutter_setLocalStorage('accessToken', access);
          resolve({ body, status, xhr });
        },
        error(xhr) {
          reject(active() ? xhr : { status: -1 });
        },
      });
    });
    refreshRequest = { promise, identity, token };
    const cleanup = () => {
      if (refreshRequest?.promise === promise) refreshRequest = null;
    };
    promise.then(cleanup, cleanup);
  }
  refreshRequest.promise.then(
    ({ body, status, xhr }) => {
      if (active()) callback.success?.(body, status, xhr);
      else callback.error?.({ status: -1 });
    },
    (xhr) => {
      if (active() && [401, 403, 406].includes(xhr.status)) authExpired();
      callback.error?.(xhr);
    }
  );
}
function func_ajax(options) {
  if (options.identity == null) options.identity = candleSessionIdentity();
  const active = () => options.identity === candleSessionIdentity();
  if (!active()) {
    options.error?.({ status: -1 });
    return;
  }
  const token = localStorage.getItem('accessToken');
  const form = options.contentType != null;
  const data =
    options.param == null
      ? null
      : options.type === 'GET'
        ? $.param(options.param)
        : form
          ? options.param
          : JSON.stringify(options.param);
  $.ajax({
    url: baseUrlForAjax + options.url,
    type: options.type,
    headers: isMissingToken(token) ? {} : { Authorization: token },
    contentType: form ? false : 'application/json; charset=utf-8',
    data,
    processData: false,
    cache: false,
    timeout: 12000,
    success(body, status, xhr) {
      if (active()) options.success?.(body, status, xhr);
      else options.error?.({ status: -1 });
    },
    error(xhr, status, error) {
      if (!active()) {
        options.error?.({ status: -1 });
        return;
      }
      if (xhr.status === 401 && !options.retry && !options.url.startsWith('/api/user/')) {
        options.retry = true;
        if (token !== localStorage.getItem('accessToken')) func_ajax(options);
        else access_token(options);
        return;
      }
      if ([401, 403, 406].includes(xhr.status) && !options.url.startsWith('/api/user/'))
        authExpired();
      options.error?.(xhr, status, error);
    },
  });
}
function access_token(options) {
  listenerGetAccessToken({
    success: () => func_ajax(options),
    error: (xhr) => options.error?.(xhr),
  });
}
