import 'package:equatable/equatable.dart';

class User extends Equatable {
  const User({
    required this.id,
    required this.nickname,
    required this.joinedAt,
    required this.currentStreak,
    required this.bestStreak,
    required this.totalPredictions,
    required this.correctPredictions,
  });

  final String id;
  final String nickname;
  final DateTime joinedAt;
  final int currentStreak;
  final int bestStreak;
  final int totalPredictions;
  final int correctPredictions;

  double get accuracy =>
      totalPredictions == 0 ? 0 : correctPredictions / totalPredictions;

  @override
  List<Object?> get props => [
        id,
        nickname,
        joinedAt,
        currentStreak,
        bestStreak,
        totalPredictions,
        correctPredictions,
      ];
}
