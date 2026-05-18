import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/user.dart';

abstract interface class AuthRepository {
  Future<Either<Failure, User>> loginWithKakao(String kakaoAccessToken);
  Future<Either<Failure, User>> setNickname(String nickname);
  Future<Either<Failure, User>> getMyProfile();
  Future<Either<Failure, void>> logout();
  Future<bool> hasValidSession();
}
