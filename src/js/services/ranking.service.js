/**
 * 랭킹 서비스
 */
const RankingService = {
  MOCK_STREAK: {
    myRank: { rank: 243, nickname: '사용자닉네임', streak: 7, change: 12 },
    top3: [
      { rank: 1, name: '주식천재', streak: 89 },
      { rank: 2, name: '강남불개미', streak: 67 },
      { rank: 3, name: '코스피마스터', streak: 45 },
    ],
    list: [
      { rank: 4, name: '여의도고래', streak: 42 },
      { rank: 5, name: '스나이퍼', streak: 38 },
      { rank: 6, name: '단타의신', streak: 35 },
      { rank: 7, name: '존버가답이다', streak: 31 },
      { rank: 8, name: '수익률1000', streak: 29 },
      { rank: 9, name: '상한가요정', streak: 25 },
      { rank: 10, name: '워렌버핏동생', streak: 22 },
    ],
  },

  MOCK_WINRATE: {
    myRank: { rank: 87, nickname: '사용자닉네임', winRate: 67.5, wins: 27, total: 40, change: -5 },
    top3: [
      { rank: 1, name: '예측마스터', winRate: 94.7, wins: 36, total: 38 },
      { rank: 2, name: '정확도왕', winRate: 91.3, wins: 42, total: 46 },
      { rank: 3, name: '프리딕터', winRate: 88.2, wins: 45, total: 51 },
    ],
    list: [
      { rank: 4, name: '코스피지킴이', winRate: 85.7, wins: 36, total: 42 },
      { rank: 5, name: '시장읽는남자', winRate: 83.3, wins: 40, total: 48 },
      { rank: 6, name: '차트분석가', winRate: 81.0, wins: 34, total: 42 },
      { rank: 7, name: '패턴추적자', winRate: 78.6, wins: 44, total: 56 },
      { rank: 8, name: '트렌드헌터', winRate: 76.5, wins: 39, total: 51 },
      { rank: 9, name: '수익률전문', winRate: 74.2, wins: 46, total: 62 },
      { rank: 10, name: '테크니컬러', winRate: 71.4, wins: 35, total: 49 },
    ],
  },

  async getStreakRanking() {
    if (API_CONFIG.USE_MOCK) return api.mock(this.MOCK_STREAK);
    return api.get('/ranking/streak');
  },

  async getWinrateRanking() {
    if (API_CONFIG.USE_MOCK) return api.mock(this.MOCK_WINRATE);
    return api.get('/ranking/winrate');
  },
};
