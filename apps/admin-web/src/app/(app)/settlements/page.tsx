import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';
import { formatCurrency, formatSettlementStatus, getStatusTone } from '../../../lib/format';

type SettlementsResponse = {
  settlements: Array<{
    id: string;
    direction: string;
    status: string;
    amount: string;
    currencyCode: string;
    ledgerCode: string;
    order: { referenceCode: string; merchant?: { name: string } | null };
  }>;
};

export default async function SettlementsPage() {
  const accessToken = await getAccessTokenOrRedirect();
  const response = await apiFetch<SettlementsResponse>('/settlements', { accessToken });

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Ledger View</p>
          <h2 className="hero-title">التسويات</h2>
          <p className="hero-copy">عرض حي لقيود COD والتسويات المعلقة المرتبطة بالطلبات والتجار.</p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-value">{response.settlements.length}</span>
            <span className="metric-label">قيود حالية</span>
          </article>
          <article className="metric-card">
            <span className="metric-value metric-value-compact">
              {formatCurrency(response.settlements.reduce((sum, settlement) => sum + Number(settlement.amount), 0))}
            </span>
            <span className="metric-label">إجمالي المبالغ</span>
          </article>
        </div>
      </header>

      <article className="page-card table-card">
        <div className="data-table">
          <div className="data-table-header">
            <span>الطلب</span>
            <span>التاجر</span>
            <span>النوع</span>
            <span>الحالة</span>
            <span>المبلغ</span>
            <span>دفتر القيد</span>
          </div>
          {response.settlements.map((settlement) => (
            <div className="data-table-row" key={settlement.id}>
              <span>{settlement.order.referenceCode}</span>
              <span>{settlement.order.merchant?.name ?? 'بدون تاجر'}</span>
              <span>{settlement.direction}</span>
              <span className={`badge badge-${getStatusTone(settlement.status)}`}>{formatSettlementStatus(settlement.status)}</span>
              <span>{formatCurrency(settlement.amount)}</span>
              <span>{settlement.ledgerCode}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
