import Link from 'next/link';

import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect, getSessionUserOrRedirect } from '../../../lib/auth';
import { formatDateTime, getStatusTone } from '../../../lib/format';
import { activateUserAction, deactivateUserAction, resetPasswordAction } from './actions';

type UsersResponse = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role?: string | null;
    roles: string[];
    status: string;
    createdAt?: string | null;
    lastLoginAt?: string | null;
    createdBy?: string | null;
    profiles: {
      driver?: { id: string; status: string } | null;
      customer?: { id: string; defaultAddressLine?: string | null } | null;
      admin?: boolean;
    };
  }>;
};

const roleLabels: Record<string, string> = {
  super_admin: 'مدير أعلى',
  admin: 'مدير',
  dispatcher: 'موزع',
  finance: 'مالية',
  support: 'دعم',
  driver: 'مندوب',
  customer: 'عميل',
  merchant_admin: 'مدير تاجر'
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  INVITED: 'مدعو',
  SUSPENDED: 'معطل'
};

export default async function UsersPage() {
  const accessToken = await getAccessTokenOrRedirect();
  const session = await getSessionUserOrRedirect();
  const response = await apiFetch<UsersResponse>('/users', { accessToken });
  const canReset = session.user.roles.includes('super_admin') || session.user.permissions.includes('users.write');

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">إدارة المستخدمين</p>
          <h2 className="hero-title">المستخدمون والحسابات</h2>
          <p className="hero-copy">إنشاء مستخدمي الإدارة والمناديب والعملاء وربط الحسابات بالملفات التشغيلية.</p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-value">{response.users.length}</span>
            <span className="metric-label">إجمالي المستخدمين</span>
          </article>
          <article className="metric-card">
            <span className="metric-value">{response.users.filter((user) => user.status === 'ACTIVE').length}</span>
            <span className="metric-label">نشط</span>
          </article>
        </div>
      </header>

      <nav className="filter-bar" aria-label="إجراءات إدارة المستخدمين">
        <Link className="filter-chip filter-chip-active" href="/users/new">إنشاء مستخدم</Link>
        <Link className="filter-chip" href="/users/new-driver">إنشاء مندوب</Link>
        <Link className="filter-chip" href="/users/new-customer">إنشاء عميل</Link>
      </nav>

      <article className="page-card table-card">
        <div className="data-table users-table operational-table">
          <div className="data-table-header">
            <span>الاسم</span>
            <span>البريد</span>
            <span>الهاتف</span>
            <span>الدور</span>
            <span>الحالة</span>
            <span>الملف التشغيلي</span>
            <span>تاريخ الإنشاء</span>
            <span>آخر دخول</span>
            <span>أنشئ بواسطة</span>
            <span>إجراءات</span>
          </div>
          {response.users.map((user) => (
            <div className="data-table-row" key={user.id}>
              <span><strong>{user.name || user.email}</strong></span>
              <span>{user.email}</span>
              <span>{user.phone ?? 'غير متوفر'}</span>
              <span>{user.roles.map((role) => roleLabels[role] ?? role).join(' / ')}</span>
              <span className={`badge badge-${getStatusTone(user.status)}`}>{statusLabels[user.status] ?? user.status}</span>
              <span>{profileLabel(user)}</span>
              <span>{formatDateTime(user.createdAt)}</span>
              <span>{formatDateTime(user.lastLoginAt)}</span>
              <span>{user.createdBy ?? 'غير متوفر'}</span>
              <span className="action-stack">
                <Link className="secondary-link compact-button" href={`/users/${user.id}`}>تعديل</Link>
                <form action={user.status === 'ACTIVE' ? deactivateUserAction : activateUserAction}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button className="secondary-link compact-button action-link" type="submit">
                    {user.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل'}
                  </button>
                </form>
                {canReset ? (
                  <form className="inline-form" action={resetPasswordAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input className="input compact-input" name="temporaryPassword" type="password" placeholder="كلمة مرور مؤقتة" minLength={6} required />
                    <button className="secondary-link compact-button action-link" type="submit">إعادة تعيين كلمة المرور</button>
                  </form>
                ) : null}
              </span>
            </div>
          ))}
        </div>

        <div className="mobile-card-list">
          {response.users.map((user) => (
            <article className="mobile-record-card" key={user.id}>
              <div className="record-card-header">
                <strong>{user.name || user.email}</strong>
                <span className={`badge badge-${getStatusTone(user.status)}`}>{statusLabels[user.status] ?? user.status}</span>
              </div>
              <dl className="record-fields">
                <div><dt>البريد</dt><dd>{user.email}</dd></div>
                <div><dt>الهاتف</dt><dd>{user.phone ?? 'غير متوفر'}</dd></div>
                <div><dt>الدور</dt><dd>{user.roles.map((role) => roleLabels[role] ?? role).join(' / ')}</dd></div>
                <div><dt>الملف</dt><dd>{profileLabel(user)}</dd></div>
                <div><dt>آخر دخول</dt><dd>{formatDateTime(user.lastLoginAt)}</dd></div>
              </dl>
              <Link className="secondary-link inline-link" href={`/users/${user.id}`}>تعديل المستخدم</Link>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}

function profileLabel(user: UsersResponse['users'][number]) {
  if (user.profiles.driver) {
    return `مندوب · ${user.profiles.driver.status}`;
  }

  if (user.profiles.customer) {
    return 'عميل';
  }

  if (user.profiles.admin) {
    return 'إدارة';
  }

  return 'غير مرتبط';
}
