import 'package:dartz/dartz.dart';
import '../../../core/errors/failures.dart';
import '../../entities/stock.dart';
import '../../repositories/stock_repository.dart';

class GetTopStocksUseCase {
  const GetTopStocksUseCase(this._repository);
  final StockRepository _repository;

  Future<Either<Failure, List<Stock>>> call() => _repository.getTopStocks();
}

class SearchStocksUseCase {
  const SearchStocksUseCase(this._repository);
  final StockRepository _repository;

  Future<Either<Failure, List<Stock>>> call(String query) =>
      _repository.searchStocks(query);
}
