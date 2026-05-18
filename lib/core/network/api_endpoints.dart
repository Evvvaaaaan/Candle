abstract final class ApiEndpoints {
  // Spring Boot 서버 baseUrl - 환경에 따라 변경
  static const String baseUrl = 'https://api.candle.app';

  // Auth
  static const String kakaoLogin = '/auth/kakao';
  static const String setNickname = '/auth/nickname';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';

  // Stocks
  static const String stocks = '/stocks';
  static const String stockSearch = '/stocks/search';

  // Predictions
  static const String predictions = '/predictions';
  static const String todayPrediction = '/predictions/today';
  static const String predictionResult = '/predictions/result';
  static const String predictionHistory = '/predictions/history';
  static const String watchAd = '/predictions/watch-ad';

  // Rankings
  static const String streakRanking = '/rankings/streak';
  static const String winrateRanking = '/rankings/winrate';

  // User
  static const String myProfile = '/users/me';
}
