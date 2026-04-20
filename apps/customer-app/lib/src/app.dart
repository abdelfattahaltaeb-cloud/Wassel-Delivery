import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:wassel_mobile/wassel_mobile.dart';

import 'core/app_router.dart';
import 'core/app_theme.dart';
import 'features/customer_root.dart';
import 'l10n/app_localizations.dart';

class CustomerApp extends StatefulWidget {
  const CustomerApp({super.key});

  @override
  State<CustomerApp> createState() => _CustomerAppState();
}

class _CustomerAppState extends State<CustomerApp> {
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
      sessionNamespace: 'customer',
    );
    _authRepository = AuthRepository(_client);
    _ordersRepository = OrdersRepository(_client);
    _trackingRepository = TrackingRepository(_client);
  }

  @override
  Widget build(BuildContext context) {
    const descriptor = MobileAppDescriptor(
      appName: 'تطبيق العملاء',
      appTagline: 'أساس جديد لتجربة الطلب والتتبع والدعم',
      environmentLabel: 'Customer live API',
      seedColor: Color(0xFF0E7C66),
    );

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Wassel Delivery Customer',
      locale: const Locale('ar'),
      theme: buildAppTheme(descriptor.seedColor),
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: CustomerRootScreen(
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
