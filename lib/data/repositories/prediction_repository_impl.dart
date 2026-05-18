import 'package:dartz/dartz.dart';
import '../../core/errors/exceptions.dart';
import '../../core/errors/failures.dart';
import '../../domain/entities/prediction.dart';
import '../../domain/repositories/prediction_repository.dart';
import '../datasources/remote/prediction_remote_datasource.dart';

class PredictionRepositoryImpl implements PredictionRepository {
  const PredictionRepositoryImpl(this._remote);
  final PredictionRemoteDataSource _remote;

  @override
  Future<Either<Failure, Prediction>> submitPrediction({
    required String ticker,
    required String stockName,
    required PredictionDirection direction,
  }) async {
    try {
      final result = await _remote.submitPrediction(
        ticker: ticker,
        stockName: stockName,
        direction: direction,
      );
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    }
  }

  @override
  Future<Either<Failure, Prediction?>> getTodayPrediction() async {
    try {
      final result = await _remote.getTodayPrediction();
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    }
  }

  @override
  Future<Either<Failure, Prediction>> getPredictionResult() async {
    try {
      final result = await _remote.getPredictionResult();
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    }
  }

  @override
  Future<Either<Failure, List<DayHistory>>> getHistory() async {
    try {
      final result = await _remote.getHistory();
      return Right(result);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    }
  }

  @override
  Future<Either<Failure, void>> confirmAdWatched() async {
    try {
      await _remote.confirmAdWatched();
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    }
  }
}
