import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config/mobile_environment.dart';
import '../models/auth_models.dart';
import 'api_exception.dart';

class WasselApiClient extends ChangeNotifier {
  WasselApiClient({
    required this.environment,
    required this.sessionNamespace,
    http.Client? httpClient,
    FlutterSecureStorage? secureStorage,
  }) : _httpClient = httpClient ?? http.Client(),
       _secureStorage =
           secureStorage ??
           const FlutterSecureStorage(
             aOptions: AndroidOptions(encryptedSharedPreferences: true),
           );

  final WasselMobileEnvironment environment;
  final String sessionNamespace;
  final http.Client _httpClient;
  final FlutterSecureStorage _secureStorage;

  AuthSession? _currentSession;
  Completer<AuthSession?>? _refreshCompleter;

  AuthSession? get currentSession => _currentSession;
  SessionUser? get currentUser => _currentSession?.user;
  bool get isAuthenticated => _currentSession != null;

  Future<void> bootstrap() async {
    final accessToken = await _secureStorage.read(key: _key('access_token'));
    final refreshToken = await _secureStorage.read(key: _key('refresh_token'));
    final userJson = await _secureStorage.read(key: _key('session_user'));

    if (accessToken == null || refreshToken == null || userJson == null) {
      return;
    }

    final decodedUser = jsonDecode(userJson) as Map<String, dynamic>;
    _currentSession = AuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: SessionUser.fromJson(decodedUser),
    );
    notifyListeners();
  }

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final payload = await postJson(
      '/auth/login',
      authenticated: false,
      allowRefresh: false,
      body: {'email': email.trim(), 'password': password},
    );
    final session = AuthSession.fromJson(payload as Map<String, dynamic>);
    await _persistSession(session);

    return session;
  }

  Future<void> logout() async {
    final refreshToken = _currentSession?.refreshToken;

    if (_currentSession != null) {
      try {
        await postJson(
          '/auth/logout',
          allowRefresh: false,
          body: refreshToken == null
              ? const <String, dynamic>{}
              : {'refreshToken': refreshToken},
        );
      } catch (_) {
        // Local logout should still clear persisted session state.
      }
    }

    await clearSession();
  }

  Future<void> clearSession() async {
    _currentSession = null;
    await Future.wait([
      _secureStorage.delete(key: _key('access_token')),
      _secureStorage.delete(key: _key('refresh_token')),
      _secureStorage.delete(key: _key('session_user')),
    ]);
    notifyListeners();
  }

  Future<Object?> getJson(
    String path, {
    bool authenticated = true,
    bool allowRefresh = true,
    Map<String, String>? queryParameters,
  }) {
    return _send(
      method: 'GET',
      path: path,
      authenticated: authenticated,
      allowRefresh: allowRefresh,
      queryParameters: queryParameters,
    );
  }

  Future<Object?> postJson(
    String path, {
    Object? body,
    bool authenticated = true,
    bool allowRefresh = true,
    Map<String, String>? queryParameters,
  }) {
    return _send(
      method: 'POST',
      path: path,
      authenticated: authenticated,
      allowRefresh: allowRefresh,
      queryParameters: queryParameters,
      body: body,
    );
  }

  Future<Object?> _send({
    required String method,
    required String path,
    required bool authenticated,
    required bool allowRefresh,
    Map<String, String>? queryParameters,
    Object? body,
  }) async {
    final response = await _dispatch(
      method: method,
      path: path,
      authenticated: authenticated,
      queryParameters: queryParameters,
      body: body,
    );

    if (response.statusCode == 401 && authenticated && allowRefresh) {
      final refreshedSession = await _refreshSession();

      if (refreshedSession != null) {
        return _send(
          method: method,
          path: path,
          authenticated: authenticated,
          allowRefresh: false,
          queryParameters: queryParameters,
          body: body,
        );
      }
    }

    return _decodeResponse(response);
  }

  Future<http.Response> _dispatch({
    required String method,
    required String path,
    required bool authenticated,
    Map<String, String>? queryParameters,
    Object? body,
  }) {
    final uri = _buildUri(path, queryParameters);
    final headers = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      if (authenticated && _currentSession != null)
        'Authorization': 'Bearer ${_currentSession!.accessToken}',
    };

    final payload = body == null ? null : jsonEncode(body);

    switch (method) {
      case 'GET':
        return _httpClient
            .get(uri, headers: headers)
            .timeout(environment.requestTimeout);
      case 'POST':
        return _httpClient
            .post(uri, headers: headers, body: payload)
            .timeout(environment.requestTimeout);
      default:
        throw ApiException(message: 'Unsupported HTTP method: $method');
    }
  }

  Uri _buildUri(String path, Map<String, String>? queryParameters) {
    final normalizedPath = path.startsWith('/') ? path : '/$path';

    return Uri.parse('${environment.apiBaseUrl}$normalizedPath').replace(
      queryParameters: queryParameters == null || queryParameters.isEmpty
          ? null
          : queryParameters,
    );
  }

  Future<AuthSession?> _refreshSession() async {
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }

    final refreshToken = _currentSession?.refreshToken;

    if (refreshToken == null) {
      await clearSession();
      return null;
    }

    _refreshCompleter = Completer<AuthSession?>();

    try {
      final payload = await postJson(
        '/auth/refresh',
        authenticated: false,
        allowRefresh: false,
        body: {'refreshToken': refreshToken},
      );
      final session = AuthSession.fromJson(payload as Map<String, dynamic>);
      await _persistSession(session);
      _refreshCompleter!.complete(session);

      return session;
    } catch (_) {
      await clearSession();
      _refreshCompleter!.complete(null);

      return null;
    } finally {
      _refreshCompleter = null;
    }
  }

  Future<void> _persistSession(AuthSession session) async {
    _currentSession = session;
    await Future.wait([
      _secureStorage.write(
        key: _key('access_token'),
        value: session.accessToken,
      ),
      _secureStorage.write(
        key: _key('refresh_token'),
        value: session.refreshToken,
      ),
      _secureStorage.write(
        key: _key('session_user'),
        value: jsonEncode(session.user.toJson()),
      ),
    ]);
    notifyListeners();
  }

  Object? _decodeResponse(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        message: _extractErrorMessage(response.body),
        statusCode: response.statusCode,
      );
    }

    if (response.body.trim().isEmpty) {
      return null;
    }

    return jsonDecode(response.body);
  }

  String _extractErrorMessage(String body) {
    if (body.trim().isEmpty) {
      return 'تعذر تنفيذ الطلب حالياً.';
    }

    try {
      final decoded = jsonDecode(body);

      if (decoded is Map<String, dynamic>) {
        final message = decoded['message'];
        if (message is String && message.isNotEmpty) {
          return message;
        }
      }
    } catch (_) {
      return body;
    }

    return body;
  }

  String _key(String suffix) => 'wassel_mobile_${sessionNamespace}_$suffix';
}
