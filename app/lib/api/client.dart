import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

/// HTTP failure or contract violation. `status` -1 means the response belonged
/// to a session that has since ended and should be ignored silently; 0 means the
/// request never got a response; 502 means the response broke the contract.
class ApiException implements Exception {
  const ApiException(this.status, [this.body]);
  final int status;
  final Object? body;
  @override
  String toString() => 'ApiException($status)';
}

abstract interface class TokenStore {
  Future<String?> read(String key);
  Future<void> write(String key, String? value);
}

class SecureTokenStore implements TokenStore {
  static const _storage = FlutterSecureStorage();
  @override
  Future<String?> read(String key) => _storage.read(key: 'candle.$key');
  @override
  Future<void> write(String key, String? value) => value == null
      ? _storage.delete(key: 'candle.$key')
      : _storage.write(key: 'candle.$key', value: value);
}

class MemoryTokenStore implements TokenStore {
  final values = <String, String>{};
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String? value) async =>
      value == null ? values.remove(key) : values[key] = value;
}

bool isMissingToken(String? value) =>
    value == null || const ['', 'null', 'undefined'].contains(value);

/// Port of the professor's `func_ajax` / `listenerGetAccessToken` transport
/// (reference/web/default/custom.js).
class ApiClient {
  ApiClient({
    required String baseUrl,
    required this.tokens,
    http.Client? httpClient,
    this.timeout = const Duration(seconds: 12),
  })  : baseUrl = baseUrl.replaceFirst(RegExp(r'/$'), ''),
        _http = httpClient ?? http.Client();

  final String baseUrl;
  final TokenStore tokens;
  final Duration timeout;
  final http.Client _http;

  /// Called after the server rejects the session (refresh failed with
  /// 401/403/406, or a repeated 401/403/406 on a normal request).
  void Function()? onExpired;

  String? _access;
  String? _refresh;
  int _generation = 0;
  Future<void>? _refreshing;

  bool get hasRefreshToken => !isMissingToken(_refresh);

  Future<void> load() async {
    _access = await tokens.read('accessToken');
    _refresh = await tokens.read('refreshToken');
  }

  /// Ends the session locally. Responses still in flight are dropped.
  Future<void> clear() async {
    _generation++;
    _access = null;
    _refresh = null;
    _refreshing = null;
    await tokens.write('accessToken', null);
    await tokens.write('refreshToken', null);
  }

  void _expire() {
    clear();
    onExpired?.call();
  }

  Uri _uri(String path, [Map<String, Object?>? query]) {
    final uri = Uri.parse('$baseUrl$path');
    if (query == null) return uri;
    return uri.replace(queryParameters: {
      for (final e in query.entries)
        if (e.value != null) e.key: '${e.value}',
    });
  }

  Future<http.Response> _send(
    String method,
    Uri uri,
    Map<String, String> headers, [
    Object? body,
  ]) async {
    final request = http.Request(method, uri)
      ..headers.addAll({
        'Content-Type': 'application/json; charset=utf-8',
        ...headers,
      });
    if (body != null) request.body = jsonEncode(body);
    try {
      return await http.Response.fromStream(
        await _http.send(request).timeout(timeout),
      );
    } on TimeoutException {
      throw const ApiException(0);
    } on http.ClientException {
      throw const ApiException(0);
    }
  }

  static Object? _decode(http.Response response) {
    if (response.bodyBytes.isEmpty) return null;
    final text = utf8.decode(response.bodyBytes);
    try {
      return jsonDecode(text);
    } on FormatException {
      return text;
    }
  }

  /// `POST /api/user/{provider}`; stores the `RefreshToken` response header.
  Future<void> signIn(String provider, Map<String, Object?> credentials) async {
    await clear();
    final generation = _generation;
    final response = await _send(
      'POST',
      _uri('/api/user/$provider'),
      const {},
      credentials,
    );
    if (generation != _generation) throw const ApiException(-1);
    if (response.statusCode >= 400) {
      throw ApiException(response.statusCode, _decode(response));
    }
    final token = response.headers['refreshtoken'];
    if (isMissingToken(token)) throw const ApiException(502);
    _refresh = token;
    await tokens.write('refreshToken', token);
  }

  /// `POST /api/auth` with the raw refresh token; stores the `Authorization`
  /// response header. Concurrent callers share one request.
  Future<void> refreshAccess() {
    return _refreshing ??= _refreshOnce().whenComplete(() => _refreshing = null);
  }

  Future<void> _refreshOnce() async {
    final generation = _generation;
    final token = _refresh;
    if (isMissingToken(token)) throw const ApiException(401);
    final http.Response response;
    try {
      response = await _send('POST', _uri('/api/auth'), {'RefreshToken': token!});
    } on ApiException {
      if (generation != _generation) throw const ApiException(-1);
      rethrow;
    }
    if (generation != _generation) throw const ApiException(-1);
    if (response.statusCode >= 400) {
      if (const [401, 403, 406].contains(response.statusCode)) _expire();
      throw ApiException(response.statusCode, _decode(response));
    }
    final access = response.headers['authorization'];
    if (isMissingToken(access)) throw const ApiException(502);
    _access = access;
    await tokens.write('accessToken', access);
  }

  /// Authorized JSON request. GET params go in the query string; other
  /// methods send them as a JSON body.
  Future<Object?> request(
    String path, {
    String method = 'GET',
    Map<String, Object?>? param,
  }) async {
    final generation = _generation;
    final userPath = path.startsWith('/api/user/');
    var retried = false;
    while (true) {
      if (generation != _generation) throw const ApiException(-1);
      final token = _access;
      final response = await _send(
        method,
        method == 'GET' ? _uri(path, param) : _uri(path),
        isMissingToken(token) ? const {} : {'Authorization': token!},
        method == 'GET' ? null : param,
      );
      if (generation != _generation) throw const ApiException(-1);
      final status = response.statusCode;
      if (status < 400) return _decode(response);
      if (status == 401 && !retried && !userPath) {
        retried = true;
        if (token == _access) await refreshAccess();
        continue;
      }
      if (const [401, 403, 406].contains(status) && !userPath) _expire();
      throw ApiException(status, _decode(response));
    }
  }
}
