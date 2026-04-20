import 'package:flutter/widgets.dart';

class AppLocalizations {
  const AppLocalizations(this.locale);

  final Locale locale;

  static const supportedLocales = [Locale('ar'), Locale('en')];

  static const delegate = _AppLocalizationsDelegate();

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  bool get isArabic => locale.languageCode == 'ar';

  String get foundationReady => isArabic ? 'أساس جاهز' : 'Foundation ready';

  String get localizationReadyTitle =>
      isArabic ? 'جاهزية اللغة' : 'Localization readiness';

  String get localizationReadyBody => isArabic
      ? 'التطبيق مجهز لدعم العربية والإنجليزية من خلال LocalizationsDelegate مستقل وقابل للتوسع.'
      : 'The app is prepared for Arabic and English through an independent localization delegate.';
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['ar', 'en'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async =>
      AppLocalizations(locale);

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) =>
      false;
}
