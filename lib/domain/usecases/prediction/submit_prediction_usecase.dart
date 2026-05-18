import 'package:dartz/dartz.dart';
import '../../../core/errors/failures.dart';
import '../../entities/prediction.dart';
import '../../repositories/prediction_repository.dart';

class SubmitPredictionUseCase {
  const SubmitPredictionUseCase(this._repository);
  final PredictionRepository _repository;

  Future<Either<Failure, Prediction>> call({
    required String ticker,
    required String stockName,
    required PredictionDirection direction,
  }) =>
      _repository.submitPrediction(
        ticker: ticker,
        stockName: stockName,
        direction: direction,
      );
}
