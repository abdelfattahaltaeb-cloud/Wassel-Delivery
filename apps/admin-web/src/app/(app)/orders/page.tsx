import { SectionPage } from '../../../components/section-page';

export default function OrdersPage() {
  return (
    <SectionPage
      title="الطلبات"
      subtitle="واجهة تأسيسية لإدارة دورة الطلب من الإنشاء وحتى التسليم أو الإلغاء."
      metricA="01"
      metricALabel="مسار طلب موحد"
      metricB="06"
      metricBLabel="حالات أساسية محفوظة في المخطط"
    >
      <article className="page-card">
        <h3>قائمة الطلبات</h3>
        <p>هنا ستظهر فلاتر، جداول، وحالات الطلبات فور ربط الصفحة بخدمات البيانات.</p>
      </article>
      <article className="page-card">
        <h3>أولويات التشغيل</h3>
        <p>مكان مخصص لإبراز الطلبات المتأخرة أو تلك التي تحتاج لتدخل مباشر من فريق العمليات.</p>
      </article>
    </SectionPage>
  );
}
