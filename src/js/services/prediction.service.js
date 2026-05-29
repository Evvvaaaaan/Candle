/**
 * 예측 서비스
 */
const PredictionService = {
  async submitPrediction(ticker, direction) {
    if (API_CONFIG.USE_MOCK) {
      Storage.set('last_prediction', { ticker, direction, date: new Date().toISOString() });
      return api.mock({ success: true });
    }
    return api.post('/predictions', { ticker, direction });
  },

  async getResult(date) {
    if (API_CONFIG.USE_MOCK) {
      return api.mock({
        isCorrect: Math.random() > 0.4,
        stockName: '삼성전자',
        prediction: 'up',
        actualDirection: 'up',
        changeRate: 1.2,
        streak: 7,
        totalAccuracy: 72,
        globalAccuracy: 58,
      }, 2000);
    }
    return api.get(`/predictions/result?date=${date}`);
  },

  async getUserHistory() {
    if (API_CONFIG.USE_MOCK) {
      return api.mock([]);
    }
    return api.get('/predictions/history');
  },
};
