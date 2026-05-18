import '../../../core/errors/exceptions.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../models/user_model.dart';

abstract interface class AuthRemoteDataSource {
  Future<UserModel> loginWithKakao(String kakaoAccessToken);
  Future<UserModel> setNickname(String nickname);
  Future<UserModel> getMyProfile();
  Future<void> logout();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  const AuthRemoteDataSourceImpl(this._client);
  final ApiClient _client;

  @override
  Future<UserModel> loginWithKakao(String kakaoAccessToken) async {
    final response = await _client.post(
      ApiEndpoints.kakaoLogin,
      data: {'kakaoAccessToken': kakaoAccessToken},
    );
    return UserModel.fromJson(response['data'] as Map<String, dynamic>);
  }

  @override
  Future<UserModel> setNickname(String nickname) async {
    if (nickname.length < 2 || nickname.length > 10) {
      throw const ValidationException(message: '닉네임은 2~10자 사이로 입력해주세요.');
    }
    final response = await _client.post(
      ApiEndpoints.setNickname,
      data: {'nickname': nickname},
    );
    return UserModel.fromJson(response['data'] as Map<String, dynamic>);
  }

  @override
  Future<UserModel> getMyProfile() async {
    final response = await _client.get(ApiEndpoints.myProfile);
    return UserModel.fromJson(response['data'] as Map<String, dynamic>);
  }

  @override
  Future<void> logout() => _client.post(ApiEndpoints.logout);
}
