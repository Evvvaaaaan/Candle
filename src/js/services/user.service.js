/**
 * 유저 서비스
 */
const UserService = {
  MOCK_USER: {
    nickname: '주식고수123',
    joinDate: '2025-12-15',
    streak: 7,
    bestStreak: 42,
    accuracy: 72,
    totalPredictions: 127,
    correctPredictions: 91,
    points: 127500,
  },

  async getProfile() {
    if (API_CONFIG.USE_MOCK) return api.mock(this.MOCK_USER);
    return api.get('/users/me');
  },

  async updateNickname(nickname) {
    if (API_CONFIG.USE_MOCK) {
      Storage.set('user_nickname', nickname);
      return api.mock({ success: true });
    }
    return api.put('/users/me/nickname', { nickname });
  },
};
