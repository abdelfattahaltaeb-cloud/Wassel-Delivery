import { createDriverAction } from '../actions';

export default function NewDriverPage() {
  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">إدارة المستخدمين</p>
          <h2 className="hero-title">إنشاء مندوب</h2>
          <p className="hero-copy">ينشئ حساب مستخدم بدور مندوب ويربطه بملف السائق والتوفر التشغيلي.</p>
        </div>
      </header>

      <form className="page-card form-grid" action={createDriverAction}>
        <label className="field"><span className="input-label">اسم المندوب</span><input className="input" name="name" required /></label>
        <label className="field"><span className="input-label">البريد الإلكتروني</span><input className="input" name="email" type="email" required /></label>
        <label className="field"><span className="input-label">الهاتف</span><input className="input" name="phone" required /></label>
        <label className="field"><span className="input-label">هاتف ثان</span><input className="input" name="secondPhone" /></label>
        <label className="field"><span className="input-label">المدينة</span><input className="input" name="city" required /></label>
        <label className="field"><span className="input-label">المنطقة / نطاق الخدمة</span><input className="input" name="serviceArea" required /></label>
        <label className="field"><span className="input-label">الفرع</span><input className="input" name="branch" /></label>
        <label className="field">
          <span className="input-label">وسيلة النقل</span>
          <select className="input" name="transportMethod" defaultValue="CAR">
            <option value="CAR">سيارة</option>
            <option value="BIKE">دراجة</option>
            <option value="WALK">مشي</option>
            <option value="OTHER">أخرى</option>
          </select>
        </label>
        <label className="field"><span className="input-label">لوحة المركبة</span><input className="input" name="vehiclePlate" /></label>
        <label className="field"><span className="input-label">كلمة المرور المؤقتة</span><input className="input" name="temporaryPassword" type="password" minLength={8} required /></label>
        <label className="field">
          <span className="input-label">الحالة</span>
          <select className="input" name="status" defaultValue="ACTIVE">
            <option value="ACTIVE">نشط</option>
            <option value="SUSPENDED">معطل</option>
          </select>
        </label>
        <button className="submit-button detail-card-wide" type="submit">إنشاء مندوب</button>
      </form>
    </section>
  );
}
