const surfaces = [
  {
    label: 'واجهة الإدارة',
    href: 'https://admin.wassel.net.ly',
    description: 'لوحة تشغيل مستقلة لفرق العمليات والدعم.'
  },
  {
    label: 'واجهة البرمجة',
    href: 'https://api.wassel.net.ly/health',
    description: 'نقطة الصحة العامة للـ API المستقل الخاص بـ Wassel Delivery.'
  }
];

const highlights = [
  {
    title: 'بنية مستقلة بالكامل',
    body: 'هذا النطاق مخصص فقط لـ Wassel Delivery ولا يعتمد على أي خدمة أو توجيه من Wassel Logistics.'
  },
  {
    title: 'سطح API مخصص',
    body: 'التطبيقات المحمولة والويب تتصل فقط بـ https://api.wassel.net.ly/api ضمن بيئة الإنتاج.'
  },
  {
    title: 'جاهزية تشغيلية',
    body: 'واجهة الإدارة، الـ API، والموقع الرسمي مصممة لتعمل كمنظومة نشر مستقلة ضمن مشروع GCP منفصل.'
  },
  {
    title: 'تركيز محلي',
    body: 'تم إعداد الرسائل والواجهات بما يخدم التشغيل اليومي لسوق التوصيل داخل ليبيا.'
  }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="masthead">
          <div>
            <p className="eyebrow">Wassel Delivery</p>
            <h1 className="title">منصة توصيل مستقلة على بنية تشغيل خاصة بها</h1>
            <p className="copy">
              هذا الموقع هو الواجهة الرسمية لـ Wassel Delivery على النطاق
              {' '}
              wassel.net.ly
              {' '}
              مع فصل كامل عن أي خدمات أو مسارات قديمة خارج هذا المشروع.
            </p>
            <div className="action-row">
              <a className="pill pill-primary" href="https://admin.wassel.net.ly">
                دخول الإدارة
              </a>
              <a className="pill pill-secondary" href="https://api.wassel.net.ly/build-info">
                معلومات الإصدار
              </a>
            </div>
          </div>

          <aside className="cta-card">
            <div>
              <p className="eyebrow">Surfaces</p>
              <p className="subcopy">
                كل سطح في الإنتاج له نطاق واضح ووظيفة محددة داخل نفس المشروع المستقل.
              </p>
            </div>

            <div className="cta-grid">
              {surfaces.map((surface) => (
                <a key={surface.href} className="link-tile" href={surface.href}>
                  <span>
                    <strong>{surface.label}</strong>
                    <br />
                    <small>{surface.description}</small>
                  </span>
                </a>
              ))}
            </div>
          </aside>
        </div>

        <div className="metrics">
          <article className="metric-card">
            <span className="metric-value">3</span>
            <span className="metric-label">أسطح إنتاجية مستقلة</span>
          </article>
          <article className="metric-card">
            <span className="metric-value">1</span>
            <span className="metric-label">مشروع GCP مخصص للتوصيل</span>
          </article>
          <article className="metric-card">
            <span className="metric-value">100%</span>
            <span className="metric-label">فصل مطلوب عن البنية القديمة</span>
          </article>
        </div>

        <div className="info-grid">
          {highlights.map((item) => (
            <article key={item.title} className="info-card">
              <h2 className="info-title">{item.title}</h2>
              <p className="copy">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}