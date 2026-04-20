import 'package:flutter/material.dart';

import '../features/placeholder_shell.dart';

class MobileAppDescriptor {
  const MobileAppDescriptor({
    required this.appName,
    required this.appTagline,
    required this.environmentLabel,
    required this.seedColor,
  });

  final String appName;
  final String appTagline;
  final String environmentLabel;
  final Color seedColor;
}

class MobilePlaceholderRoute {
  const MobilePlaceholderRoute({
    required this.path,
    required this.label,
    required this.title,
    required this.description,
    required this.detail,
    required this.icon,
  });

  final String path;
  final String label;
  final String title;
  final String description;
  final String detail;
  final IconData icon;
}

RouteFactory buildAppRouteFactory({
  required MobileAppDescriptor descriptor,
  required List<MobilePlaceholderRoute> routes,
}) {
  return (settings) {
    final selectedRoute =
        routes.where((route) => route.path == settings.name).firstOrNull ??
        routes.first;

    return MaterialPageRoute<void>(
      settings: RouteSettings(name: selectedRoute.path),
      builder: (_) => PlaceholderShell(
        descriptor: descriptor,
        routes: routes,
        currentRoute: selectedRoute,
      ),
    );
  };
}
