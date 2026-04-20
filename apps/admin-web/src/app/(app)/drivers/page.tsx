import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';
import { formatDriverStatus, getStatusTone } from '../../../lib/format';

type DriversResponse = {
  drivers: Array<{
    id: string;
    status: string;
    name: string;
    email: string;
    phoneNumber?: string | null;
    activeAssignments: number;
    vehicle?: { plateNumber: string; type: string; make?: string | null; model?: string | null } | null;
    latestAvailability?: { status: string; serviceArea?: { name: string } | null } | null;
  }>;
};

export default async function DriversPage() {
  const accessToken = await getAccessTokenOrRedirect();
  const response = await apiFetch<DriversResponse>('/drivers', { accessToken });

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Fleet Readiness</p>
          <h2 className="hero-title">السائقون</h2>
          <p className="hero-copy">متابعة جاهزية الأسطول، آخر توفر مسجل، والمهمات النشطة لكل سائق.</p>
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
        <div className="data-table">
          <div className="data-table-header">
            <span>السائق</span>
            <span>الحالة</span>
            <span>المركبة</span>
            <span>آخر توفر</span>
            <span>المهمات النشطة</span>
          </div>
          {response.drivers.map((driver) => (
            <div className="data-table-row" key={driver.id}>
              <span>
                <strong>{driver.name}</strong>
                <small>{driver.phoneNumber ?? driver.email}</small>
              </span>
              <span className={`badge badge-${getStatusTone(driver.status)}`}>{formatDriverStatus(driver.status)}</span>
              <span>{driver.vehicle ? `${driver.vehicle.make ?? ''} ${driver.vehicle.model ?? ''} · ${driver.vehicle.plateNumber}` : 'غير محددة'}</span>
              <span>{driver.latestAvailability?.serviceArea?.name ?? driver.latestAvailability?.status ?? 'غير متاح'}</span>
              <span>{driver.activeAssignments}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
