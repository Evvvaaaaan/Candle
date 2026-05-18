import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/prediction.dart';

abstract interface class PredictionRepository {
  Future<Either<Failure, Prediction>> submitPrediction({
    required String ticker,
    required String stockName,
    required PredictionDirection direction,
  });

  Future<Either<Failure, Prediction?>> getTodayPrediction();
  Future<Either<Failure, Prediction>> getPredictionResult();
  Future<Either<Failure, List<DayHistory>>> getHistory();
  Future<Either<Failure, void>> confirmAdWatched();
}
