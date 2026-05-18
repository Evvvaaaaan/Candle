import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/entities/stock.dart';
import '../../../domain/usecases/stock/get_stocks_usecase.dart';

part 'stock_event.dart';
part 'stock_state.dart';

class StockBloc extends Bloc<StockEvent, StockState> {
  StockBloc({
    required GetTopStocksUseCase getTopStocks,
    required SearchStocksUseCase searchStocks,
  })  : _getTopStocks = getTopStocks,
        _searchStocks = searchStocks,
        super(const StockInitial()) {
    on<StockLoadRequested>(_onLoadRequested);
    on<StockSearchChanged>(_onSearchChanged);
    on<StockSearchCleared>(_onSearchCleared);
  }

  final GetTopStocksUseCase _getTopStocks;
  final SearchStocksUseCase _searchStocks;

  List<Stock> _topStocks = [];
  Timer? _debounceTimer;

  @override
  Future<void> close() {
    _debounceTimer?.cancel();
    return super.close();
  }

  Future<void> _onLoadRequested(
    StockLoadRequested event,
    Emitter<StockState> emit,
  ) async {
    emit(const StockLoading());
    final result = await _getTopStocks();
    result.fold(
      (failure) => emit(StockError(failure.message)),
      (stocks) {
        _topStocks = stocks;
        emit(StockLoaded(stocks: stocks));
      },
    );
  }

  Future<void> _onSearchChanged(
    StockSearchChanged event,
    Emitter<StockState> emit,
  ) async {
    _debounceTimer?.cancel();

    final query = event.query.trim();
    if (query.isEmpty) {
      emit(StockLoaded(stocks: _topStocks));
      return;
    }

    emit(StockLoaded(stocks: _topStocks, isSearching: true, query: query));

    final completer = Completer<void>();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () async {
      if (!completer.isCompleted) {
        final result = await _searchStocks(query);
        if (!completer.isCompleted) {
          result.fold(
            (failure) => emit(StockError(failure.message)),
            (stocks) => emit(StockLoaded(stocks: stocks, query: query)),
          );
          completer.complete();
        }
      }
    });

    await completer.future;
  }

  Future<void> _onSearchCleared(
    StockSearchCleared event,
    Emitter<StockState> emit,
  ) async {
    _debounceTimer?.cancel();
    emit(StockLoaded(stocks: _topStocks));
  }
}
