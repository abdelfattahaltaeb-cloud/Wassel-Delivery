import type { ReactNode } from 'react';

type SectionPageProps = {
  title: string;
  subtitle: string;
  metricA: string;
  metricALabel: string;
  metricB: string;
  metricBLabel: string;
  children?: ReactNode;
};

export function SectionPage({
  title,
  subtitle,
  metricA,
  metricALabel,
  metricB,
  metricBLabel,
  children
}: SectionPageProps) {
  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Arabic-first operations</p>
          <h2 className="hero-title">{title}</h2>
          <p className="hero-copy">{subtitle}</p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-value">{metricA}</span>
            <span className="metric-label">{metricALabel}</span>
          </article>
          <article className="metric-card">
            <span className="metric-value">{metricB}</span>
            <span className="metric-label">{metricBLabel}</span>
          </article>
        </div>
      </header>

      <div className="card-grid">{children}</div>
    </section>
  );
}
