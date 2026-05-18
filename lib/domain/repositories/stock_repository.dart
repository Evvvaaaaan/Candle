import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/stock.dart';

abstract interface class StockRepository {
  Future<Either<Failure, List<Stock>>> getTopStocks();
  Future<Either<Failure, List<Stock>>> searchStocks(String query);
}
