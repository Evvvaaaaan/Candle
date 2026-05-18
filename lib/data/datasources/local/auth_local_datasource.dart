import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/storage/secure_storage.dart';

abstract interface class AuthLocalDataSource {
  Future<bool> hasValidSession();
  Future<void> setVisited();
  Future<bool> isFirstVisit();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  const AuthLocalDataSourceImpl(this._prefs, this._secureStorage);

  final SharedPreferences _prefs;
  final SecureStorage _secureStorage;

  static const _visitedKey = 'candle_visited';

  @override
  Future<bool> hasValidSession() async {
    final token = await _secureStorage.getAccessToken();
    return token != null;
  }

  @override
  Future<void> setVisited() =>
      _prefs.setBool(_visitedKey, true).then((_) {});

  @override
  Future<bool> isFirstVisit() async =>
      !(_prefs.getBool(_visitedKey) ?? false);
}
