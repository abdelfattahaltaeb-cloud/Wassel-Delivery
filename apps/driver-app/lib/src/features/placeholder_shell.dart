import 'package:flutter/material.dart';

import '../core/app_router.dart';
import '../l10n/app_localizations.dart';

class PlaceholderShell extends StatelessWidget {
  const PlaceholderShell({
    super.key,
    required this.descriptor,
    required this.routes,
    required this.currentRoute,
  });

  final MobileAppDescriptor descriptor;
  final List<MobilePlaceholderRoute> routes;
  final MobilePlaceholderRoute currentRoute;

  @override
  Widget build(BuildContext context) {
    final localization = AppLocalizations.of(context);
    final selectedIndex = routes.indexWhere(
      (route) => route.path == currentRoute.path,
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(currentRoute.title),
        actions: [
          Padding(
            padding: const EdgeInsetsDirectional.only(end: 16),
            child: Chip(label: Text(localization.foundationReady)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              gradient: LinearGradient(
                colors: [
                  descriptor.seedColor.withValues(alpha: 0.94),
                  descriptor.seedColor.withValues(alpha: 0.72),
                ],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  descriptor.environmentLabel,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  descriptor.appName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  descriptor.appTagline,
                  style: const TextStyle(color: Colors.white, height: 1.6),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    currentRoute.description,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    currentRoute.detail,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(height: 1.7),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    localization.localizationReadyTitle,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    localization.localizationReadyBody,
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(height: 1.7),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: selectedIndex < 0 ? 0 : selectedIndex,
        onDestinationSelected: (index) {
          final route = routes[index];
          if (route.path != currentRoute.path) {
            Navigator.of(context).pushReplacementNamed(route.path);
          }
        },
        destinations: [
          for (final route in routes)
            NavigationDestination(icon: Icon(route.icon), label: route.label),
        ],
      ),
    );
  }
}
