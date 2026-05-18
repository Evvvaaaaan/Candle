import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../domain/entities/ranking.dart';
import '../widgets/bottom_nav.dart';

class RankingScreen extends StatefulWidget {
  const RankingScreen({super.key});

  @override
  State<RankingScreen> createState() => _RankingScreenState();
}

class _RankingScreenState extends State<RankingScreen> {
  int _tabIndex = 0;

  // Mock 데이터: Spring Boot 연동 시 RankingBloc으로 교체
  static final _streakRanking = [
    const StreakRankEntry(rank: 1, nickname: '투자왕김철수', streak: 42, rankChange: 0),
    const StreakRankEntry(rank: 2, nickname: '예측달인', streak: 38, rankChange: 2),
    const StreakRankEntry(rank: 3, nickname: '주식고수123', streak: 35, rankChange: -1),
    const StreakRankEntry(rank: 4, nickname: '강남불패', streak: 29, rankChange: 1),
    const StreakRankEntry(rank: 5, nickname: '차트마스터', streak: 24, rankChange: 3),
    const StreakRankEntry(rank: 6, nickname: '황소투자', streak: 21, rankChange: -2),
    const StreakRankEntry(rank: 7, nickname: '코스피여왕', streak: 18, rankChange: 0),
    const StreakRankEntry(rank: 8, nickname: '기술적분석가', streak: 15, rankChange: 1),
    const StreakRankEntry(rank: 9, nickname: '가치투자자', streak: 12, rankChange: -1),
    const StreakRankEntry(rank: 10, nickname: '트레이더K', streak: 10, rankChange: 0),
  ];

  static final _winrateRanking = [
    const WinrateRankEntry(rank: 1, nickname: '확률의신', winRate: 87.5, totalGames: 80, wins: 70, rankChange: 2),
    const WinrateRankEntry(rank: 2, nickname: '예측달인', winRate: 83.2, totalGames: 125, wins: 104, rankChange: -1),
    const WinrateRankEntry(rank: 3, nickname: '투자왕김철수', winRate: 80.0, totalGames: 90, wins: 72, rankChange: 0),
    const WinrateRankEntry(rank: 4, nickname: '주식고수123', winRate: 76.4, totalGames: 127, wins: 97, rankChange: 1),
    const WinrateRankEntry(rank: 5, nickname: '코스피여왕', winRate: 73.1, totalGames: 78, wins: 57, rankChange: -1),
  ];

  static const _myStreakInfo = MyRankInfo(rank: 3, rankChange: 2, value: '35일 연속');
  static const _myWinrateInfo = MyRankInfo(rank: 4, rankChange: 1, value: '76.4%');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundSecondary,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 448),
            child: Column(
              children: [
                _AppBar(),
                _TabBar(
                  selectedIndex: _tabIndex,
                  onChanged: (i) => setState(() => _tabIndex = i),
                ),
                _MyRankBanner(
                  myInfo: _tabIndex == 0 ? _myStreakInfo : _myWinrateInfo,
                ),
                Expanded(
                  child: _tabIndex == 0
                      ? _StreakRankList(entries: _streakRanking)
                      : _WinrateRankList(entries: _winrateRanking),
                ),
                const BottomNav(currentIndex: 1),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _AppBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios, size: 20),
            onPressed: () => context.go('/home'),
            padding: EdgeInsets.zero,
          ),
          const SizedBox(width: 4),
          Text('랭킹', style: AppTextStyles.titleLarge),
        ],
      ),
    );
  }
}

class _TabBar extends StatelessWidget {
  const _TabBar({required this.selectedIndex, required this.onChanged});
  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: Row(
        children: [
          _TabItem(
            label: '연승 랭킹',
            isSelected: selectedIndex == 0,
            onTap: () => onChanged(0),
          ),
          _TabItem(
            label: '승률 랭킹',
            isSelected: selectedIndex == 1,
            onTap: () => onChanged(1),
          ),
        ],
      ),
    );
  }
}

