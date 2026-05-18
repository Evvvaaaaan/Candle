import '../../domain/entities/prediction.dart';

class PredictionModel extends Prediction {
  const PredictionModel({
    required super.id,
    required super.ticker,
    required super.stockName,
    required super.direction,
    required super.status,
    required super.predictionPrice,
    super.resultPrice,
    super.streak,
    required super.date,
  });

  factory PredictionModel.fromJson(Map<String, dynamic> json) {
    return PredictionModel(
      id: json['id'] as String,
      ticker: json['ticker'] as String,
      stockName: json['stockName'] as String,
      direction: json['direction'] == 'UP'
          ? PredictionDirection.up
          : PredictionDirection.down,
      status: _parseStatus(json['status'] as String),
      predictionPrice: json['predictionPrice'] as int,
      resultPrice: json['resultPrice'] as int?,
      streak: json['streak'] as int?,
      date: DateTime.parse(json['date'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'ticker': ticker,
        'stockName': stockName,
        'direction': direction == PredictionDirection.up ? 'UP' : 'DOWN',
        'status': status.name.toUpperCase(),
        'predictionPrice': predictionPrice,
        'resultPrice': resultPrice,
        'streak': streak,
        'date': date.toIso8601String(),
      };

  static PredictionStatus _parseStatus(String status) => switch (status) {
        'CORRECT' => PredictionStatus.correct,
        'WRONG' => PredictionStatus.wrong,
        'NO_RESULT' => PredictionStatus.noResult,
        _ => PredictionStatus.pending,
      };
}

class DayHistoryModel extends DayHistory {
  const DayHistoryModel({required super.date, required super.state});

  factory DayHistoryModel.fromJson(Map<String, dynamic> json) =>
      DayHistoryModel(
        date: DateTime.parse(json['date'] as String),
        state: _parseState(json['state'] as String),
      );

  static DayState _parseState(String state) => switch (state) {
        'SUCCESS' => DayState.success,
        'FAIL' => DayState.fail,
        'PENDING' => DayState.pending,
        _ => DayState.future,
      };
}
