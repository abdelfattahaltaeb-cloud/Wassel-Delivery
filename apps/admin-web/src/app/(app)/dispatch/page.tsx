import { SectionPage } from '../../../components/section-page';

export default function DispatchPage() {
  return (
    <SectionPage
      title="التوزيع"
      subtitle="مساحة مخصصة لقرارات الإسناد والتوازن بين السعة والطلب والسرعة التشغيلية."
      metricA="Redis"
      metricALabel="جاهزية للإشارات السريعة"
      metricB="BullMQ"
      metricBLabel="أساس لمعالجة المهام الخلفية"
    >
      <article className="page-card">
        <h3>لوحة الإسناد</h3>
        <p>ستستخدم هذه الصفحة لتوزيع الطلبات على السائقين ومراقبة حالات القبول والرفض.</p>
      </article>
      <article className="page-card">
        <h3>توازن المناطق</h3>
        <p>مكان لمراقبة الضغط التشغيلي بحسب المدن والمناطق ومناطق الخدمة.</p>
      </article>
    </SectionPage>
  );
}
