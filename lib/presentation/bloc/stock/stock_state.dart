part of 'stock_bloc.dart';

sealed class StockState extends Equatable {
  const StockState();
  @override
  List<Object?> get props => [];
}

final class StockInitial extends StockState {
  const StockInitial();
}

final class StockLoading extends StockState {
  const StockLoading();
}

final class StockLoaded extends StockState {
  const StockLoaded({
    required this.stocks,
    this.isSearching = false,
    this.query = '',
  });

  final List<Stock> stocks;
  final bool isSearching;
  final String query;

  @override
  List<Object?> get props => [stocks, isSearching, query];
}

final class StockError extends StockState {
  const StockError(this.message);
  final String message;
  @override
  List<Object?> get props => [message];
}
