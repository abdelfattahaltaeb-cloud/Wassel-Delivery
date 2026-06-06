import Link from 'next/link';

import { apiFetch } from '../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../lib/auth';
import { formatCurrency, formatDateTime, formatOrderStatus, getStatusTone } from '../../../lib/format';
import {
  getDeliveryAddress,
  getParcelOperationalStage,
  getRecipientName,
  getRecipientPhone,
  getRouteSummary,
  getTimelineSummary,
  matchesParcelFilter,
  parcelFilters,
  type ParcelFilter,
  unavailableLabel
} from '../../../lib/operations';

type OrdersResponse = {
  orders: Array<{
    id: string;
    referenceCode: string;
    publicTrackingCode: string;
    status: string;
    paymentCollectionType?: string | null;
    totalAmount: string;
    codAmount: string;
    createdAt: string;
    updatedAt: string;
    merchant?: { name: string } | null;
    customer?: { user?: { firstName: string; lastName: string; phoneNumber?: string | null } | null } | null;
    assignedDriver?: { user?: { firstName: string; lastName: string } | null } | null;
    city?: { name: string } | null;
    zone?: { name: string } | null;
    serviceArea?: { name: string } | null;
    stops: Array<{
      type: string;
      label: string;
      addressLine: string;
      contactName?: string | null;
      contactPhone?: string | null;
    }>;
    statusHistory: Array<{ status: string; createdAt: string }>;
    settlements?: Array<{ status: string }> | null;
    proofOfDelivery?: { status: string } | null;
  }>;
};

export default async function OrdersPage({ searchParams }: { searchParams?: Promise<{ stage?: ParcelFilter }> }) {
  const accessToken = await getAccessTokenOrRedirect();
  const params = await searchParams;
  const activeFilter = params?.stage ?? 'all';
  const response = await apiFetch<OrdersResponse>('/orders', { accessToken });
  const activeOrders = response.orders.filter((order) => !['DELIVERED', 'FAILED_DELIVERY', 'CANCELLED'].includes(order.status));
  const filteredOrders = response.orders.filter((order) => matchesParcelFilter(order, activeFilter));

  return (
    <section className="section-stack">
      <header className="hero-card">
        <div>
          <p className="eyebrow">لوحة الطرود التشغيلية</p>
          <h2 className="hero-title">الطرود والطلبات</h2>
          <p className="hero-copy">متابعة الطرود حسب المرحلة التشغيلية، المندوب، الوجهة، وقيمة التحصيل.</p>
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

      <nav className="filter-bar" aria-label="تصفية مراحل الطرود">
        {parcelFilters.map((filter) => (
          <Link
            className={activeFilter === filter.key ? 'filter-chip filter-chip-active' : 'filter-chip'}
            href={filter.key === 'all' ? '/orders' : `/orders?stage=${filter.key}`}
            key={filter.key}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <article className="page-card table-card">
        <div className="data-table orders-table operational-table">
          <div className="data-table-header">
            <span>المرجع</span>
            <span>المرحلة</span>
            <span>العميل</span>
            <span>التاجر</span>
            <span>المستلم</span>
            <span>المدينة</span>
            <span>المنطقة</span>
            <span>العنوان</span>
            <span>الهاتف</span>
            <span>COD</span>
            <span>المندوب</span>
            <span>تاريخ الإنشاء</span>
            <span>آخر تحديث</span>
            <span>المسار</span>
            <span>التفاصيل</span>
          </div>
          {filteredOrders.map((order) => (
            <div className="data-table-row" key={order.id}>
              <span>
                <strong>{order.referenceCode}</strong>
                <small>{order.publicTrackingCode}</small>
              </span>
              <span>
                <span className={`badge badge-${getStatusTone(order.status)}`}>
                  {getParcelOperationalStage(order)}
                </span>
                <small>{formatOrderStatus(order.status)}</small>
              </span>
              <span>{order.customer?.user ? `${order.customer.user.firstName} ${order.customer.user.lastName}` : unavailableLabel}</span>
              <span>{order.merchant?.name ?? unavailableLabel}</span>
              <span>{getRecipientName(order.stops)}</span>
              <span>{order.city?.name ?? unavailableLabel}</span>
              <span>{order.zone?.name ?? order.serviceArea?.name ?? unavailableLabel}</span>
              <span>{getDeliveryAddress(order.stops)}</span>
              <span>{getRecipientPhone(order.stops)}</span>
              <span>{formatCurrency(order.codAmount)}</span>
              <span>
                {order.assignedDriver?.user
                  ? `${order.assignedDriver.user.firstName} ${order.assignedDriver.user.lastName}`
                  : unavailableLabel}
              </span>
              <span>{formatDateTime(order.createdAt)}</span>
              <span>{formatDateTime(order.updatedAt)}</span>
              <span>{getRouteSummary(order.stops)}<small>{getTimelineSummary(order.statusHistory)}</small></span>
              <span>
                <Link className="secondary-link inline-link" href={`/orders/${order.id}`}>
                  فتح الطلب
                </Link>
              </span>
            </div>
          ))}
        </div>

        <div className="mobile-card-list">
          {filteredOrders.map((order) => (
            <article className="mobile-record-card parcel-card" key={order.id}>
              <div className="record-card-header">
                <strong>{order.referenceCode}</strong>
                <span className={`badge badge-${getStatusTone(order.status)}`}>{getParcelOperationalStage(order)}</span>
              </div>
              <dl className="record-fields">
                <div><dt>العميل</dt><dd>{order.customer?.user ? `${order.customer.user.firstName} ${order.customer.user.lastName}` : unavailableLabel}</dd></div>
                <div><dt>التاجر</dt><dd>{order.merchant?.name ?? unavailableLabel}</dd></div>
                <div><dt>المستلم</dt><dd>{getRecipientName(order.stops)}</dd></div>
                <div><dt>المدينة</dt><dd>{order.city?.name ?? unavailableLabel}</dd></div>
                <div><dt>المنطقة</dt><dd>{order.zone?.name ?? order.serviceArea?.name ?? unavailableLabel}</dd></div>
                <div><dt>العنوان</dt><dd>{getDeliveryAddress(order.stops)}</dd></div>
                <div><dt>الهاتف</dt><dd>{getRecipientPhone(order.stops)}</dd></div>
                <div><dt>COD</dt><dd>{formatCurrency(order.codAmount)}</dd></div>
                <div><dt>المندوب</dt><dd>{order.assignedDriver?.user ? `${order.assignedDriver.user.firstName} ${order.assignedDriver.user.lastName}` : unavailableLabel}</dd></div>
                <div><dt>تاريخ الإنشاء</dt><dd>{formatDateTime(order.createdAt)}</dd></div>
                <div><dt>آخر تحديث</dt><dd>{formatDateTime(order.updatedAt)}</dd></div>
                <div><dt>المسار</dt><dd>{getRouteSummary(order.stops)} · {getTimelineSummary(order.statusHistory)}</dd></div>
              </dl>
              <Link className="secondary-link inline-link" href={`/orders/${order.id}`}>
                فتح تفاصيل الطرد
              </Link>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
