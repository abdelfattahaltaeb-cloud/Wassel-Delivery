export type NavigationItem = {
  href: string;
  label: string;
  description: string;
};

export const navigationItems: NavigationItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', description: 'مراقبة العمليات والملخص التنفيذي' },
  { href: '/orders', label: 'الطلبات', description: 'متابعة دورة الطلبات' },
  { href: '/dispatch', label: 'التوزيع', description: 'إدارة التخصيص والتشغيل' },
  { href: '/drivers', label: 'السائقون', description: 'جاهزية السائقين والفرق' },
  { href: '/merchants', label: 'التجار', description: 'شركاء التشغيل والاتفاقيات' },
  { href: '/settlements', label: 'التسويات', description: 'الحركة المالية والتسوية' },
  { href: '/reports', label: 'التقارير', description: 'المؤشرات والتحليلات' },
  { href: '/settings', label: 'الإعدادات', description: 'إعدادات المنصة والبيئة' }
];
