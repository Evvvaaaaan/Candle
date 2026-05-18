import 'package:dartz/dartz.dart';
import '../../core/errors/exceptions.dart';
import '../../core/errors/failures.dart';
import '../../domain/entities/stock.dart';
import '../../domain/repositories/stock_repository.dart';
import '../datasources/remote/stock_remote_datasource.dart';

class StockRepositoryImpl implements StockRepository {
  const StockRepositoryImpl(this._remote);
  final StockRemoteDataSource _remote;

  @override
  Future<Either<Failure, List<Stock>>> getTopStocks() async {
    try {
      final stocks = await _remote.getTopStocks();
      return Right(stocks);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    }
  }

  @override
  Future<Either<Failure, List<Stock>>> searchStocks(String query) async {
    try {
      final stocks = await _remote.searchStocks(query);
      return Right(stocks);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    }
  }
}
