import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/entities/prediction.dart';
import '../../../domain/repositories/prediction_repository.dart';
import '../../../domain/usecases/prediction/submit_prediction_usecase.dart';

part 'prediction_event.dart';
part 'prediction_state.dart';

class PredictionBloc extends Bloc<PredictionEvent, PredictionState> {
  PredictionBloc({
    required SubmitPredictionUseCase submitPrediction,
    required PredictionRepository predictionRepository,
  })  : _submitPrediction = submitPrediction,
        _repository = predictionRepository,
        super(const PredictionInitial()) {
    on<PredictionSubmitted>(_onSubmitted);
    on<PredictionResultRequested>(_onResultRequested);
    on<PredictionAdWatchConfirmed>(_onAdWatchConfirmed);
    on<PredictionReset>(_onReset);
  }

  final SubmitPredictionUseCase _submitPrediction;
  final PredictionRepository _repository;

  Future<void> _onSubmitted(
    PredictionSubmitted event,
    Emitter<PredictionState> emit,
  ) async {
    emit(const PredictionLoading());
    final result = await _submitPrediction(
      ticker: event.ticker,
      stockName: event.stockName,
      direction: event.direction,
    );
    result.fold(
      (failure) => emit(PredictionError(failure.message)),
      (prediction) => emit(PredictionSubmitSuccess(prediction)),
    );
  }

  Future<void> _onResultRequested(
    PredictionResultRequested event,
    Emitter<PredictionState> emit,
  ) async {
    emit(const PredictionLoading());
    final result = await _repository.getPredictionResult();
    result.fold(
      (failure) => emit(PredictionError(failure.message)),
      (prediction) => emit(PredictionResultLoaded(prediction)),
    );
  }

  Future<void> _onAdWatchConfirmed(
    PredictionAdWatchConfirmed event,
    Emitter<PredictionState> emit,
  ) async {
    final result = await _repository.confirmAdWatched();
    result.fold(
      (failure) => emit(PredictionError(failure.message)),
      (_) => emit(const PredictionAdConfirmed()),
    );
  }

  void _onReset(PredictionReset event, Emitter<PredictionState> emit) {
    emit(const PredictionInitial());
  }
}
