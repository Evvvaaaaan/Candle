import 'package:equatable/equatable.dart';

enum PredictionDirection { up, down }

enum PredictionStatus { pending, correct, wrong, noResult }

enum DayState { success, fail, pending, future }

class Prediction extends Equatable {
  const Prediction({
    required this.id,
    required this.ticker,
    required this.stockName,
    required this.direction,
    required this.status,
    required this.predictionPrice,
    this.resultPrice,
    this.streak,
    required this.date,
  });

  final String id;
  final String ticker;
  final String stockName;
  final PredictionDirection direction;
  final PredictionStatus status;
  final int predictionPrice;
  final int? resultPrice;
  final int? streak;
  final DateTime date;

  @override
  List<Object?> get props =>
      [id, ticker, direction, status, predictionPrice, resultPrice, streak, date];
}

class DayHistory extends Equatable {
  const DayHistory({required this.date, required this.state});

  final DateTime date;
  final DayState state;

  @override
  List<Object?> get props => [date, state];
}
