import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ApiError, apiFetch } from '../../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../../lib/auth';
import {
  formatCurrency,
  formatDateTime,
  formatOrderStatus,
  formatSettlementStatus,
  getStatusTone
} from '../../../../lib/format';

type OrderResponse = {
  order: {
    id: string;
    referenceCode: string;
    publicTrackingCode: string;
    status: string;
    totalAmount: string;
    codAmount: string;
    notes?: string | null;
    cancellationReason?: string | null;
    failureReason?: string | null;
    acceptedAt?: string | null;
    pickedUpAt?: string | null;
    deliveredAt?: string | null;
    merchant?: { name: string; code: string } | null;
    customer?: { user?: { firstName: string; lastName: string; phoneNumber?: string | null } | null } | null;
    assignedDriver?: { user: { firstName: string; lastName: string; phoneNumber?: string | null } } | null;
    city?: { name: string } | null;
    zone?: { name: string } | null;
    serviceArea?: { name: string } | null;
    stops: Array<{
      id: string;
      sequence: number;
      type: string;
      label: string;
      addressLine: string;
      contactName?: string | null;
      contactPhone?: string | null;
    }>;
    statusHistory: Array<{
      id: string;
      status: string;
      note?: string | null;
      createdAt: string;
      actorUser?: { firstName: string; lastName: string } | null;
      actorDriver?: { user?: { firstName: string; lastName: string } | null } | null;
    }>;
    proofOfDelivery?: {
      status: string;
      deliveredPhotoUrl?: string | null;
      otpCode?: string | null;
      deliveredAt?: string | null;
      failureReason?: string | null;
      recipientName?: string | null;
    } | null;
    settlements: Array<{
      id: string;
      direction: string;
      status: string;
      amount: string;
      ledgerCode: string;
      currencyCode: string;
      description?: string | null;
    }>;
  };
};

type TrackingResponse = {
  tracking: {
    locations: Array<{
      id: string;
      latitude: number;
      longitude: number;
      capturedAt: string;
      accuracyMeters?: number | null;
    }>;
  };
};

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const accessToken = await getAccessTokenOrRedirect();

  try {
    const [orderResponse, trackingResponse] = await Promise.all([
      apiFetch<OrderResponse>(`/orders/${orderId}`, { accessToken }),
      apiFetch<TrackingResponse>(`/tracking/orders/${orderId}/timeline`, { accessToken })
    ]);

    const { order } = orderResponse;
    const latestLocations = trackingResponse.tracking.locations;

    return (
      <section className="section-stack">
        <header className="hero-card detail-hero">
          <div>
            <p className="eyebrow">Order Detail</p>
            <h2 className="hero-title">{order.referenceCode}</h2>
            <p className="hero-copy">
              عرض تشغيلي كامل للطلب، التسلسل الزمني، نقاط التوقف، التتبع، وإثبات التسليم.
            </p>
          </div>

          <div className="metric-grid">
            <article className="metric-card">
              <span className={`badge badge-${getStatusTone(order.status)}`}>{formatOrderStatus(order.status)}</span>
              <span className="metric-label">الحالة الحالية</span>
            </article>
            <article className="metric-card">
              <span className="metric-value metric-value-compact">{formatCurrency(order.totalAmount)}</span>
              <span className="metric-label">قيمة الطلب</span>
            </article>
          </div>
        </header>

        <div className="detail-grid">
          <article className="page-card detail-card">
            <h3>الملخص الأساسي</h3>
            <dl className="details-list">
              <div><dt>التاجر</dt><dd>{order.merchant?.name ?? 'غير محدد'}</dd></div>
              <div><dt>العميل</dt><dd>{order.customer?.user ? `${order.customer.user.firstName} ${order.customer.user.lastName}` : 'غير محدد'}</dd></div>
              <div><dt>السائق الحالي</dt><dd>{order.assignedDriver ? `${order.assignedDriver.user.firstName} ${order.assignedDriver.user.lastName}` : 'غير مسند'}</dd></div>
              <div><dt>المدينة</dt><dd>{order.city?.name ?? 'غير محدد'}</dd></div>
              <div><dt>المنطقة</dt><dd>{order.zone?.name ?? 'غير محدد'}</dd></div>
              <div><dt>منطقة الخدمة</dt><dd>{order.serviceArea?.name ?? 'غير محدد'}</dd></div>
              <div><dt>رمز التتبع العام</dt><dd>{order.publicTrackingCode}</dd></div>
              <div><dt>مبلغ COD</dt><dd>{formatCurrency(order.codAmount)}</dd></div>
            </dl>
          </article>

          <article className="page-card detail-card">
            <h3>المحطات</h3>
            <div className="timeline-list">
              {order.stops.map((stop) => (
                <div className="timeline-item" key={stop.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{stop.label}</strong>
                    <p>{stop.addressLine}</p>
                    <p className="meta-copy">{stop.type} · التسلسل {stop.sequence}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="page-card detail-card">
            <h3>التسلسل الزمني</h3>
            <div className="timeline-list">
              {order.statusHistory.map((entry) => (
                <div className="timeline-item" key={entry.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{formatOrderStatus(entry.status)}</strong>
                    <p>{entry.note ?? 'لا توجد ملاحظة.'}</p>
                    <p className="meta-copy">
                      {entry.actorUser
                        ? `${entry.actorUser.firstName} ${entry.actorUser.lastName}`
                        : entry.actorDriver?.user
                          ? `${entry.actorDriver.user.firstName} ${entry.actorDriver.user.lastName}`
                          : 'النظام'}
                      {' · '}
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="page-card detail-card">
            <h3>إثبات التسليم والتتبع</h3>
            <p className="meta-copy">آخر مواقع السائق وإثبات التسليم المرتبط بالطلب.</p>
            <dl className="details-list compact-details">
              <div><dt>حالة POD</dt><dd>{order.proofOfDelivery?.status ?? 'PENDING'}</dd></div>
              <div><dt>المستلم</dt><dd>{order.proofOfDelivery?.recipientName ?? 'غير متاح'}</dd></div>
              <div><dt>وقت التسليم</dt><dd>{formatDateTime(order.proofOfDelivery?.deliveredAt)}</dd></div>
              <div><dt>OTP</dt><dd>{order.proofOfDelivery?.otpCode ?? 'غير متاح'}</dd></div>
            </dl>
            <div className="mini-list">
              {latestLocations.map((location) => (
                <div className="mini-list-item" key={location.id}>
                  <span>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                  <span>{formatDateTime(location.capturedAt)}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="page-card detail-card detail-card-wide">
            <h3>التسويات</h3>
            <div className="mini-table">
              <div className="mini-table-header">
                <span>النوع</span>
                <span>الحالة</span>
                <span>المبلغ</span>
                <span>دفتر القيد</span>
              </div>
              {order.settlements.map((settlement) => (
                <div className="mini-table-row" key={settlement.id}>
                  <span>{settlement.direction}</span>
                  <span className={`badge badge-${getStatusTone(settlement.status)}`}>{formatSettlementStatus(settlement.status)}</span>
                  <span>{formatCurrency(settlement.amount)}</span>
                  <span>{settlement.ledgerCode}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <Link className="secondary-link" href="/orders">
          العودة إلى قائمة الطلبات
        </Link>
      </section>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
