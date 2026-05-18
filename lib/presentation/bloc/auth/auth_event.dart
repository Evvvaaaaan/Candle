part of 'auth_bloc.dart';

sealed class AuthEvent extends Equatable {
  const AuthEvent();
  @override
  List<Object?> get props => [];
}

final class AuthCheckRequested extends AuthEvent {
  const AuthCheckRequested();
}

final class AuthLoginRequested extends AuthEvent {
  const AuthLoginRequested(this.kakaoAccessToken);
  final String kakaoAccessToken;
  @override
  List<Object?> get props => [kakaoAccessToken];
}

final class AuthNicknameSubmitted extends AuthEvent {
  const AuthNicknameSubmitted(this.nickname);
  final String nickname;
  @override
  List<Object?> get props => [nickname];
}

final class AuthLogoutRequested extends AuthEvent {
  const AuthLogoutRequested();
}
