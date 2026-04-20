import Link from 'next/link';

import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';
import { formatCurrency, formatOrderStatus, getStatusTone } from '../../../lib/format';

type OrdersResponse = {
  orders: Array<{
    id: string;
    referenceCode: string;
    publicTrackingCode: string;
    status: string;
    totalAmount: string;
    codAmount: string;
    merchant?: { name: string } | null;
    assignedDriver?: { user?: { firstName: string; lastName: string } | null } | null;
    proofOfDelivery?: { status: string } | null;
  }>;
};

export default async function OrdersPage() {
  const accessToken = await getAccessTokenOrRedirect();
  const response = await apiFetch<OrdersResponse>('/orders', { accessToken });
  const activeOrders = response.orders.filter((order) => !['DELIVERED', 'FAILED_DELIVERY', 'CANCELLED'].includes(order.status));

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">Live Orders</p>
          <h2 className="hero-title">الطلبات</h2>
          <p className="hero-copy">قائمة حية لدورة الطلب من الإنشاء وحتى التسليم أو الفشل أو الإلغاء.</p>
        </div>

        <div className="metric-grid">
          <article className="metric-card">
            <span className="metric-value">{response.orders.length}</span>
            <span className="metric-label">إجمالي الطلبات</span>
          </article>
          <article className="metric-card">
            <span className="metric-value">{activeOrders.length}</span>
            <span className="metric-label">طلبات تحتاج متابعة</span>
          </article>
        </div>
      </header>

      <article className="page-card table-card">
        <div className="data-table orders-table">
          <div className="data-table-header">
            <span>المرجع</span>
            <span>التاجر</span>
            <span>السائق</span>
            <span>الحالة</span>
            <span>قيمة الطلب</span>
            <span>COD</span>
            <span>التفاصيل</span>
          </div>
          {response.orders.map((order) => (
            <div className="data-table-row" key={order.id}>
              <span>
                <strong>{order.referenceCode}</strong>
                <small>{order.publicTrackingCode}</small>
              </span>
              <span>{order.merchant?.name ?? 'غير مرتبط'}</span>
              <span>
                {order.assignedDriver?.user
                  ? `${order.assignedDriver.user.firstName} ${order.assignedDriver.user.lastName}`
                  : 'غير مسند'}
              </span>
              <span className={`badge badge-${getStatusTone(order.status)}`}>{formatOrderStatus(order.status)}</span>
              <span>{formatCurrency(order.totalAmount)}</span>
              <span>{formatCurrency(order.codAmount)}</span>
              <span>
                <Link className="secondary-link inline-link" href={`/orders/${order.id}`}>
                  فتح الطلب
                </Link>
              </span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
