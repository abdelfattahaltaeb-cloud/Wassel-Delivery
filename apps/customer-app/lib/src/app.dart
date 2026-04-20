import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'core/app_router.dart';
import 'core/app_theme.dart';
import 'l10n/app_localizations.dart';

class CustomerApp extends StatelessWidget {
  const CustomerApp({super.key});

  @override
  Widget build(BuildContext context) {
    const descriptor = MobileAppDescriptor(
      appName: 'تطبيق العملاء',
      appTagline: 'أساس جديد لتجربة الطلب والتتبع والدعم',
      environmentLabel: 'Customer foundation',
      seedColor: Color(0xFF0E7C66),
    );

    const routes = [
      MobilePlaceholderRoute(
        path: '/home',
        label: 'الرئيسية',
        title: 'الرئيسية',
        description:
            'منطقة البداية لاستكشاف الطلبات والخيارات الأساسية للعميل.',
        detail: 'سيتم ربط هذه الشاشة لاحقاً بإنشاء الطلبات، العناوين، والعروض.',
        icon: Icons.home_rounded,
      ),
      MobilePlaceholderRoute(
        path: '/tracking',
        label: 'التتبع',
        title: 'التتبع',
        description:
            'مكان مخصص لتتبع الطلب الحي ومراحله القادمة من الـ API المستقل.',
        detail:
            'الربط اللاحق سيستخدم WebSocket لإظهار تغيرات الحالة بشكل مباشر.',
        icon: Icons.location_searching_rounded,
      ),
      MobilePlaceholderRoute(
        path: '/orders',
        label: 'طلباتي',
        title: 'طلباتي',
        description:
            'أرشيف الطلبات السابقة والحالية ضمن رحلة عميل عربية أولاً.',
        detail:
            'ستعرض هذه الشاشة الفواتير، الحالات، وتفاصيل التنفيذ في المرحلة التالية.',
        icon: Icons.receipt_long_rounded,
      ),
      MobilePlaceholderRoute(
        path: '/account',
        label: 'الحساب',
        title: 'الحساب',
        description: 'إعدادات الحساب، العناوين، وقنوات التواصل مع فريق الدعم.',
        detail: 'ستربط لاحقاً بملف العميل، التفضيلات، وإدارة الجلسات المستقلة.',
        icon: Icons.person_rounded,
      ),
    ];

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Wassel Delivery Customer',
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
