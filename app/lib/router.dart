import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'screens/auth_screens.dart';
import 'screens/point_screens.dart';
import 'screens/predict_screens.dart';
import 'state.dart';
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

GoRouter buildRouter(AppState state) {
  final root = GlobalKey<NavigatorState>();
  GoRoute page(String path, Widget Function(GoRouterState s) build) =>
      GoRoute(path: path, builder: (context, s) => build(s));
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
          page('/home', (s) => HomeScreen(tutorial: s.uri.queryParameters['tutorial'] == '1')),
          page('/stock-select', (s) => StockSelectScreen(returnHome: s.uri.queryParameters['return'] == 'home')),
          page('/prediction', (_) => const PredictionScreen()),
          page('/pass', (_) => const PassScreen()),
          page('/prediction-history', (_) => const PredictionHistoryScreen()),
          page('/missions', (_) => const MissionsScreen()),
          page('/challenge', (_) => const ChallengeScreen()),
          page('/challenge-reward', (_) => const ChallengeRewardScreen()),
          page('/shop', (_) => const ShopScreen()),
          page('/exchange', (_) => const ExchangeScreen()),
          page('/wallet', (s) => WalletScreen(
                tab: s.uri.queryParameters['tab'] ?? 'all',
                requested: s.uri.queryParameters['requested'] == '1',
              )),
          page('/profile', (_) => const ProfileScreen()),
          page('/settings', (_) => const SettingsScreen()),
        ],
      ),
    ],
  );
}
