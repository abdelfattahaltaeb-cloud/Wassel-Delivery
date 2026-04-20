import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';
import { formatOrderStatus, getStatusTone } from '../../../lib/format';

type DispatchResponse = {
  jobs: Array<{
    id: string;
    referenceCode: string;
    status: string;
    merchant?: { name: string } | null;
    city?: { name: string } | null;
    serviceArea?: { name: string } | null;
    assignedDriver?: { user?: { firstName: string; lastName: string } | null } | null;
  }>;
};

export default async function DispatchPage() {
  const accessToken = await getAccessTokenOrRedirect();
  const response = await apiFetch<DispatchResponse>('/dispatch', { accessToken });

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Manual Dispatch</p>
          <h2 className="hero-title">التوزيع</h2>
          <p className="hero-copy">لوحة حية للطلبات المفتوحة الجاهزة للإسناد اليدوي أو المتابعة التشغيلية.</p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-value">{response.jobs.length}</span>
            <span className="metric-label">وظائف مفتوحة</span>
          </article>
          <article className="metric-card">
            <span className="metric-value">{response.jobs.filter((job) => job.status === 'ASSIGNED').length}</span>
            <span className="metric-label">قيد القبول</span>
          </article>
        </div>
      </header>

      <article className="page-card table-card">
        <div className="data-table">
          <div className="data-table-header">
            <span>الطلب</span>
            <span>التاجر</span>
            <span>الموقع</span>
            <span>السائق الحالي</span>
            <span>الحالة</span>
          </div>
          {response.jobs.map((job) => (
            <div className="data-table-row" key={job.id}>
              <span><strong>{job.referenceCode}</strong></span>
              <span>{job.merchant?.name ?? 'غير مرتبط'}</span>
              <span>{job.city?.name ?? 'بدون مدينة'} · {job.serviceArea?.name ?? 'بدون منطقة خدمة'}</span>
              <span>{job.assignedDriver?.user ? `${job.assignedDriver.user.firstName} ${job.assignedDriver.user.lastName}` : 'غير مسند'}</span>
              <span className={`badge badge-${getStatusTone(job.status)}`}>{formatOrderStatus(job.status)}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
