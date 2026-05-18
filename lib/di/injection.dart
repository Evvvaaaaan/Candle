import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get_it/get_it.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/network/api_client.dart';
import '../core/storage/secure_storage.dart';
import '../data/datasources/local/auth_local_datasource.dart';
import '../data/datasources/remote/auth_remote_datasource.dart';
import '../data/datasources/remote/prediction_remote_datasource.dart';
import '../data/datasources/remote/stock_remote_datasource.dart';
import '../data/repositories/auth_repository_impl.dart';
import '../data/repositories/prediction_repository_impl.dart';
import '../data/repositories/stock_repository_impl.dart';
import '../domain/repositories/auth_repository.dart';
import '../domain/repositories/prediction_repository.dart';
import '../domain/repositories/stock_repository.dart';
import '../domain/usecases/auth/login_usecase.dart';
import '../domain/usecases/prediction/submit_prediction_usecase.dart';
import '../domain/usecases/stock/get_stocks_usecase.dart';
import '../presentation/bloc/auth/auth_bloc.dart';
import '../presentation/bloc/prediction/prediction_bloc.dart';
import '../presentation/bloc/stock/stock_bloc.dart';

final sl = GetIt.instance;

Future<void> configureDependencies() async {
  // External
  final prefs = await SharedPreferences.getInstance();
  sl.registerSingleton(prefs);
  sl.registerSingleton(const FlutterSecureStorage());

  // Core
  sl.registerLazySingleton(() => SecureStorage(sl()));
  sl.registerLazySingleton(() => ApiClient(sl()));

  // Data Sources
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(sl()),
  );
  sl.registerLazySingleton<AuthLocalDataSource>(
    () => AuthLocalDataSourceImpl(sl(), sl()),
  );
  sl.registerLazySingleton<StockRemoteDataSource>(
    () => StockRemoteDataSourceImpl(sl()),
  );
  sl.registerLazySingleton<PredictionRemoteDataSource>(
    () => PredictionRemoteDataSourceImpl(sl()),
  );

  // Repositories
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(sl(), sl(), sl()),
  );
  sl.registerLazySingleton<StockRepository>(
    () => StockRepositoryImpl(sl()),
  );
  sl.registerLazySingleton<PredictionRepository>(
    () => PredictionRepositoryImpl(sl()),
  );

  // Use Cases
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton(() => GetTopStocksUseCase(sl()));
  sl.registerLazySingleton(() => SearchStocksUseCase(sl()));
  sl.registerLazySingleton(() => SubmitPredictionUseCase(sl()));

  // BLoCs (factory: 매번 새 인스턴스)
  sl.registerSingleton(
    AuthBloc(authRepository: sl(), loginUseCase: sl()),
  );
  sl.registerFactory(
    () => StockBloc(getTopStocks: sl(), searchStocks: sl()),
  );
  sl.registerFactory(
    () => PredictionBloc(
      submitPrediction: sl(),
      predictionRepository: sl(),
    ),
  );
}
