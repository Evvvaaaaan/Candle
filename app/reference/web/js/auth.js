/* Native credentials and page authentication. Tokens never travel in navigation URLs. */
(() => {
  'use strict';
  const ui = CandleUI,
    api = CandleApi;
  let active = false,
    busy = false,
    nativeLogin = null,
    acceptingStorage = false,
    restoreCallback;
  const initialIdentity = candleSessionIdentity();
  const invalidate = () => {
    acceptingStorage = false;
    nativeLogin = null;
    active = false;
    listener_logout();
  };
  const expired = () => {
    acceptingStorage = false;
    nativeLogin = null;
    active = false;
    location.replace('signup.html');
  };
  const logout = () => {
    invalidate();
    location.replace('signup.html');
  };
  const login = (provider) => {
    if (busy) return;
    if (localStorage.getItem('candle.preview') === '1') {
      location.replace('consent.html');
      return;
    }
    const channel = {
      kakao: 'KakaoLogin',
      naver: 'NaverLogin',
      google: 'GoogleLogin',
      apple: 'AppleLogin',
    }[provider];
    if (!window[channel]?.postMessage)
      return ui.announce(
        '소셜 로그인은 앱에서 이용할 수 있습니다. 브라우저에서는 개발용 임시 로그인을 사용해 주세요.'
      );
    invalidate();
    nativeLogin = { provider, identity: candleSessionIdentity() };
    window[channel].postMessage('login');
  };
  async function exchange(provider, payload) {
    if (busy) return;
    if (localStorage.getItem('candle.preview') === '1') {
      location.replace('consent.html');
      return;
    }
    busy = true;
    invalidate();
    const identity = candleSessionIdentity();
    try {
      await api.signIn(provider, payload);
      await api.session();
      if (identity === candleSessionIdentity()) location.replace('consent.html');
    } catch (error) {
      ui.report(error);
    } finally {
      busy = false;
    }
  }
  function receive(provider, payload) {
    if (
      !nativeLogin ||
      nativeLogin.provider !== provider ||
      nativeLogin.identity !== candleSessionIdentity()
    )
      return;
    nativeLogin = null;
    return exchange(provider, payload);
  }
  function tempLogin() {
    const username = ui.$('#input_username').value.trim(),
      password = ui.$('#input_password').value;
    if (!username) return ui.announce('ID를 입력해 주세요.');
    return exchange('temp', { username, password }).finally(() => {
      const input = ui.$('#input_password');
      if (input) input.value = '';
    });
  }
  const originalReceiver = window.receiveFromFlutter;
  window.receiveFromFlutter = (event) => {
    if (event?.type === 'localStorage' && ['refreshToken', 'accessToken'].includes(event.key)) {
      if (!acceptingStorage || event.key !== 'refreshToken') return;
      acceptingStorage = false;
      if (!isMissingToken(event.value)) flutter_setLocalStorage('refreshToken', event.value);
      restoreCallback?.();
      return;
    }
    originalReceiver(event);
  };
  flutter_listener_fcmtoken = (token) => {
    if (active) api.saveFcm(token).catch(ui.report);
  };
  flutter_listener_push = (value) => {
    if (isMissingToken(value)) return;
    const url = new URL(value, location.href),
      name = url.pathname.split('/').pop();
    const allowed =
      /^(index2?|signup|consent|home|stock-select|prediction2?|confirm|submitted|result|history|wallet|profile|settings|shop|exchange|payout|pass|ad|missions|challenge|challenge-reward|prediction-history|legal(?:-(?:age|terms|privacy|reward))?)\.html$/;
    if (allowed.test(name)) location.href = name + url.search;
    else flutter_openUrl(value);
  };
  Object.assign(window, {
    tempLogin,
    kakaoLogin: () => login('kakao'),
    naverLogin: () => login('naver'),
    googleLogin: () => login('google'),
    appleLogin: () => login('apple'),
    receiveKakaoToken: (accessToken) => receive('kakao', { accessToken }),
    receiveNaverToken: (accessToken) => receive('naver', { accessToken }),
    receiveGoogleCredential: (token, accessToken) => receive('google', { token, accessToken }),
    receiveAppleCredential: (authorizationCode, identityToken) =>
      receive('apple', { authorizationCode, identityToken }),
    listener_set_refrshToken: async (token) => {
      if (isMissingToken(token)) throw { status: 502 };
      flutter_setLocalStorage('refreshToken', token);
      await api.session();
      location.replace('consent.html');
    },
  });
  ui.$('#temp-login-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    tempLogin();
  });
  if (ui.page === 'signup')
    ui.$$('[data-requires-js]').forEach((input) => {
      input.disabled = false;
    });
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (button?.dataset.login) login(button.dataset.login);
    if (button?.id === 'logout') logout();
  });
  const ready = (async () => {
    if (ui.page === 'legal') return false;
    if (localStorage.getItem('candle.preview') === '1') {
      active = true;
      return true;
    }
    if (isMissingToken(localStorage.getItem('refreshToken'))) {
      await new Promise((resolve) => {
        restoreCallback = resolve;
        acceptingStorage = true;
        flutter_getLocalStorage('refreshToken');
      });
    }
    if (isMissingToken(localStorage.getItem('refreshToken'))) {
      if (!['signup', 'splash'].includes(ui.page)) location.replace('signup.html');
      return false;
    }
    try {
      await api.session();
      active = true;
      flutter_getFCMToken();
      if (['signup', 'splash'].includes(ui.page)) {
        location.replace('home.html');
        return false;
      }
      return true;
    } catch (error) {
      ui.report(error);
      return false;
    }
  })();
  window.addEventListener('storage', (event) => {
    if (event.key === 'candle.session' && initialIdentity !== candleSessionIdentity()) expired();
  });
  window.addEventListener('pagehide', () => {
    nativeLogin = null;
    acceptingStorage = false;
    active = false;
  });
  window.CandleAuth = { ready, login, logout, expired };
})();
