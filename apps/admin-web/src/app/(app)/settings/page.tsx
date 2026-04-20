import { SectionPage } from '../../../components/section-page';

export default function SettingsPage() {
  return (
    <SectionPage
      title="الإعدادات"
      subtitle="منطقة التحكم بالبيئة، الثوابت التشغيلية، والخيارات التي ستدار لاحقاً من خلال الصلاحيات."
      metricA="3"
      metricALabel="بيئات مستهدفة"
      metricB="4"
      metricBLabel="نطاقات معتمدة في الخطة"
    >
      <article className="page-card">
        <h3>إعدادات البيئة</h3>
        <p>مساحة مستقبلية لربط النطاقات، مفاتيح التكامل، والسياسات الخاصة بكل بيئة.</p>
      </article>
      <article className="page-card">
        <h3>حوكمة المنصة</h3>
        <p>مكان لإدارة الثوابت العامة، مفاهيم التشغيل، والإعدادات الخاصة بالوصول واللغة.</p>
      </article>
    </SectionPage>
  );
}