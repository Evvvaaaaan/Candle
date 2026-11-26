import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api/candle_api.dart';
import 'api/client.dart';

enum AuthStatus { unknown, signedOut, signedIn }

class Product {
  const Product(this.amount);
  final int amount;
  int get points => amount;
  String get id => 'naverpay-$amount';
}

const products = [Product(5000), Product(10000), Product(30000), Product(50000), Product(100000)];

/// App-wide state: session status, the selected stock/direction/product,
/// the local watchlist, and the last balance and ticket counts.
class AppState extends ChangeNotifier {
  AppState({required this.api, required this.prefs}) {
    api.client.onExpired = _expired;
  }

  final CandleApi api;
  final SharedPreferences prefs;

  AuthStatus status = AuthStatus.unknown;

  /// Fires only when [status] changes; the router listens to this rather than
  /// to every state change (a refresh mid-navigation would undo a pop).
  final authChanges = ValueNotifier<AuthStatus>(AuthStatus.unknown);

  Topic? topic;
  String direction = 'up';
  Product product = products.first;
  int? balance;
  Tickets? tickets;
  late List<Topic> watchlist = _readWatchlist();

  /// Restores the stored session. Network failures keep the token; only an
  /// explicit server rejection signs the user out.
  Future<void> restore() async {
    await api.client.load();
    if (!api.client.hasRefreshToken) {
      _set(AuthStatus.signedOut);
      return;
    }
    try {
      await api.session();
    } on ApiException catch (e) {
      if (!api.client.hasRefreshToken || const [401, 403, 406].contains(e.status)) {
        _set(AuthStatus.signedOut);
        return;
      }
    }
    _set(AuthStatus.signedIn);
  }

  /// Exchanges provider credentials for a session. Throws [ApiException].
  Future<void> signIn(String provider, Map<String, Object?> credentials) async {
    await api.signIn(provider, credentials);
    await api.session();
    _set(AuthStatus.signedIn);
  }

  Future<void> logout() async {
    await api.client.clear();
    _resetAccount();
    _set(AuthStatus.signedOut);
  }

  void _expired() {
    _resetAccount();
    _set(AuthStatus.signedOut);
  }

  void _resetAccount() {
    topic = null;
    direction = 'up';
    product = products.first;
    balance = null;
    tickets = null;
    watchlist = [];
    prefs.remove('candle.watchlist');
  }

  void _set(AuthStatus next) {
    status = next;
    authChanges.value = next;
    notifyListeners();
  }

  void chooseTopic(Topic next) {
    topic = next;
    notifyListeners();
  }

  void chooseDirection(String next) {
    direction = next == 'down' ? 'down' : 'up';
    notifyListeners();
  }

  void chooseProduct(Product next) {
    product = next;
    notifyListeners();
  }

  Future<int> refreshBalance() async {
    balance = await api.balance();
    notifyListeners();
    return balance!;
  }

  Future<Tickets> refreshTickets() async {
    tickets = await api.tickets();
    notifyListeners();
    return tickets!;
  }

  bool isWatched(String id) => watchlist.any((t) => t.id == id);

  void toggleWatch(Topic t) {
    watchlist = isWatched(t.id)
        ? watchlist.where((w) => w.id != t.id).toList()
        : [...watchlist, Topic(id: t.id, code: t.code, title: t.title, cate: t.cate)];
    prefs.setString('candle.watchlist', jsonEncode([for (final w in watchlist) w.toJson()]));
    notifyListeners();
  }

  List<Topic> _readWatchlist() {
    try {
      final rows = jsonDecode(prefs.getString('candle.watchlist') ?? '[]') as List;
      return [
        for (final row in rows)
          if (row is Map && row['id'] is String && row['code'] is String && row['title'] is String)
            Topic(id: row['id'], code: row['code'], title: row['title'], cate: '${row['cate'] ?? ''}'),
      ];
    } catch (_) {
      return [];
    }
  }

  bool get tutorialSeen => prefs.getString('candle.tutorial.seen') == '1';
  set tutorialSeen(bool seen) =>
      seen ? prefs.setString('candle.tutorial.seen', '1') : prefs.remove('candle.tutorial.seen');

  String? get lastResultSeen => prefs.getString('candle.lastResult.seen');
  set lastResultSeen(String? date) =>
      date == null ? prefs.remove('candle.lastResult.seen') : prefs.setString('candle.lastResult.seen', date);
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);

  static AppState of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;

  /// Reads without subscribing (for callbacks).
  static AppState read(BuildContext context) =>
      context.getInheritedWidgetOfExactType<AppScope>()!.notifier!;
}
