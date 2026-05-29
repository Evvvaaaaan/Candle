/**
 * 인증 서비스
 * USE_MOCK = false 시: api.post() 호출로 자동 전환
 */
const AuthService = {
  async kakaoLogin(kakaoToken) {
    if (API_CONFIG.USE_MOCK) {
      return api.mock({ token: 'mock_jwt_token', isNewUser: true });
    }
    return api.post('/auth/kakao', { kakaoToken });
  },

  async checkNickname(nickname) {
    if (API_CONFIG.USE_MOCK) {
      const isDuplicate = nickname.includes('중복') || nickname.toLowerCase() === 'admin';
      return api.mock({ available: !isDuplicate });
    }
    return api.get(`/auth/nickname/check?nickname=${encodeURIComponent(nickname)}`);
  },

  async setNickname(nickname) {
    if (API_CONFIG.USE_MOCK) {
      Storage.set('user_nickname', nickname);
      return api.mock({ success: true });
    }
    return api.post('/auth/nickname', { nickname });
  },

  logout() {
    Storage.remove('auth_token');
    Storage.remove('user_nickname');
    Router.go('../pages/login.html');
  },
};
