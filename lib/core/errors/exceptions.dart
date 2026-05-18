class ServerException implements Exception {
  const ServerException({required this.message, this.statusCode});
  final String message;
  final int? statusCode;
}

class UnauthorizedException implements Exception {
  const UnauthorizedException({this.message = '인증이 만료되었습니다. 다시 로그인해주세요.'});
  final String message;
}

class NetworkException implements Exception {
  const NetworkException({this.message = '네트워크 연결을 확인해주세요.'});
  final String message;
}

class CacheException implements Exception {
  const CacheException({required this.message});
  final String message;
}

class ValidationException implements Exception {
  const ValidationException({required this.message});
  final String message;
}
