import { SectionPage } from '../../../components/section-page';

export default function MerchantsPage() {
  return (
    <SectionPage
      title="التجار"
      subtitle="شاشة تأسيسية لإدارة الشركاء، سياساتهم، وتدفق الطلبات القادمة منهم."
      metricA="B2B"
      metricALabel="اتجاه تشغيلي للتوسع"
      metricB="API"
      metricBLabel="ربط مستقل للتجار لاحقاً"
    >
      <article className="page-card">
        <h3>سجل الشركاء</h3>
        <p>مساحة لقائمة التجار، جهات الاتصال، وأكواد التكامل الخاصة بكل شريك.</p>
      </article>
      <article className="page-card">
        <h3>سياسات الخدمة</h3>
        <p>مكان للربط لاحقاً مع حدود المدن، الأسعار، واتفاقيات مستوى الخدمة لكل تاجر.</p>
      </article>
    </SectionPage>
  );
}
