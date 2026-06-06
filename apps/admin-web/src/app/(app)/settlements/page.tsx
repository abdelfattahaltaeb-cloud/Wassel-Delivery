import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';
import { formatCurrency, formatLedgerCode, formatSettlementStatus, getStatusTone } from '../../../lib/format';
import { getParcelOperationalStage } from '../../../lib/operations';

type SettlementsResponse = {
  settlements: Array<{
    id: string;
    direction: string;
    status: string;
    amount: string;
    currencyCode: string;
    ledgerCode: string;
    order: {
      referenceCode: string;
      status?: string;
      paymentCollectionType?: string | null;
      merchant?: { name: string } | null;
    };
  }>;
};

type OrdersResponse = {
  orders: Array<{
    id: string;
    referenceCode: string;
    status: string;
    paymentCollectionType?: string | null;
    codAmount: string;
    settlements?: Array<{ status: string }> | null;
  }>;
};

export default async function SettlementsPage() {
  const accessToken = await getAccessTokenOrRedirect();
  const [response, ordersResponse] = await Promise.all([
    apiFetch<SettlementsResponse>('/settlements', { accessToken }),
    apiFetch<OrdersResponse>('/orders', { accessToken })
  ]);
  const codPending = response.settlements.filter(
    (settlement) => settlement.ledgerCode === 'COD_COLLECTION' && settlement.status === 'PENDING'
  );
  const deliveredParcels = ordersResponse.orders.filter((order) => order.status === 'DELIVERED');
  const courierCustody = deliveredParcels.filter(
    (order) => Number(order.codAmount) > 0 && !order.settlements?.some((settlement) => settlement.status === 'POSTED')
  );
  const merchantSettlements = response.settlements.filter((settlement) => settlement.direction === 'CREDIT');
  const settledParcels = ordersResponse.orders.filter((order) =>
    order.settlements?.some((settlement) => settlement.status === 'POSTED')
  );
  const electronicPaidParcels = ordersResponse.orders.filter((order) => order.paymentCollectionType === 'PREPAID');

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">تقرير التسويات</p>
          <h2 className="hero-title">التسويات</h2>
          <p className="hero-copy">عرض تقريري آمن لفصل COD المعلق، عهدة المندوب، تسويات التاجر، والطرود المدفوعة إلكترونياً.</p>
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

      <section className="card-grid card-grid-dense">
        <article className="metric-card">
          <span className="metric-value metric-value-compact">{formatCurrency(codPending.reduce((sum, settlement) => sum + Number(settlement.amount), 0))}</span>
          <span className="metric-label">COD معلق</span>
        </article>
        <article className="metric-card">
          <span className="metric-value">{courierCustody.length}</span>
          <span className="metric-label">طرود بعهدة المندوب</span>
        </article>
        <article className="metric-card">
          <span className="metric-value">{merchantSettlements.length}</span>
          <span className="metric-label">قيود تسوية التاجر</span>
        </article>
        <article className="metric-card">
          <span className="metric-value">{deliveredParcels.length}</span>
          <span className="metric-label">طرود مسلمة</span>
        </article>
        <article className="metric-card">
          <span className="metric-value">{settledParcels.length}</span>
          <span className="metric-label">طرود موردة</span>
        </article>
        <article className="metric-card">
          <span className="metric-value">{electronicPaidParcels.length}</span>
          <span className="metric-label">مدفوعة إلكترونياً</span>
        </article>
      </section>

      <article className="page-card table-card">
        <div className="data-table settlements-table">
          <div className="data-table-header">
            <span>الطلب</span>
            <span>التاجر</span>
            <span>مرحلة الطرد</span>
            <span>النوع</span>
            <span>الحالة</span>
            <span>المبلغ</span>
            <span>دفتر القيد</span>
          </div>
          {response.settlements.map((settlement) => (
            <div className="data-table-row" key={settlement.id}>
              <span>{settlement.order.referenceCode}</span>
              <span>{settlement.order.merchant?.name ?? 'بدون تاجر'}</span>
              <span>{getParcelOperationalStage({
                status: settlement.order.status ?? 'CREATED',
                paymentCollectionType: settlement.order.paymentCollectionType,
                settlements: [{ status: settlement.status }]
              })}</span>
              <span>{settlement.direction === 'CREDIT' ? 'دائن' : 'مدين'}</span>
              <span className={`badge badge-${getStatusTone(settlement.status)}`}>{formatSettlementStatus(settlement.status)}</span>
              <span>{formatCurrency(settlement.amount)}</span>
              <span>{formatLedgerCode(settlement.ledgerCode)}</span>
            </div>
          ))}
        </div>

        <div className="mobile-card-list">
          {response.settlements.map((settlement) => (
            <article className="mobile-record-card" key={settlement.id}>
              <div className="record-card-header">
                <strong>{settlement.order.referenceCode}</strong>
                <span className={`badge badge-${getStatusTone(settlement.status)}`}>{formatSettlementStatus(settlement.status)}</span>
              </div>
              <dl className="record-fields">
                <div><dt>التاجر</dt><dd>{settlement.order.merchant?.name ?? 'بدون تاجر'}</dd></div>
                <div><dt>مرحلة الطرد</dt><dd>{getParcelOperationalStage({
                  status: settlement.order.status ?? 'CREATED',
                  paymentCollectionType: settlement.order.paymentCollectionType,
                  settlements: [{ status: settlement.status }]
                })}</dd></div>
                <div><dt>النوع</dt><dd>{settlement.direction === 'CREDIT' ? 'دائن' : 'مدين'}</dd></div>
                <div><dt>المبلغ</dt><dd>{formatCurrency(settlement.amount)}</dd></div>
                <div><dt>دفتر القيد</dt><dd>{formatLedgerCode(settlement.ledgerCode)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
