import { createCustomerAction } from '../actions';

export default function NewCustomerPage() {
  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">إدارة المستخدمين</p>
          <h2 className="hero-title">إنشاء عميل</h2>
          <p className="hero-copy">إنشاء حساب عميل للاستخدام المكتبي مع ربط ملف العميل الافتراضي.</p>
        </div>
      </header>

      <form className="page-card form-grid" action={createCustomerAction}>
        <label className="field"><span className="input-label">الاسم</span><input className="input" name="name" required /></label>
        <label className="field"><span className="input-label">البريد الإلكتروني</span><input className="input" name="email" type="email" required /></label>
        <label className="field"><span className="input-label">الهاتف</span><input className="input" name="phone" required /></label>
        <label className="field"><span className="input-label">المدينة</span><input className="input" name="city" required /></label>
        <label className="field"><span className="input-label">المنطقة</span><input className="input" name="area" /></label>
        <label className="field"><span className="input-label">العنوان الافتراضي</span><input className="input" name="defaultAddress" /></label>
        <label className="field"><span className="input-label">كلمة المرور المؤقتة</span><input className="input" name="temporaryPassword" type="password" minLength={6} required /></label>
        <label className="field">
          <span className="input-label">الحالة</span>
          <select className="input" name="status" defaultValue="ACTIVE">
            <option value="ACTIVE">نشط</option>
            <option value="SUSPENDED">معطل</option>
          </select>
        </label>
        <button className="submit-button detail-card-wide" type="submit">إنشاء عميل</button>
      </form>
    </section>
  );
}
