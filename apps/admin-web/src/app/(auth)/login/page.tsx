import Link from 'next/link';

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
            شاشة دخول تأسيسية للربط لاحقاً مع خدمة الهوية المستقلة في الـ API الجديد.
          </p>
        </div>

        <form className="login-form">
          <label className="field">
            <span className="input-label">البريد الوظيفي</span>
            <input className="input" type="email" placeholder="ops@wassel.net.ly" disabled />
          </label>

          <label className="field">
            <span className="input-label">كلمة المرور</span>
            <input className="input" type="password" placeholder="••••••••" disabled />
          </label>

          <button className="submit-button" type="button" disabled>
            ربط المصادقة في المرحلة التالية
          </button>
        </form>

        <p className="helper-text">
          للمعاينة الحالية، انتقل مباشرة إلى <Link href="/dashboard">لوحة التحكم</Link>.
        </p>
      </section>
    </div>
  );
}
