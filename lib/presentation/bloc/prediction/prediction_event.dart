part of 'prediction_bloc.dart';

sealed class PredictionEvent extends Equatable {
  const PredictionEvent();
  @override
  List<Object?> get props => [];
}

final class PredictionSubmitted extends PredictionEvent {
  const PredictionSubmitted({
    required this.ticker,
    required this.stockName,
    required this.direction,
  });
  final String ticker;
  final String stockName;
  final PredictionDirection direction;
  @override
  List<Object?> get props => [ticker, stockName, direction];
}

final class PredictionResultRequested extends PredictionEvent {
  const PredictionResultRequested();
}

final class PredictionAdWatchConfirmed extends PredictionEvent {
  const PredictionAdWatchConfirmed();
}

final class PredictionReset extends PredictionEvent {
  const PredictionReset();
}
