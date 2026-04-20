import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/app_router.dart';
import 'core/app_theme.dart';
import 'l10n/app_localizations.dart';

class DriverApp extends StatelessWidget {
  const DriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    const descriptor = MobileAppDescriptor(
      appName: 'تطبيق السائقين',
      appTagline: 'أساس تشغيلي مستقل للمهام، التوصيل، والدخل',
      environmentLabel: 'Driver foundation',
      seedColor: Color(0xFF1C4E80),
    );

    const routes = [
      MobilePlaceholderRoute(
        path: '/dashboard',
        label: 'المهام',
        title: 'المهام',
        description:
            'نقطة الانطلاق اليومية للسائق لرؤية المهام والحالة التشغيلية.',
        detail:
            'سيتم ربطها لاحقاً بمهام الاستلام والتسليم والتنبيهات المباشرة.',
        icon: Icons.dashboard_rounded,
      ),
      MobilePlaceholderRoute(
        path: '/deliveries',
        label: 'التوصيلات',
        title: 'التوصيلات',
        description: 'شاشة لمتابعة الرحلات الجارية والمقبلة ضمن دورة التوصيل.',
        detail: 'ستربط لاحقاً بخرائط الطريق، حالات الطلب، وإثبات التسليم.',
        icon: Icons.local_shipping_rounded,
      ),
      MobilePlaceholderRoute(
        path: '/earnings',
        label: 'الأرباح',
        title: 'الأرباح',
        description: 'واجهة تمهيدية لعرض الأداء اليومي ومستحقات السائق.',
        detail: 'ستتكامل لاحقاً مع التسويات وسجل الحركات المالية.',
        icon: Icons.payments_rounded,
      ),
      MobilePlaceholderRoute(
        path: '/profile',
        label: 'الحساب',
        title: 'الحساب',
        description: 'إعدادات السائق، الملف الشخصي، والحالة التشغيلية.',
        detail: 'سيتم توصيلها لاحقاً بالمستندات، التوافر، وقنوات الدعم.',
        icon: Icons.person_pin_rounded,
      ),
    ];

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Wassel Delivery Driver',
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