class _TabItem extends StatelessWidget {
  const _TabItem({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isSelected ? AppColors.primary : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: AppTextStyles.titleMedium.copyWith(
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

class _MyRankBanner extends StatelessWidget {
  const _MyRankBanner({required this.myInfo});
  final MyRankInfo myInfo;

  @override
  Widget build(BuildContext context) {
    final isUp = myInfo.rankChange > 0;
    final isDown = myInfo.rankChange < 0;

    return Container(
      width: double.infinity,
      color: AppColors.primary,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: [
          Text(
            '내 순위',
            style: AppTextStyles.bodyMedium.copyWith(
              color: Colors.white.withValues(alpha: 0.8),
            ),
          ),
          const Spacer(),
          Text(
            '${myInfo.rank}위',
            style: AppTextStyles.titleLarge.copyWith(color: Colors.white),
          ),
          const SizedBox(width: 8),
          Row(
            children: [
              Icon(
                isUp
                    ? Icons.trending_up
                    : isDown
                        ? Icons.trending_down
                        : Icons.remove,
                color: Colors.white.withValues(alpha: 0.8),
                size: 16,
              ),
              const SizedBox(width: 4),
              Text(
                myInfo.value,
                style: AppTextStyles.mono.copyWith(
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StreakRankList extends StatelessWidget {
  const _StreakRankList({required this.entries});
  final List<StreakRankEntry> entries;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: ListView.separated(
        itemCount: entries.length,
        separatorBuilder: (_, __) => const Divider(
          height: 1,
          color: AppColors.borderLight,
          indent: 20,
          endIndent: 20,
        ),
        itemBuilder: (_, i) => _StreakRankItem(entry: entries[i]),
      ),
    );
  }
}

class _StreakRankItem extends StatelessWidget {
  const _StreakRankItem({required this.entry});
  final StreakRankEntry entry;

  @override
  Widget build(BuildContext context) {
    final isTop3 = entry.rank <= 3;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          SizedBox(
            width: 32,
            child: isTop3
                ? _RankBadge(rank: entry.rank)
                : Text(
                    entry.rank.toString(),
                    style: AppTextStyles.mono.copyWith(fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
          ),
          const SizedBox(width: 12),
          _Avatar(nickname: entry.nickname),
          const SizedBox(width: 12),
          Expanded(
            child: Text(entry.nickname, style: AppTextStyles.titleMedium),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${entry.streak}일 연속',
                style: AppTextStyles.mono.copyWith(
                  color: AppColors.primary,
                  fontSize: 14,
                ),
              ),
              if (entry.rankChange != 0)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      entry.rankChange > 0
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 12,
                      color: entry.rankChange > 0 ? AppColors.up : AppColors.down,
                    ),
                    Text(
                      entry.rankChange.abs().toString(),
                      style: TextStyle(
                        fontSize: 11,
                        color: entry.rankChange > 0 ? AppColors.up : AppColors.down,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _WinrateRankList extends StatelessWidget {
  const _WinrateRankList({required this.entries});
  final List<WinrateRankEntry> entries;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            color: AppColors.backgroundSecondary,
            child: Row(
              children: [
                const Icon(Icons.info_outline, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 6),
                Text(
                  '분기별 집계 · 매 분기 초 리셋',
                  style: AppTextStyles.labelSmall,
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              itemCount: entries.length,
              separatorBuilder: (_, __) => const Divider(
                height: 1,
                color: AppColors.borderLight,
                indent: 20,
                endIndent: 20,
              ),
              itemBuilder: (_, i) => _WinrateRankItem(entry: entries[i]),
            ),
          ),
        ],
      ),
    );
  }
}

class _WinrateRankItem extends StatelessWidget {
  const _WinrateRankItem({required this.entry});
  final WinrateRankEntry entry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          SizedBox(
            width: 32,
            child: entry.rank <= 3
                ? _RankBadge(rank: entry.rank)
                : Text(
                    entry.rank.toString(),
                    style: AppTextStyles.mono.copyWith(fontSize: 14),
                    textAlign: TextAlign.center,
                  ),
          ),
          const SizedBox(width: 12),
          _Avatar(nickname: entry.nickname),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.nickname, style: AppTextStyles.titleMedium),
                Text(
                  '${entry.wins}/${entry.totalGames}',
                  style: AppTextStyles.labelSmall,
                ),
              ],
            ),
          ),
          Text(
            '${entry.winRate.toStringAsFixed(1)}%',
            style: AppTextStyles.mono.copyWith(
              color: AppColors.primary,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }
}

class _RankBadge extends StatelessWidget {
  const _RankBadge({required this.rank});
  final int rank;

  static const _colors = [
    Color(0xFFFFD700),
    Color(0xFFC0C0C0),
    Color(0xFFCD7F32),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: _colors[rank - 1].withValues(alpha: 0.2),
        shape: BoxShape.circle,
      ),
      child: rank == 1
          ? const Icon(Icons.emoji_events, size: 16, color: Color(0xFFFFD700))
          : Center(
              child: Text(
                rank.toString(),
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: _colors[rank - 1],
                ),
              ),
            ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.nickname});
  final String nickname;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      decoration: const BoxDecoration(
        color: AppColors.primaryLight,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          nickname.substring(0, 1),
          style: AppTextStyles.labelLarge.copyWith(color: AppColors.primary),
        ),
      ),
    );
  }
}
