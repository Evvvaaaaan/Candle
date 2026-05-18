import '../../domain/entities/stock.dart';

class StockModel extends Stock {
  const StockModel({
    required super.ticker,
    required super.name,
    required super.currentPrice,
    required super.changeRate,
    required super.changePrice,
  });

  factory StockModel.fromJson(Map<String, dynamic> json) => StockModel(
        ticker: json['ticker'] as String,
        name: json['name'] as String,
        currentPrice: json['currentPrice'] as int,
        changeRate: (json['changeRate'] as num).toDouble(),
        changePrice: json['changePrice'] as int,
      );

  Map<String, dynamic> toJson() => {
        'ticker': ticker,
        'name': name,
        'currentPrice': currentPrice,
        'changeRate': changeRate,
        'changePrice': changePrice,
      };

  // Mock data: KRX 시가총액 상위 20개 종목
  static List<StockModel> get mockTopStocks => const [
        StockModel(ticker: '005930', name: '삼성전자', currentPrice: 73400, changeRate: 1.24, changePrice: 900),
        StockModel(ticker: '000660', name: 'SK하이닉스', currentPrice: 198500, changeRate: -0.75, changePrice: -1500),
        StockModel(ticker: '035420', name: 'NAVER', currentPrice: 213500, changeRate: 0.47, changePrice: 1000),
        StockModel(ticker: '005490', name: 'POSCO홀딩스', currentPrice: 394000, changeRate: 2.08, changePrice: 8000),
        StockModel(ticker: '000270', name: '기아', currentPrice: 89800, changeRate: -1.32, changePrice: -1200),
        StockModel(ticker: '005380', name: '현대차', currentPrice: 218000, changeRate: 0.93, changePrice: 2000),
        StockModel(ticker: '068270', name: '셀트리온', currentPrice: 187500, changeRate: -0.53, changePrice: -1000),
        StockModel(ticker: '051910', name: 'LG화학', currentPrice: 312000, changeRate: 1.63, changePrice: 5000),
        StockModel(ticker: '028260', name: '삼성물산', currentPrice: 142000, changeRate: 0.35, changePrice: 500),
        StockModel(ticker: '012330', name: '현대모비스', currentPrice: 238500, changeRate: -0.21, changePrice: -500),
        StockModel(ticker: '017670', name: 'SK텔레콤', currentPrice: 52300, changeRate: 0.58, changePrice: 300),
        StockModel(ticker: '030200', name: 'KT', currentPrice: 39250, changeRate: 1.17, changePrice: 450),
        StockModel(ticker: '032830', name: '삼성생명', currentPrice: 94500, changeRate: -0.53, changePrice: -500),
        StockModel(ticker: '034730', name: 'SK', currentPrice: 172500, changeRate: 0.87, changePrice: 1500),
        StockModel(ticker: '066570', name: 'LG전자', currentPrice: 91400, changeRate: 1.11, changePrice: 1000),
        StockModel(ticker: '003550', name: 'LG', currentPrice: 78200, changeRate: -0.25, changePrice: -200),
        StockModel(ticker: '086900', name: '메디톡스', currentPrice: 156000, changeRate: 2.63, changePrice: 4000),
        StockModel(ticker: '018260', name: '삼성에스디에스', currentPrice: 147000, changeRate: 0.68, changePrice: 1000),
        StockModel(ticker: '096770', name: 'SK이노베이션', currentPrice: 115500, changeRate: -1.28, changePrice: -1500),
        StockModel(ticker: '015760', name: '한국전력', currentPrice: 21350, changeRate: 0.71, changePrice: 150),
      ];
}
