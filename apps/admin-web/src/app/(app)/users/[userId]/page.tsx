import { apiFetch } from '../../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../../lib/auth';
import { updateUserAction } from '../actions';

type UserResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    role?: string | null;
    status: string;
  };
};

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

export default async function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const accessToken = await getAccessTokenOrRedirect();
  const { userId } = await params;
  const [userResponse, rolesResponse] = await Promise.all([
    apiFetch<UserResponse>(`/users/${userId}`, { accessToken }),
    apiFetch<RolesResponse>('/users/roles', { accessToken })
  ]);
  const user = userResponse.user;

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">إدارة المستخدمين</p>
          <h2 className="hero-title">تعديل مستخدم</h2>
          <p className="hero-copy">تعديل بيانات الحساب والحالة والدور وفق صلاحيات المستخدم الحالي.</p>
        </div>
      </header>

      <form className="page-card form-grid" action={updateUserAction}>
        <input type="hidden" name="userId" value={user.id} />
        <label className="field"><span className="input-label">الاسم</span><input className="input" name="name" defaultValue={user.name} required /></label>
        <label className="field"><span className="input-label">البريد الإلكتروني</span><input className="input" name="email" type="email" defaultValue={user.email} required /></label>
        <label className="field"><span className="input-label">الهاتف</span><input className="input" name="phone" defaultValue={user.phone ?? ''} required /></label>
        <label className="field">
          <span className="input-label">الدور</span>
          <select className="input" name="role" defaultValue={user.role ?? 'dispatcher'} required>
            {rolesResponse.roles.map((role) => (
              <option key={role.code} value={role.code}>{roleLabels[role.code] ?? role.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="input-label">الحالة</span>
          <select className="input" name="status" defaultValue={user.status}>
            <option value="ACTIVE">نشط</option>
            <option value="SUSPENDED">معطل</option>
            <option value="INVITED">مدعو</option>
          </select>
        </label>
        <button className="submit-button detail-card-wide" type="submit">حفظ التعديلات</button>
      </form>
    </section>
  );
}
