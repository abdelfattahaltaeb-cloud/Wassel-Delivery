import { SectionPage } from '../../../components/section-page';

export default function ReportsPage() {
  return (
    <SectionPage
      title="التقارير"
      subtitle="واجهة لتقارير الأداء، الامتثال، والنمو مع اتجاه عربي أولاً في العرض والتحليل."
      metricA="RTL"
      metricALabel="تصميم عربي أولاً"
      metricB="TS"
      metricBLabel="أساس تقني صارم وقابل للتوسع"
    >
      <article className="page-card">
        <h3>مؤشرات الأداء</h3>
        <p>المكان المخصص لتقارير السرعة التشغيلية، نسب الإنجاز، والتأخير حسب المنطقة أو التاجر.</p>
      </article>
      <article className="page-card">
        <h3>تحليلات النمو</h3>
        <p>مساحة مستقبلية لعرض اتجاهات الطلبات، التوسع الجغرافي، واحتياجات السعة.</p>
      </article>
    </SectionPage>
  );
}
