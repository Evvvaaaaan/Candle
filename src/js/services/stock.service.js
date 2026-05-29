/**
 * 주식 서비스
 * USE_MOCK = false 시: 한국투자증권 API 또는 Spring Boot BFF 호출
 */
const StockService = {
  MOCK_STOCKS: [
    { code: '005930', name: '삼성전자' },
    { code: '000660', name: 'SK하이닉스' },
    { code: '373220', name: 'LG에너지솔루션' },
    { code: '207940', name: '삼성바이오로직스' },
    { code: '005490', name: 'POSCO홀딩스' },
    { code: '035420', name: 'NAVER' },
    { code: '005380', name: '현대차' },
    { code: '006400', name: '삼성SDI' },
    { code: '051910', name: 'LG화학' },
    { code: '035720', name: '카카오' },
    { code: '068270', name: '셀트리온' },
    { code: '028260', name: '삼성물산' },
    { code: '105560', name: 'KB금융' },
    { code: '055550', name: '신한지주' },
    { code: '096770', name: 'SK이노베이션' },
    { code: '003670', name: '포스코퓨처엠' },
    { code: '012330', name: '현대모비스' },
    { code: '066570', name: 'LG전자' },
    { code: '086790', name: '하나금융지주' },
    { code: '033780', name: 'KT&G' },
  ],

  async getTopStocks() {
    if (API_CONFIG.USE_MOCK) {
      return api.mock(this.MOCK_STOCKS);
    }
    return api.get('/stocks/top');
  },

  async getPrices(codes) {
    if (API_CONFIG.USE_MOCK) {
      const priced = codes.map(stock => ({
        ...stock,
        currentPrice: Math.floor(Math.random() * 100000) + 10000,
        changeRate: (Math.random() - 0.5) * 10,
      }));
      return api.mock(priced, 800);
    }
    return api.post('/stocks/prices', { codes });
  },

  async search(query) {
    if (API_CONFIG.USE_MOCK) {
      const lower = query.toLowerCase();
      const results = this.MOCK_STOCKS.filter(s =>
        s.name.toLowerCase().includes(lower) || s.code.includes(query)
      );
      return api.mock(results, 300);
    }
    return api.get(`/stocks/search?q=${encodeURIComponent(query)}`);
  },
};
