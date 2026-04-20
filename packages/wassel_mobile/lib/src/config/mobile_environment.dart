class WasselMobileEnvironment {
  const WasselMobileEnvironment({
    required this.apiBaseUrl,
    required this.seedPassword,
    required this.requestTimeout,
  });

  final String apiBaseUrl;
  final String seedPassword;
  final Duration requestTimeout;

  factory WasselMobileEnvironment.current() {
    return WasselMobileEnvironment(
      apiBaseUrl: _normalizedBaseUrl(
        const String.fromEnvironment(
          'WASSEL_API_BASE_URL',
          defaultValue: 'http://127.0.0.1:4000/v1',
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

  @override
  String toString() => 'WasselMobileEnvironment(apiBaseUrl: $apiBaseUrl)';
}
