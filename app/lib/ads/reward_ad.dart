import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart'
    show AdRequest, FullScreenContentCallback, RewardedAd, RewardedAdLoadCallback, ServerSideVerificationOptions;

import '../api/candle_api.dart';
import '../api/client.dart';
import '../config.dart';
import '../state.dart';
import '../ui/widgets.dart';

/// Rewarded ad, ported from the deployed `js/pages/ad.js`. The app only shows
/// the ad; the server grants the ticket from the AdMob SSV callback. The app
/// then polls `/api/heart/count` until `ad` increases.
Future<void> watchRewardAd(BuildContext context, String from) async {
  final state = AppScope.read(context);
  try {
    final user = await state.api.user();
    final tickets = await state.refreshTickets();
    if (!context.mounted) return;
    if (tickets.ad >= AppConfig.adLimit) return announce(context, '오늘 광고 시청 횟수를 모두 사용했어요.');
    final userId = user['id'];
    if (userId == null) throw const ApiException(502);
    final shown = await _show('$userId', from);
    if (!context.mounted) return;
    if (!shown) return announce(context, '광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    final granted = await verifyAdGrant(state, tickets.ad);
    if (!context.mounted) return;
    announce(
      context,
      granted != null
          ? '예측권 1장이 지급되었어요. 보유 예측권 ${fmt(granted.amount)}회'
          : '아직 광고 완료가 확인되지 않았어요. 잠시 후 다시 확인해 주세요.',
    );
  } catch (error) {
    if (context.mounted) report(context, error);
  }
}

/// The SSV callback arrives asynchronously, so check a few times.
/// Returns the new ticket counts once `ad` exceeds [before], otherwise null.
Future<Tickets?> verifyAdGrant(
  AppState state,
  int before, {
  int attempts = 5,
  Duration interval = const Duration(seconds: 2),
}) async {
  for (var attempt = 0; attempt < attempts; attempt++) {
    final row = await state.refreshTickets();
    if (row.ad > before) return row;
    if (attempt < attempts - 1) await Future<void>.delayed(interval);
  }
  return null;
}

/// Loads and shows one rewarded ad; completes when it is dismissed.
Future<bool> _show(String userId, String from) async {
  final loaded = Completer<RewardedAd?>();
  await RewardedAd.load(
    adUnitId: AppConfig.rewardedAdUnit,
    request: const AdRequest(nonPersonalizedAds: true),
    rewardedAdLoadCallback: RewardedAdLoadCallback(
      onAdLoaded: loaded.complete,
      onAdFailedToLoad: (_) => loaded.complete(null),
    ),
  );
  final ad = await loaded.future;
  if (ad == null) return false;
  final closed = Completer<void>();
  ad.fullScreenContentCallback = FullScreenContentCallback(
    onAdDismissedFullScreenContent: (ad) {
      ad.dispose();
      closed.complete();
    },
    onAdFailedToShowFullScreenContent: (ad, _) {
      ad.dispose();
      closed.complete();
    },
  );
  await ad.setServerSideOptions(ServerSideVerificationOptions(userId: userId, customData: from));
  await ad.show(onUserEarnedReward: (_, _) {});
  await closed.future;
  return true;
}
