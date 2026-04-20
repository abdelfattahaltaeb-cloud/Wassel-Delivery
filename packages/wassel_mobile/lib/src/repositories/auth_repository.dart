import '../core/api_client.dart';
import '../models/auth_models.dart';

class AuthRepository {
  const AuthRepository(this._client);

  final WasselApiClient _client;

  AuthSession? get currentSession => _client.currentSession;
  SessionUser? get currentUser => _client.currentUser;
  bool get isAuthenticated => _client.isAuthenticated;

  Future<void> bootstrap() => _client.bootstrap();

  Future<AuthSession> login({required String email, required String password}) {
    return _client.login(email: email, password: password);
  }

  Future<void> logout() => _client.logout();
}
