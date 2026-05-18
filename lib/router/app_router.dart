import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../di/injection.dart';
import '../domain/entities/stock.dart';
import '../presentation/bloc/auth/auth_bloc.dart';
import '../presentation/bloc/prediction/prediction_bloc.dart';
import '../presentation/bloc/stock/stock_bloc.dart';
import '../presentation/screens/ad_watch_screen.dart';
import '../presentation/screens/history_screen.dart';
import '../presentation/screens/home_screen.dart';
import '../presentation/screens/login_screen.dart';
import '../presentation/screens/my_page_screen.dart';
import '../presentation/screens/nickname_screen.dart';
import '../presentation/screens/onboarding_screen.dart';
import '../presentation/screens/prediction_screen.dart';
import '../presentation/screens/ranking_screen.dart';
import '../presentation/screens/result_screen.dart';
import '../presentation/screens/notification_settings_screen.dart';
import '../presentation/screens/point_store_screen.dart';
import '../presentation/screens/reward_claim_screen.dart';
import '../presentation/screens/settings_screen.dart';
import '../presentation/screens/stock_search_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/',
  redirect: _rootRedirect,
  routes: [
    GoRoute(path: '/', redirect: _rootRedirect),
    GoRoute(
      path: '/onboarding',
      builder: (_, __) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (_, __) => BlocProvider(
        create: (_) => sl<AuthBloc>()..add(const AuthCheckRequested()),
        child: const LoginScreen(),
      ),
    ),
    GoRoute(
      path: '/nickname',
      builder: (_, __) => BlocProvider.value(
        value: sl<AuthBloc>(),
        child: const NicknameScreen(),
      ),
    ),
    GoRoute(
      path: '/home',
      builder: (_, __) => const HomeScreen(),
    ),
    GoRoute(
      path: '/ad-watch',
      builder: (_, __) => BlocProvider(
        create: (_) => sl<PredictionBloc>(),
        child: const AdWatchScreen(),
      ),
    ),
    GoRoute(
      path: '/stock-search',
      builder: (_, __) => BlocProvider(
        create: (_) => sl<StockBloc>(),
        child: const StockSearchScreen(),
      ),
    ),
    GoRoute(
      path: '/prediction',
      builder: (context, state) {
        final stock = state.extra as Stock;
        return BlocProvider(
          create: (_) => sl<PredictionBloc>(),
          child: PredictionScreen(stock: stock),
        );
      },
    ),
    GoRoute(
      path: '/result',
      builder: (_, __) => BlocProvider(
        create: (_) => sl<PredictionBloc>(),
        child: const ResultScreen(),
      ),
    ),
    GoRoute(
      path: '/ranking',
      builder: (_, __) => const RankingScreen(),
    ),
    GoRoute(
      path: '/history',
      builder: (_, __) => const HistoryScreen(),
    ),
    GoRoute(
      path: '/my-page',
      builder: (_, __) => BlocProvider.value(
        value: sl<AuthBloc>(),
        child: const MyPageScreen(),
      ),
    ),
    GoRoute(
      path: '/point-store',
      builder: (_, __) => const PointStoreScreen(),
    ),
    GoRoute(
      path: '/reward',
      builder: (_, __) => const RewardClaimScreen(),
    ),
    GoRoute(
      path: '/notification-settings',
      builder: (_, __) => const NotificationSettingsScreen(),
    ),
    GoRoute(
      path: '/settings',
      builder: (_, __) => const SettingsScreen(),
    ),
  ],
  errorBuilder: (_, state) => Scaffold(
    body: Center(child: Text('페이지를 찾을 수 없어요: ${state.uri}')),
  ),
);

Future<String?> _rootRedirect(BuildContext context, GoRouterState state) async {
  if (state.uri.toString() != '/') return null;

  final prefs = await SharedPreferences.getInstance();
  final visited = prefs.getBool('candle_visited') ?? false;
  if (!visited) return '/onboarding';

  final authBloc = sl<AuthBloc>();
  final hasSession = authBloc.state is AuthAuthenticated;
  return hasSession ? '/home' : '/login';
}
