class SessionUser {
  const SessionUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.roles,
    required this.permissions,
  });

  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final List<String> roles;
  final List<String> permissions;

  String get displayName => '$firstName $lastName'.trim();

  factory SessionUser.fromJson(Map<String, dynamic> json) {
    final fullName = _readString(json, const ['name', 'fullName']);
    final firstName =
        _readString(json, const ['firstName', 'first_name']) ??
        _firstNameFrom(fullName);
    final lastName =
        _readString(json, const ['lastName', 'last_name']) ??
        _lastNameFrom(fullName);

    return SessionUser(
      id: _readString(json, const ['id', '_id']) ?? '',
      email: _readString(json, const ['email']) ?? '',
      firstName: firstName ?? '',
      lastName: lastName ?? '',
      roles: (json['roles'] as List<dynamic>? ?? const [])
          .map((role) => role.toString())
          .toList(),
      permissions: (json['permissions'] as List<dynamic>? ?? const [])
          .map((permission) => permission.toString())
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'roles': roles,
      'permissions': permissions,
    };
  }

  static String? _readString(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = json[key];
      if (value == null) {
        continue;
      }

      final stringValue = value.toString().trim();
      if (stringValue.isNotEmpty) {
        return stringValue;
      }
    }

    return null;
  }

  static String? _firstNameFrom(String? fullName) {
    if (fullName == null || fullName.trim().isEmpty) {
      return null;
    }

    return fullName.trim().split(RegExp(r'\s+')).first;
  }

  static String? _lastNameFrom(String? fullName) {
    if (fullName == null || fullName.trim().isEmpty) {
      return null;
    }

    final parts = fullName.trim().split(RegExp(r'\s+'));
    if (parts.length < 2) {
      return '';
    }

    return parts.sublist(1).join(' ');
  }
}

class AuthSession {
  const AuthSession({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final SessionUser user;

  factory AuthSession.fromJson(Map<String, dynamic> json) {
    final payload = _payload(json['data']) ?? json;
    final userPayload =
        _payload(payload['user']) ?? _payload(json['user']) ?? const {};
    final accessToken =
        _readString(payload, const ['accessToken', 'access_token', 'token']) ??
        _readString(json, const ['accessToken', 'access_token', 'token']) ??
        '';
    final refreshToken =
        _readString(payload, const ['refreshToken', 'refresh_token']) ??
        _readString(json, const ['refreshToken', 'refresh_token']) ??
        accessToken;

    return AuthSession(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: SessionUser.fromJson(userPayload),
    );
  }

  static Map<String, dynamic>? _payload(Object? value) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    return null;
  }

  static String? _readString(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      final value = json[key];
      if (value == null) {
        continue;
      }

      final stringValue = value.toString().trim();
      if (stringValue.isNotEmpty) {
        return stringValue;
      }
    }

    return null;
  }
}
