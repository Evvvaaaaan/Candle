import 'package:equatable/equatable.dart';

class Stock extends Equatable {
  const Stock({
    required this.ticker,
    required this.name,
    required this.currentPrice,
    required this.changeRate,
    required this.changePrice,
  });

  final String ticker;
  final String name;
  final int currentPrice;
  final double changeRate;
  final int changePrice;

  bool get isUp => changeRate >= 0;

  @override
  List<Object?> get props => [ticker, name, currentPrice, changeRate, changePrice];
}
