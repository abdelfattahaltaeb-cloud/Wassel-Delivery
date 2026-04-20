import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:wassel_mobile/wassel_mobile.dart';

import 'core/app_router.dart';
import 'core/app_theme.dart';
import 'features/driver_root.dart';
import 'l10n/app_localizations.dart';

class DriverApp extends StatefulWidget {
  const DriverApp({super.key});

  @override
  State<DriverApp> createState() => _DriverAppState();
}

class _DriverAppState extends State<DriverApp> {
  late final WasselMobileEnvironment _environment;
  late final WasselApiClient _client;
  late final AuthRepository _authRepository;
  late final OrdersRepository _ordersRepository;
  late final TrackingRepository _trackingRepository;

  @override
  void initState() {
    super.initState();
    _environment = WasselMobileEnvironment.current();
    _client = WasselApiClient(
      environment: _environment,
      sessionNamespace: 'driver',
    );
    _authRepository = AuthRepository(_client);
    _ordersRepository = OrdersRepository(_client);
    _trackingRepository = TrackingRepository(_client);
  }

  @override
  Widget build(BuildContext context) {
    const descriptor = MobileAppDescriptor(
      appName: 'تطبيق السائقين',
      appTagline: 'أساس تشغيلي مستقل للمهام، التوصيل، والدخل',
      environmentLabel: 'Driver live API',
      seedColor: Color(0xFF1C4E80),
    );

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Wassel Delivery Driver',
      locale: const Locale('ar'),
      theme: buildAppTheme(descriptor.seedColor),
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: DriverRootScreen(
        descriptor: descriptor,
        environment: _environment,
        client: _client,
        authRepository: _authRepository,
        ordersRepository: _ordersRepository,
        trackingRepository: _trackingRepository,
      ),
    );
  }
}
