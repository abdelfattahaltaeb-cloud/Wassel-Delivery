import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/app_router.dart';
import 'core/app_theme.dart';
import 'l10n/app_localizations.dart';

class AdminMobileApp extends StatelessWidget {
  const AdminMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    const descriptor = MobileAppDescriptor(
      appName: 'تطبيق الإدارة المتنقل',
      appTagline: 'أساس إشرافي مستقل للعمليات الميدانية والاعتمادات',
      environmentLabel: 'Admin mobile foundation',
      seedColor: Color(0xFF8E5A2B),
    );

    const routes = [
      MobilePlaceholderRoute(
        path: '/overview',
        label: 'الرؤية العامة',
        title: 'الرؤية العامة',
        description:
            'لوحة سريعة لمديري العمليات عند التنقل بين الفرق والمناطق.',
        detail:
            'ستظهر هنا مؤشرات الطلبات، السائقين، والتنبيهات الحرجة في المرحلة التالية.',
        icon: Icons.visibility_rounded,
      ),
      MobilePlaceholderRoute(
        path: '/operations',
        label: 'العمليات',
        title: 'العمليات',
        description: 'مساحة للتعامل السريع مع الاستثناءات التشغيلية من الهاتف.',
        detail: 'سيتم ربط هذه الشاشة لاحقاً بقرارات التوزيع والتصعيد الميداني.',
        icon: Icons.hub_rounded,
      ),
      MobilePlaceholderRoute(
        path: '/approvals',
        label: 'الاعتمادات',
        title: 'الاعتمادات',
        description:
            'منطقة مخصصة للمراجعات السريعة والقبول أو الرفض حسب الدور.',
        detail: 'ستستخدم لاحقاً لموافقات السائقين، التجار، والتغييرات الحساسة.',
        icon: Icons.fact_check_rounded,
      ),
      MobilePlaceholderRoute(
        path: '/settings',
        label: 'الإعدادات',
        title: 'الإعدادات',
        description: 'إعدادات التطبيق الميداني وتفضيلات الاستخدام السريع.',
        detail: 'تربط لاحقاً بالهوية، اللغة، وإشعارات الإدارة المتنقلة.',
        icon: Icons.settings_rounded,
      ),
    ];

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Wassel Delivery Admin Mobile',
      theme: buildAppTheme(descriptor.seedColor),
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      onGenerateRoute: buildAppRouteFactory(
        descriptor: descriptor,
        routes: routes,
      ),
      initialRoute: routes.first.path,
    );
  }
}
