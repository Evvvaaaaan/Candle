import 'package:equatable/equatable.dart';

class StreakRankEntry extends Equatable {
  const StreakRankEntry({
    required this.rank,
    required this.nickname,
    required this.streak,
    required this.rankChange,
  });

  final int rank;
  final String nickname;
  final int streak;
  final int rankChange; // positive = improved, negative = dropped, 0 = same

  @override
  List<Object?> get props => [rank, nickname, streak, rankChange];
}

class WinrateRankEntry extends Equatable {
  const WinrateRankEntry({
    required this.rank,
    required this.nickname,
    required this.winRate,
    required this.totalGames,
    required this.wins,
    required this.rankChange,
  });

  final int rank;
  final String nickname;
  final double winRate;
  final int totalGames;
  final int wins;
  final int rankChange;

  @override
  List<Object?> get props => [rank, nickname, winRate, totalGames, wins, rankChange];
}

class MyRankInfo extends Equatable {
  const MyRankInfo({
    required this.rank,
    required this.rankChange,
    required this.value,
  });

  final int rank;
  final int rankChange;
  final String value;

  @override
  List<Object?> get props => [rank, rankChange, value];
}
