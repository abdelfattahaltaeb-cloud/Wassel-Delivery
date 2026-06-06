import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';
import { formatCurrency, formatDateTime, formatDriverStatus, getStatusTone } from '../../../lib/format';
import { notConfiguredLabel, unavailableLabel } from '../../../lib/operations';

type DriversResponse = {
  drivers: Array<{
    id: string;
    courierCode?: string | null;
    status: string;
    name: string;
    email: string;
    phoneNumber?: string | null;
    createdAt?: string | null;
    lastReceivedOrderDate?: string | null;
    codHeldAmount?: number | string | null;
    activeAssignments: number;
    vehicle?: { plateNumber: string; type: string; make?: string | null; model?: string | null } | null;
    latestAvailability?: { status: string; serviceArea?: { name: string } | null } | null;
  }>;
};

const transportLabels: Record<string, string> = {
  BIKE: 'دراجة',
  CAR: 'سيارة',
  VAN: 'فان'
};

export default async function DriversPage() {
  const accessToken = await getAccessTokenOrRedirect();
  const response = await apiFetch<DriversResponse>('/drivers', { accessToken });

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">جاهزية المناديب</p>
          <h2 className="hero-title">المناديب والسائقون</h2>
          <p className="hero-copy">متابعة بيانات المندوب، وسائل النقل، الرصيد التشغيلي، وحالة التوفر الحالية.</p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-value">{response.drivers.length}</span>
            <span className="metric-label">إجمالي السائقين</span>
          </article>
          <article className="metric-card">
            <span className="metric-value">{response.drivers.filter((driver) => driver.status === 'AVAILABLE').length}</span>
            <span className="metric-label">متاحون الآن</span>
          </article>
        </div>
      </header>

      <article className="page-card table-card">
        <div className="data-table drivers-table operational-table">
          <div className="data-table-header">
            <span>كود المندوب</span>
            <span>اسم المندوب</span>
            <span>الهاتف</span>
            <span>هاتف ثان</span>
            <span>البريد</span>
            <span>الفرع</span>
            <span>المدينة</span>
            <span>المنطقة</span>
            <span>وسيلة النقل</span>
            <span>المهمات النشطة</span>
            <span>آخر تصفير</span>
            <span>آخر طلب مستلم</span>
            <span>قيمة إيصال العهدة</span>
            <span>أنشئ بواسطة</span>
            <span>التوفر</span>
            <span>COD بعهدته</span>
          </div>
          {response.drivers.map((driver) => (
            <div className="data-table-row" key={driver.id}>
              <span>{driver.courierCode ?? unavailableLabel}</span>
              <span><strong>{driver.name}</strong></span>
              <span>{driver.phoneNumber ?? unavailableLabel}</span>
              <span>{notConfiguredLabel}</span>
              <span>{driver.email}</span>
              <span>{notConfiguredLabel}</span>
              <span>{notConfiguredLabel}</span>
              <span>{driver.latestAvailability?.serviceArea?.name ?? unavailableLabel}</span>
              <span>{driver.vehicle ? `${transportLabels[driver.vehicle.type] ?? 'مركبة'} · ${driver.vehicle.plateNumber}` : unavailableLabel}</span>
              <span>{driver.activeAssignments}</span>
              <span>{notConfiguredLabel}</span>
              <span>{formatDateTime(driver.lastReceivedOrderDate)}</span>
              <span>{notConfiguredLabel}</span>
              <span>{notConfiguredLabel}</span>
              <span className={`badge badge-${getStatusTone(driver.status)}`}>{formatDriverStatus(driver.status)}</span>
              <span>{formatCurrency(driver.codHeldAmount)}</span>
            </div>
          ))}
        </div>

        <div className="mobile-card-list">
          {response.drivers.map((driver) => (
            <article className="mobile-record-card" key={driver.id}>
              <div className="record-card-header">
                <strong>{driver.name}</strong>
                <span>{driver.courierCode ?? unavailableLabel}</span>
              </div>
              <dl className="record-fields">
                <div><dt>الهاتف</dt><dd>{driver.phoneNumber ?? unavailableLabel}</dd></div>
                <div><dt>هاتف ثان</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>البريد</dt><dd>{driver.email}</dd></div>
                <div><dt>الفرع</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>المدينة</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>المنطقة</dt><dd>{driver.latestAvailability?.serviceArea?.name ?? unavailableLabel}</dd></div>
                <div><dt>وسيلة النقل</dt><dd>{driver.vehicle ? `${transportLabels[driver.vehicle.type] ?? 'مركبة'} · ${driver.vehicle.plateNumber}` : unavailableLabel}</dd></div>
                <div><dt>المهمات النشطة</dt><dd>{driver.activeAssignments}</dd></div>
                <div><dt>آخر تصفير</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>آخر طلب مستلم</dt><dd>{formatDateTime(driver.lastReceivedOrderDate)}</dd></div>
                <div><dt>إيصال العهدة</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>أنشئ بواسطة</dt><dd>{notConfiguredLabel}</dd></div>
                <div><dt>التوفر</dt><dd><span className={`badge badge-${getStatusTone(driver.status)}`}>{formatDriverStatus(driver.status)}</span></dd></div>
                <div><dt>COD بعهدته</dt><dd>{formatCurrency(driver.codHeldAmount)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
