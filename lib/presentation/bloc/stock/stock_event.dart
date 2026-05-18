part of 'stock_bloc.dart';

sealed class StockEvent extends Equatable {
  const StockEvent();
  @override
  List<Object?> get props => [];
}

final class StockLoadRequested extends StockEvent {
  const StockLoadRequested();
}

final class StockSearchChanged extends StockEvent {
  const StockSearchChanged(this.query);
  final String query;
  @override
  List<Object?> get props => [query];
}

final class StockSearchCleared extends StockEvent {
  const StockSearchCleared();
}
