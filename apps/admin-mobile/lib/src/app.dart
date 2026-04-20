import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:wassel_mobile/wassel_mobile.dart';

import 'core/app_router.dart';
import 'core/app_theme.dart';
import 'features/admin_root.dart';
import 'l10n/app_localizations.dart';

class AdminMobileApp extends StatefulWidget {
  const AdminMobileApp({super.key});

  @override
  State<AdminMobileApp> createState() => _AdminMobileAppState();
}

class _AdminMobileAppState extends State<AdminMobileApp> {
  late final WasselMobileEnvironment _environment;
  late final WasselApiClient _client;
  late final AuthRepository _authRepository;
  late final OrdersRepository _ordersRepository;
  late final OperationsRepository _operationsRepository;

  @override
  void initState() {
    super.initState();
    _environment = WasselMobileEnvironment.current();
    _client = WasselApiClient(
      environment: _environment,
      sessionNamespace: 'admin_mobile',
    );
    _authRepository = AuthRepository(_client);
    _ordersRepository = OrdersRepository(_client);
    _operationsRepository = OperationsRepository(_client);
  }

  @override
  Widget build(BuildContext context) {
    const descriptor = MobileAppDescriptor(
      appName: 'تطبيق الإدارة المتنقل',
      appTagline: 'أساس إشرافي مستقل للعمليات الميدانية والاعتمادات',
      environmentLabel: 'Admin mobile live API',
      seedColor: Color(0xFF8E5A2B),
    );

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Wassel Delivery Admin Mobile',
      locale: const Locale('ar'),
      theme: buildAppTheme(descriptor.seedColor),
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: AdminRootScreen(
        descriptor: descriptor,
        environment: _environment,
        client: _client,
        authRepository: _authRepository,
        ordersRepository: _ordersRepository,
        operationsRepository: _operationsRepository,
      ),
    );
  }
}
