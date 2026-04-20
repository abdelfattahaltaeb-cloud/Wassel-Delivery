import { SectionPage } from '../../../components/section-page';

export default function SettlementsPage() {
  return (
    <SectionPage
      title="التسويات"
      subtitle="أساس لعرض التسويات المالية والفواتير والمصالحات بين النظام والتجار والسائقين."
      metricA="LYD"
      metricALabel="عملة تشغيل افتراضية"
      metricB="10.2"
      metricBLabel="دقة محفوظة للمبالغ"
    >
      <article className="page-card">
        <h3>سجل التسويات</h3>
        <p>المكان المستقبلي للتسويات، الحالات، والاستحقاقات حسب الطلب والشريك أو السائق.</p>
      </article>
      <article className="page-card">
        <h3>التحقق المالي</h3>
        <p>مساحة لتقارير المطابقة، الفروقات، وإقفال الفترات التشغيلية والمالية.</p>
      </article>
    </SectionPage>
  );
}
