import { loginAction } from './actions';

export default function LoginPage() {
  return (
    <div className="login-layout">
      <section className="login-side">
        <div>
          <p className="eyebrow">Wassel Delivery Internal Platform</p>
          <h1 className="login-title">واجهة إدارة مستقلة مصممة للتشغيل اليومي في ليبيا</h1>
          <p className="login-copy">
            هذه الواجهة تمثل الأساس التشغيلي الجديد كلياً لمنصة Wassel Delivery بعيداً عن أي ربط مع الأنظمة السابقة.
          </p>
        </div>

        <div className="feature-list">
          <span className="feature-pill">إدارة الطلبات والتوزيع</span>
          <span className="feature-pill">متابعة السائقين والتجار</span>
          <span className="feature-pill">لوحات عربية أولاً وقابلة للتوسع</span>
        </div>
      </section>

      <section className="login-card">
        <div>
          <p className="eyebrow">Admin Access</p>
          <h2 className="login-title">تسجيل الدخول</h2>
          <p className="login-copy">
            شاشة دخول حية مرتبطة بخدمة المصادقة المستقلة في الـ API التشغيلي.
          </p>
        </div>

        <form className="login-form" action={loginAction}>
          <label className="field">
            <span className="input-label">البريد الوظيفي</span>
            <input className="input" type="email" name="email" placeholder="ops@wassel.delivery" required />
          </label>

          <label className="field">
            <span className="input-label">كلمة المرور</span>
            <input className="input" type="password" name="password" placeholder="••••••••" required />
          </label>

          <button className="submit-button" type="submit">
            دخول إلى مركز التحكم
          </button>
        </form>

        <p className="helper-text">
          يتم حفظ الجلسة في Cookies داخلية آمنة ومحمية من JavaScript على المتصفح.
        </p>
      </section>
    </div>
  );
}
