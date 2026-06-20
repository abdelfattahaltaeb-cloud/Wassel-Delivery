import { apiFetch } from '../../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../../lib/auth';
import { createUserAction } from '../actions';

type RolesResponse = {
  roles: Array<{ code: string; name: string }>;
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

export default async function NewUserPage() {
  const accessToken = await getAccessTokenOrRedirect();
  const roles = await apiFetch<RolesResponse>('/users/roles', { accessToken });

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">إدارة المستخدمين</p>
          <h2 className="hero-title">إنشاء مستخدم</h2>
          <p className="hero-copy">إنشاء حساب تشغيلي وربطه بملف مندوب أو عميل عند الحاجة.</p>
        </div>
      </header>

      <form className="page-card form-grid" action={createUserAction}>
        <label className="field">
          <span className="input-label">الاسم</span>
          <input className="input" name="name" required />
        </label>
        <label className="field">
          <span className="input-label">البريد الإلكتروني</span>
          <input className="input" name="email" type="email" required />
        </label>
        <label className="field">
          <span className="input-label">الهاتف</span>
          <input className="input" name="phone" required />
        </label>
        <label className="field">
          <span className="input-label">الدور</span>
          <select className="input" name="role" defaultValue="dispatcher" required>
            {roles.roles.map((role) => (
              <option key={role.code} value={role.code}>{roleLabels[role.code] ?? role.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="input-label">الحالة</span>
          <select className="input" name="status" defaultValue="ACTIVE">
            <option value="ACTIVE">نشط</option>
            <option value="SUSPENDED">معطل</option>
          </select>
        </label>
        <label className="field">
          <span className="input-label">كلمة المرور المؤقتة</span>
          <input className="input" name="temporaryPassword" type="password" minLength={6} required />
        </label>
        <label className="field detail-card-wide">
          <span className="input-label">العنوان الافتراضي للعميل إن وجد</span>
          <input className="input" name="defaultAddress" />
        </label>
        <label className="checkbox-field detail-card-wide">
          <input name="linkProfile" type="checkbox" />
          <span>ربط المستخدم بملف تشغيلي عند الحاجة</span>
        </label>
        <button className="submit-button detail-card-wide" type="submit">إنشاء مستخدم</button>
      </form>
    </section>
  );
}
