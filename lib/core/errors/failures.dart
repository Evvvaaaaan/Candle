import 'package:equatable/equatable.dart';

sealed class Failure extends Equatable {
  const Failure({required this.message});
  final String message;

  @override
  List<Object?> get props => [message];
}

final class ServerFailure extends Failure {
  const ServerFailure({required super.message, this.statusCode});
  final int? statusCode;
}

final class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure({super.message = '인증이 만료되었습니다. 다시 로그인해주세요.'});
}

final class NetworkFailure extends Failure {
  const NetworkFailure({super.message = '네트워크 연결을 확인해주세요.'});
}

final class CacheFailure extends Failure {
  const CacheFailure({required super.message});
}

final class ValidationFailure extends Failure {
  const ValidationFailure({required super.message});
}
