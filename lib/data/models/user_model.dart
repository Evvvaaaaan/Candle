import '../../domain/entities/user.dart';

class UserModel extends User {
  const UserModel({
    required super.id,
    required super.nickname,
    required super.joinedAt,
    required super.currentStreak,
    required super.bestStreak,
    required super.totalPredictions,
    required super.correctPredictions,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String,
        nickname: json['nickname'] as String,
        joinedAt: DateTime.parse(json['joinedAt'] as String),
        currentStreak: json['currentStreak'] as int,
        bestStreak: json['bestStreak'] as int,
        totalPredictions: json['totalPredictions'] as int,
        correctPredictions: json['correctPredictions'] as int,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'nickname': nickname,
        'joinedAt': joinedAt.toIso8601String(),
        'currentStreak': currentStreak,
        'bestStreak': bestStreak,
        'totalPredictions': totalPredictions,
        'correctPredictions': correctPredictions,
      };
}
