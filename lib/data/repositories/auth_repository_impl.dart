import 'package:dartz/dartz.dart';
import '../../core/errors/exceptions.dart';
import '../../core/errors/failures.dart';
import '../../core/storage/secure_storage.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/local/auth_local_datasource.dart';
import '../datasources/remote/auth_remote_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  const AuthRepositoryImpl(
    this._remote,
    this._local,
    this._secureStorage,
  );

  final AuthRemoteDataSource _remote;
  final AuthLocalDataSource _local;
  final SecureStorage _secureStorage;

  @override
  Future<Either<Failure, User>> loginWithKakao(
    String kakaoAccessToken,
  ) async {
    try {
      final user = await _remote.loginWithKakao(kakaoAccessToken);
      await _local.setVisited();
      return Right(user);
    } on UnauthorizedException catch (e) {
      return Left(UnauthorizedFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    }
  }

  @override
  Future<Either<Failure, User>> setNickname(String nickname) async {
    try {
      final user = await _remote.setNickname(nickname);
      return Right(user);
    } on ValidationException catch (e) {
      return Left(ValidationFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    }
  }

  @override
  Future<Either<Failure, User>> getMyProfile() async {
    try {
      final user = await _remote.getMyProfile();
      return Right(user);
    } on UnauthorizedException catch (e) {
      return Left(UnauthorizedFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await _remote.logout();
      await _secureStorage.clearTokens();
      return const Right(null);
    } on Exception {
      await _secureStorage.clearTokens();
      return const Right(null);
    }
  }

  @override
  Future<bool> hasValidSession() => _local.hasValidSession();
}
