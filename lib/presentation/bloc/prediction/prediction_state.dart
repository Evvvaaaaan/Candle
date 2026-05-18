part of 'prediction_bloc.dart';

sealed class PredictionState extends Equatable {
  const PredictionState();
  @override
  List<Object?> get props => [];
}

final class PredictionInitial extends PredictionState {
  const PredictionInitial();
}

final class PredictionLoading extends PredictionState {
  const PredictionLoading();
}

final class PredictionSubmitSuccess extends PredictionState {
  const PredictionSubmitSuccess(this.prediction);
  final Prediction prediction;
  @override
  List<Object?> get props => [prediction];
}

final class PredictionResultLoaded extends PredictionState {
  const PredictionResultLoaded(this.prediction);
  final Prediction prediction;
  @override
  List<Object?> get props => [prediction];
}

final class PredictionAdConfirmed extends PredictionState {
  const PredictionAdConfirmed();
}

final class PredictionError extends PredictionState {
  const PredictionError(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}
