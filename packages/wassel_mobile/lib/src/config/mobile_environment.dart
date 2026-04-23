import 'package:flutter/foundation.dart';

class WasselMobileEnvironment {
  const WasselMobileEnvironment({
    required this.apiBaseUrl,
    required this.loginPath,
    required this.refreshPath,
    required this.logoutPath,
    required this.seedPassword,
    required this.requestTimeout,
  });

  final String apiBaseUrl;
  final String loginPath;
  final String? refreshPath;
  final String? logoutPath;
  final String seedPassword;
  final Duration requestTimeout;

  factory WasselMobileEnvironment.current() {
    final apiBaseUrl = _normalizedBaseUrl(
      const String.fromEnvironment(
        'WASSEL_API_BASE_URL',
        defaultValue: 'http://127.0.0.1:4000/v1',
      ),
    );
    _assertSupportedReleaseApiBaseUrl(apiBaseUrl);

    return WasselMobileEnvironment(
      apiBaseUrl: apiBaseUrl,
      loginPath: _normalizedPath(
        const String.fromEnvironment(
          'WASSEL_LOGIN_PATH',
          defaultValue: '/auth/login',
        ),
      ),
      refreshPath: _normalizedOptionalPath(
        const String.fromEnvironment(
          'WASSEL_REFRESH_PATH',
          defaultValue: '/auth/refresh',
        ),
      ),
      logoutPath: _normalizedOptionalPath(
        const String.fromEnvironment(
          'WASSEL_LOGOUT_PATH',
          defaultValue: '/auth/logout',
        ),
      ),
      seedPassword: const String.fromEnvironment(
        'WASSEL_SEED_DEV_PASSWORD',
        defaultValue: 'DevOnly123!ChangeMe',
      ),
      requestTimeout: const Duration(seconds: 20),
    );
  }

  static String _normalizedBaseUrl(String baseUrl) {
    if (baseUrl.endsWith('/')) {
      return baseUrl.substring(0, baseUrl.length - 1);
    }

    return baseUrl;
  }

  static String _normalizedPath(String path) {
    if (path.isEmpty) {
      throw StateError('WASSEL_LOGIN_PATH must not be empty.');
    }

    return path.startsWith('/') ? path : '/$path';
  }

  static String? _normalizedOptionalPath(String path) {
    if (path.isEmpty) {
      return null;
    }

    return _normalizedPath(path);
  }

  static void _assertSupportedReleaseApiBaseUrl(String baseUrl) {
    if (!kReleaseMode) {
      return;
    }

    final uri = Uri.tryParse(baseUrl);
    final host = (uri?.host.isNotEmpty == true ? uri!.host : baseUrl)
        .toLowerCase();

    if (_isLocalDevelopmentHost(host)) {
      throw StateError(
        'Release builds must use a reachable remote API endpoint. '
        'Received WASSEL_API_BASE_URL=$baseUrl.',
      );
    }
  }

  static bool _isLocalDevelopmentHost(String host) {
    if (host == 'localhost' || host == '::1') {
      return true;
    }

    if (host.startsWith('127.')) {
      return true;
    }

    if (host.startsWith('10.')) {
      return true;
    }

    if (host.startsWith('192.168.')) {
      return true;
    }

    final private172Range = RegExp(r'^172\.(1[6-9]|2[0-9]|3[0-1])\.');
    return private172Range.hasMatch(host);
  }

  @override
  String toString() =>
      'WasselMobileEnvironment(apiBaseUrl: $apiBaseUrl, loginPath: $loginPath)';
}
