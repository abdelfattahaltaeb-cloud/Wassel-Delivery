import { SectionPage } from '../../../components/section-page';

export default function DriversPage() {
  return (
    <SectionPage
      title="السائقون"
      subtitle="واجهة لتتبع جاهزية الأسطول، التوفر، والانضباط التشغيلي ضمن نظام مستقل."
      metricA="3"
      metricALabel="حالات توفر أساسية"
      metricB="WS"
      metricBLabel="ربط جاهز للتتبع اللحظي"
    >
      <article className="page-card">
        <h3>جاهزية الأسطول</h3>
        <p>هذه المساحة ستعرض الحالة المباشرة للسائقين ومواقعهم ومهامهم الحالية.</p>
      </article>
      <article className="page-card">
        <h3>الامتثال والتشغيل</h3>
        <p>مساحة مستقبلية للمستندات، القبول، الحظر، وسياسات الجودة التشغيلية.</p>
      </article>
    </SectionPage>
  );
}
