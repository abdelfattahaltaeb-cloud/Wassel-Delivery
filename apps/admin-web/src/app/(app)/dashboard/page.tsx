import { SectionPage } from '../../../components/section-page';

export default function DashboardPage() {
  return (
    <SectionPage
      title="لوحة التحكم"
      subtitle="ملخص تشغيلي تأسيسي يعرض المساحات الأساسية التي ستربط لاحقاً ببيانات حية من الـ API المستقل."
      metricA="08"
      metricALabel="أقسام تشغيلية أساسية"
      metricB="24/7"
      metricBLabel="جاهزية تصميمية للمراقبة"
    >
      <article className="page-card">
        <h3>المشهد التشغيلي</h3>
        <p>مساحة لعرض مؤشرات الطلبات النشطة، التأخير، وسلامة التوزيع لحظة بلحظة.</p>
      </article>
      <article className="page-card">
        <h3>التنبيهات الحرجة</h3>
        <p>مكان مخصص للتنبيهات التشغيلية القادمة من النظام الخلفي وقنوات الإشعار.</p>
      </article>
    </SectionPage>
  );
}
