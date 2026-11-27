import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/auth_screens.dart';
import 'screens/point_screens.dart';
import 'screens/predict_screens.dart';
import 'state.dart';
import 'theme.dart';
import 'ui/widgets.dart';

/// Which bottom tab is highlighted for each screen (null: bar without a tab).
String? tabFor(String path) => switch (path) {
      '/home' || '/challenge' || '/challenge-reward' => 'home',
      '/stock-select' || '/prediction' || '/pass' || '/prediction-history' => 'predict',
      '/missions' => 'missions',
      '/shop' || '/exchange' => 'shop',
      _ => null,
    };

const _public = {'/splash', '/signup'};
const _tabRoots = {'/home', '/stock-select', '/missions', '/shop'};

GoRouter buildRouter(AppState state) {
  final root = GlobalKey<NavigatorState>();
  GoRoute page(String path, Widget Function(GoRouterState s) build) =>
      GoRoute(path: path, builder: (context, s) => build(s));
  // Shell screens have no Scaffold of their own: paint the screen color so the
  // outgoing page does not show through during the iOS slide transition.
  // Switching bottom tabs is instant, like the web and native tab bars.
  GoRoute shellPage(String path, Widget Function(GoRouterState s) build) => GoRoute(
        path: path,
        pageBuilder: (context, s) {
          final child = ColoredBox(color: C.screen, child: build(s));
          return _tabRoots.contains(path)
              ? NoTransitionPage(key: s.pageKey, child: child)
              : MaterialPage(key: s.pageKey, child: child);
        },
      );
  return GoRouter(
    navigatorKey: root,
    initialLocation: '/splash',
    refreshListenable: state.authChanges,
    redirect: (context, s) {
      final path = s.matchedLocation;
      if (state.status == AuthStatus.unknown) return path == '/splash' ? null : '/splash';
      if (state.status == AuthStatus.signedOut && !_public.contains(path)) return '/signup';
      return null;
    },
    routes: [
      page('/splash', (_) => const SplashScreen()),
      page('/signup', (_) => const SignupScreen()),
      page('/consent', (_) => const ConsentScreen()),
      GoRoute(parentNavigatorKey: root, path: '/payout', builder: (_, _) => const PayoutScreen()),
      ShellRoute(
        builder: (context, s, child) {
          final router = GoRouter.of(context);
          return Scaffold(
            body: child,
            // Highlight from the top-most route: pushed screens keep the shell's
            // original state in `s`.
            bottomNavigationBar: ListenableBuilder(
              listenable: router.routerDelegate,
              builder: (context, _) => BottomNav(active: tabFor(router.state.matchedLocation)),
            ),
          );
        },
        routes: [
          shellPage('/home', (s) => HomeScreen(tutorial: s.uri.queryParameters['tutorial'] == '1')),
          shellPage('/stock-select', (s) => StockSelectScreen(returnHome: s.uri.queryParameters['return'] == 'home')),
          shellPage('/prediction', (_) => const PredictionScreen()),
          shellPage('/pass', (_) => const PassScreen()),
          shellPage('/prediction-history', (_) => const PredictionHistoryScreen()),
          shellPage('/missions', (_) => const MissionsScreen()),
          shellPage('/challenge', (_) => const ChallengeScreen()),
          shellPage('/challenge-reward', (_) => const ChallengeRewardScreen()),
          shellPage('/shop', (_) => const ShopScreen()),
          shellPage('/exchange', (_) => const ExchangeScreen()),
          shellPage('/wallet', (s) => WalletScreen(
                tab: s.uri.queryParameters['tab'] ?? 'all',
                requested: s.uri.queryParameters['requested'] == '1',
              )),
          shellPage('/profile', (_) => const ProfileScreen()),
          shellPage('/settings', (_) => const SettingsScreen()),
          shellPage('/withdraw', (_) => const WithdrawScreen()),
        ],
      ),
    ],
  );
}
