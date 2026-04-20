import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';

type MerchantsResponse = {
  merchants: Array<{
    id: string;
    code: string;
    name: string;
    contactName?: string | null;
    contactPhone?: string | null;
    city: string;
    serviceArea?: string | null;
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
          <p className="eyebrow">Partner Registry</p>
          <h2 className="hero-title">التجار</h2>
          <p className="hero-copy">سجل حي للتجار، جهات الاتصال، ومدى النشاط التشغيلي لكل شريك.</p>
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
        <div className="data-table">
          <div className="data-table-header">
            <span>الاسم</span>
            <span>الكود</span>
            <span>المدينة</span>
            <span>منطقة الخدمة</span>
            <span>جهة الاتصال</span>
            <span>الطلبات</span>
          </div>
          {response.merchants.map((merchant) => (
            <div className="data-table-row" key={merchant.id}>
              <span><strong>{merchant.name}</strong></span>
              <span>{merchant.code}</span>
              <span>{merchant.city}</span>
              <span>{merchant.serviceArea ?? 'غير محددة'}</span>
              <span>{merchant.contactName ?? 'بدون اسم'} · {merchant.contactPhone ?? 'بدون رقم'}</span>
              <span>{merchant.ordersCount}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
