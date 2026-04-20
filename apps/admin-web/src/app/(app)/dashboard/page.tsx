import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';
import { formatCurrency, getStatusTone } from '../../../lib/format';

type DashboardSummaryResponse = {
  orders: {
    total: number;
    active: number;
    delivered: number;
    failed: number;
  };
  fleet: {
    availableDrivers: number;
    busyDrivers: number;
  };
  merchants: number;
  finance: {
    pendingSettlementAmount: number;
    codVolume: number;
  };
};

type DispatchResponse = {
  jobs: Array<{
    id: string;
    referenceCode: string;
    status: string;
    merchant?: { name: string } | null;
    city?: { name: string } | null;
    assignedDriver?: { user?: { firstName: string; lastName: string } | null } | null;
  }>;
};

export default async function DashboardPage() {
  const accessToken = await getAccessTokenOrRedirect();
  const [summary, dispatchBoard] = await Promise.all([
    apiFetch<DashboardSummaryResponse>('/dashboard-summary', { accessToken }),
    apiFetch<DispatchResponse>('/dispatch', { accessToken })
  ]);

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Live Operations</p>
          <h2 className="hero-title">لوحة التحكم</h2>
          <p className="hero-copy">
            مؤشرات تشغيلية حية من النظام الخلفي تشمل الطلبات، الأسطول، والتسويات الجارية.
          </p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-value">{summary.orders.active}</span>
            <span className="metric-label">طلبات نشطة الآن</span>
          </article>
          <article className="metric-card">
            <span className="metric-value">{summary.fleet.availableDrivers}</span>
            <span className="metric-label">سائقون متاحون</span>
          </article>
        </div>
      </header>

      <div className="card-grid card-grid-dense">
        <article className="page-card">
          <h3>ملخص الطلبات</h3>
          <div className="stat-list">
            <div><span>إجمالي</span><strong>{summary.orders.total}</strong></div>
            <div><span>تم التسليم</span><strong>{summary.orders.delivered}</strong></div>
            <div><span>فشل التسليم</span><strong>{summary.orders.failed}</strong></div>
          </div>
        </article>

        <article className="page-card">
          <h3>الأسطول</h3>
          <div className="stat-list">
            <div><span>متاح</span><strong>{summary.fleet.availableDrivers}</strong></div>
            <div><span>مشغول</span><strong>{summary.fleet.busyDrivers}</strong></div>
            <div><span>التجار</span><strong>{summary.merchants}</strong></div>
          </div>
        </article>

        <article className="page-card">
          <h3>الماليات</h3>
          <div className="stat-list">
            <div><span>COD Volume</span><strong>{formatCurrency(summary.finance.codVolume)}</strong></div>
            <div><span>تسويات معلقة</span><strong>{formatCurrency(summary.finance.pendingSettlementAmount)}</strong></div>
          </div>
        </article>

        <article className="page-card">
          <h3>لوحة التوزيع المفتوحة</h3>
          <div className="mini-list">
            {dispatchBoard.jobs.slice(0, 4).map((job) => (
              <div className="mini-list-item" key={job.id}>
                <div>
                  <strong>{job.referenceCode}</strong>
                  <p className="meta-copy">{job.merchant?.name ?? 'بدون تاجر'} · {job.city?.name ?? 'بدون مدينة'}</p>
                </div>
                <span className={`badge badge-${getStatusTone(job.status)}`}>{job.status}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
