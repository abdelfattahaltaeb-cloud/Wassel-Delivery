import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';
import { formatDateTime } from '../../../lib/format';
import { notConfiguredLabel, unavailableLabel } from '../../../lib/operations';

type MerchantsResponse = {
  merchants: Array<{
    id: string;
    code: string;
    name: string;
    contactName?: string | null;
    contactPhone?: string | null;
    city: string;
    serviceArea?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    lastOrderCreatedAt?: string | null;
    ordersCount: number;
  }>;
};

export default async function MerchantsPage() {
  const accessToken = await getAccessTokenOrRedirect();
  const response = await apiFetch<MerchantsResponse>('/merchants', { accessToken });

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">سجل العملاء والتجار</p>
          <h2 className="hero-title">العملاء والتجار</h2>
          <p className="hero-copy">سجل تشغيلي لبيانات الشركاء، مناطق الخدمة، جهات الاتصال، وجاهزية حقول التشغيل القادمة.</p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-value">{response.merchants.length}</span>
            <span className="metric-label">شركاء نشطون</span>
          </article>
          <article className="metric-card">
            <span className="metric-value">{response.merchants.reduce((sum, merchant) => sum + merchant.ordersCount, 0)}</span>
            <span className="metric-label">إجمالي الطلبات المرتبطة</span>
          </article>
        </div>
      </header>

      <article className="page-card table-card">
        <div className="data-table merchants-table operational-table">
          <div className="data-table-header">
            <span>الكود</span>
            <span>الاسم التجاري</span>
            <span>شركة الشحن</span>
            <span>التصنيف</span>
            <span>المسؤول</span>
            <span>هاتف المسؤول</span>
            <span>المدينة</span>
            <span>منطقة الخدمة</span>
            <span>الفرع</span>
            <span>التخزين</span>
            <span>خدمة العملاء</span>
            <span>تاريخ الإنشاء</span>
            <span>أنشئ بواسطة</span>
            <span>آخر إرسال</span>
          </div>
          {response.merchants.map((merchant) => (
            <div className="data-table-row" key={merchant.id}>
              <span>{merchant.code}</span>
              <span><strong>{merchant.name}</strong></span>
              <span>واصل للتوصيل</span>
              <span>{notConfiguredLabel}</span>
              <span>{merchant.contactName ?? unavailableLabel}</span>
              <span>{merchant.contactPhone ?? unavailableLabel}</span>
              <span>{merchant.city}</span>
              <span>{merchant.serviceArea ?? unavailableLabel}</span>
              <span>{notConfiguredLabel}</span>
              <span>{notConfiguredLabel}</span>
              <span>{notConfiguredLabel}</span>
              <span>{formatDateTime(merchant.createdAt)}</span>
              <span>{notConfiguredLabel}</span>
              <span>{formatDateTime(merchant.lastOrderCreatedAt)}</span>
            </div>
          ))}
        </div>

        <div className="mobile-card-list">
          {response.merchants.map((merchant) => (
            <article className="mobile-record-card" key={merchant.id}>
              <div className="record-card-header">
                <strong>{merchant.name}</strong>
                <span>{merchant.code}</span>
              </div>
              <dl className="record-fields">
                <div><dt>شركة الشحن</dt><dd>واصل للتوصيل</dd></div>
                <div><dt>تصنيف العميل</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>المسؤول</dt><dd>{merchant.contactName ?? unavailableLabel}</dd></div>
                <div><dt>الهاتف</dt><dd>{merchant.contactPhone ?? unavailableLabel}</dd></div>
                <div><dt>المدينة</dt><dd>{merchant.city}</dd></div>
                <div><dt>المنطقة</dt><dd>{merchant.serviceArea ?? unavailableLabel}</dd></div>
                <div><dt>الفرع</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>خدمة التخزين</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>مالك خدمة العملاء</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>تاريخ الإنشاء</dt><dd>{formatDateTime(merchant.createdAt)}</dd></div>
                <div><dt>أنشئ بواسطة</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>آخر إرسال طرود</dt><dd>{formatDateTime(merchant.lastOrderCreatedAt)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
