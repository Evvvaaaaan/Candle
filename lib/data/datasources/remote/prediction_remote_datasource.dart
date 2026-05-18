import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../domain/entities/prediction.dart';
import '../../models/prediction_model.dart';

abstract interface class PredictionRemoteDataSource {
  Future<PredictionModel> submitPrediction({
    required String ticker,
    required String stockName,
    required PredictionDirection direction,
  });

  Future<PredictionModel?> getTodayPrediction();
  Future<PredictionModel> getPredictionResult();
  Future<List<DayHistoryModel>> getHistory();
  Future<void> confirmAdWatched();
}

class PredictionRemoteDataSourceImpl implements PredictionRemoteDataSource {
  const PredictionRemoteDataSourceImpl(this._client);
  final ApiClient _client;

  static const bool _useMock = true;

  @override
  Future<PredictionModel> submitPrediction({
    required String ticker,
    required String stockName,
    required PredictionDirection direction,
  }) async {
    if (_useMock) {
      await Future.delayed(const Duration(milliseconds: 500));
      return PredictionModel(
        id: 'mock-${DateTime.now().millisecondsSinceEpoch}',
        ticker: ticker,
        stockName: stockName,
        direction: direction,
        status: PredictionStatus.pending,
        predictionPrice: 73400,
        date: DateTime.now(),
      );
    }
    final response = await _client.post(
      ApiEndpoints.predictions,
      data: {
        'ticker': ticker,
        'stockName': stockName,
        'direction': direction == PredictionDirection.up ? 'UP' : 'DOWN',
      },
    );
    return PredictionModel.fromJson(response['data'] as Map<String, dynamic>);
  }

  @override
  Future<PredictionModel?> getTodayPrediction() async {
    if (_useMock) return null;
    final response = await _client.get(ApiEndpoints.todayPrediction);
    final data = response['data'];
    if (data == null) return null;
    return PredictionModel.fromJson(data as Map<String, dynamic>);
  }

  @override
  Future<PredictionModel> getPredictionResult() async {
    if (_useMock) {
      await Future.delayed(const Duration(milliseconds: 1000));
      return PredictionModel(
        id: 'mock-result',
        ticker: '005930',
        stockName: '삼성전자',
        direction: PredictionDirection.up,
        status: PredictionStatus.correct,
        predictionPrice: 73400,
        resultPrice: 74500,
        streak: 7,
        date: DateTime.now(),
      );
    }
    final response = await _client.get(ApiEndpoints.predictionResult);
    return PredictionModel.fromJson(response['data'] as Map<String, dynamic>);
  }

  @override
  Future<List<DayHistoryModel>> getHistory() async {
    if (_useMock) {
      final today = DateTime.now();
      return List.generate(10, (i) {
        final date = today.subtract(Duration(days: 9 - i));
        final DayState state;
        if (i < 7) {
          state = i % 3 == 0 ? DayState.fail : DayState.success;
        } else if (i == 7) {
          state = DayState.pending;
        } else {
          state = DayState.future;
        }
        return DayHistoryModel(date: date, state: state);
      });
    }
    final response = await _client.get(ApiEndpoints.predictionHistory);
    return (response['data'] as List)
        .map((e) => DayHistoryModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> confirmAdWatched() async {
    if (_useMock) {
      await Future.delayed(const Duration(milliseconds: 300));
      return;
    }
    await _client.post(ApiEndpoints.watchAd);
  }
}
