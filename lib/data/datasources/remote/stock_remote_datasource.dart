import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../models/stock_model.dart';

abstract interface class StockRemoteDataSource {
  Future<List<StockModel>> getTopStocks();
  Future<List<StockModel>> searchStocks(String query);
}

class StockRemoteDataSourceImpl implements StockRemoteDataSource {
  const StockRemoteDataSourceImpl(this._client);
  final ApiClient _client;

  // Spring Boot 연동 전 mock 플래그
  static const bool _useMock = true;

  @override
  Future<List<StockModel>> getTopStocks() async {
    if (_useMock) {
      await Future.delayed(const Duration(milliseconds: 800));
      return StockModel.mockTopStocks;
    }
    final response = await _client.get(ApiEndpoints.stocks);
    return (response['data'] as List)
        .map((e) => StockModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<List<StockModel>> searchStocks(String query) async {
    if (_useMock) {
      await Future.delayed(const Duration(milliseconds: 400));
      final q = query.toLowerCase();
      return StockModel.mockTopStocks
          .where((s) =>
              s.name.toLowerCase().contains(q) ||
              s.ticker.contains(q))
          .toList();
    }
    final response = await _client.get(
      ApiEndpoints.stockSearch,
      queryParameters: {'q': query},
    );
    return (response['data'] as List)
        .map((e) => StockModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
