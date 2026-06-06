import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ApiError, apiFetch } from '../../../../lib/api';
import { getAccessTokenOrRedirect } from '../../../../lib/auth';
import {
  formatCurrency,
  formatDateTime,
  formatLedgerCode,
  formatOrderStatus,
  formatSettlementStatus,
  getStatusTone
} from '../../../../lib/format';
import {
  getDeliveryAddress,
  getParcelOperationalStage,
  getRecipientName,
  getRecipientPhone,
  getRouteSummary,
  unavailableLabel
} from '../../../../lib/operations';
import { assignCourierAction, updateOrderStatusAction } from './actions';

type OrderResponse = {
  order: {
    id: string;
    referenceCode: string;
    publicTrackingCode: string;
    status: string;
    paymentCollectionType?: string | null;
    totalAmount: string;
    codAmount: string;
    notes?: string | null;
    cancellationReason?: string | null;
    failureReason?: string | null;
    acceptedAt?: string | null;
    pickedUpAt?: string | null;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
    createdAt: string;
    updatedAt: string;
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
    assignments: Array<{
      id: string;
      status: string;
      note?: string | null;
      assignedAt: string;
      respondedAt?: string | null;
      assignedByUser?: { firstName: string; lastName: string } | null;
      driver?: { user?: { firstName: string; lastName: string } | null } | null;
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
      createdAt?: string | null;
      postedAt?: string | null;
    }>;
  };
};

type DriversResponse = {
  drivers: Array<{
    id: string;
    status: string;
    name: string;
    activeAssignments: number;
  }>;
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
    const [orderResponse, trackingResponse, driversResponse] = await Promise.all([
      apiFetch<OrderResponse>(`/orders/${orderId}`, { accessToken }),
      apiFetch<TrackingResponse>(`/tracking/orders/${orderId}/timeline`, { accessToken }),
      apiFetch<DriversResponse>('/drivers', { accessToken })
    ]);

    const { order } = orderResponse;
    const latestLocations = trackingResponse.tracking.locations;
    const assignableDrivers = driversResponse.drivers.filter((driver) => driver.status !== 'BLOCKED');
    const latestAssignment = order.assignments[0];
    const postedSettlement = order.settlements.find((settlement) => settlement.status === 'POSTED');

    return (
      <section className="section-stack">
        <header className="hero-card detail-hero">
          <div>
            <p className="eyebrow">تفاصيل الطرد</p>
            <h2 className="hero-title">{order.referenceCode}</h2>
            <p className="hero-copy">
              عرض تشغيلي كامل للطرد، بيانات المستلم، المندوب، التواريخ، التسويات، والتسلسل الزمني.
            </p>
          </div>

          <div className="metric-grid">
            <article className="metric-card">
              <span className={`badge badge-${getStatusTone(order.status)}`}>{formatOrderStatus(order.status)}</span>
              <span className="metric-label">الحالة الحالية</span>
            </article>
            <article className="metric-card">
              <span className={`badge badge-${getStatusTone(order.status)}`}>{getParcelOperationalStage(order)}</span>
              <span className="metric-label">المرحلة التشغيلية</span>
            </article>
            <article className="metric-card">
              <span className="metric-value metric-value-compact">{formatCurrency(order.codAmount)}</span>
              <span className="metric-label">تحصيل نقدي</span>
            </article>
          </div>
        </header>

        <div className="detail-grid">
          <article className="page-card detail-card">
            <h3>البيانات التشغيلية</h3>
            <dl className="details-list">
              <div><dt>مرجع الطرد</dt><dd>{order.referenceCode}</dd></div>
              <div><dt>الحالة الحالية</dt><dd>{formatOrderStatus(order.status)}</dd></div>
              <div><dt>المرحلة التشغيلية</dt><dd>{getParcelOperationalStage(order)}</dd></div>
              <div><dt>العميل</dt><dd>{order.customer?.user ? `${order.customer.user.firstName} ${order.customer.user.lastName}` : unavailableLabel}</dd></div>
              <div><dt>التاجر</dt><dd>{order.merchant?.name ?? unavailableLabel}</dd></div>
              <div><dt>المستلم</dt><dd>{getRecipientName(order.stops)}</dd></div>
              <div><dt>هاتف المستلم</dt><dd>{getRecipientPhone(order.stops)}</dd></div>
              <div><dt>المدينة</dt><dd>{order.city?.name ?? unavailableLabel}</dd></div>
              <div><dt>المنطقة</dt><dd>{order.zone?.name ?? order.serviceArea?.name ?? unavailableLabel}</dd></div>
              <div><dt>العنوان</dt><dd>{getDeliveryAddress(order.stops)}</dd></div>
              <div><dt>رمز التتبع العام</dt><dd>{order.publicTrackingCode}</dd></div>
              <div><dt>مبلغ COD</dt><dd>{formatCurrency(order.codAmount)}</dd></div>
              <div><dt>رسوم التوصيل</dt><dd>{formatCurrency(Number(order.totalAmount) - Number(order.codAmount))}</dd></div>
              <div><dt>المندوب الحالي</dt><dd>{order.assignedDriver ? `${order.assignedDriver.user.firstName} ${order.assignedDriver.user.lastName}` : unavailableLabel}</dd></div>
              <div><dt>تاريخ الإنشاء</dt><dd>{formatDateTime(order.createdAt)}</dd></div>
              <div><dt>تاريخ التعيين</dt><dd>{formatDateTime(latestAssignment?.assignedAt)}</dd></div>
              <div><dt>تاريخ الاستلام</dt><dd>{formatDateTime(order.pickedUpAt)}</dd></div>
              <div><dt>تاريخ التسليم</dt><dd>{formatDateTime(order.deliveredAt)}</dd></div>
              <div><dt>تاريخ التسوية</dt><dd>{formatDateTime(postedSettlement?.postedAt ?? postedSettlement?.createdAt)}</dd></div>
              <div><dt>ملاحظات الطلب</dt><dd>{order.notes ?? unavailableLabel}</dd></div>
              <div><dt>ملاحظات المندوب</dt><dd>{order.failureReason ?? order.cancellationReason ?? unavailableLabel}</dd></div>
              <div><dt>ملخص المسار</dt><dd>{getRouteSummary(order.stops)}</dd></div>
            </dl>
          </article>

          <article className="page-card detail-card">
            <h3>الإجراءات التشغيلية</h3>
            <p className="meta-copy">الإجراءات المفعلة هنا مرتبطة بتدفقات آمنة مدعومة حالياً، والباقي ظاهر كحجز مكان للمرحلة التالية.</p>
            <form className="action-stack" action={assignCourierAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <select className="compact-select wide-select" name="driverId" defaultValue="">
                <option value="" disabled>اختر مندوباً</option>
                {assignableDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} ({driver.activeAssignments})
                  </option>
                ))}
              </select>
              <input name="note" className="input" placeholder="ملاحظة التعيين" defaultValue="تعيين مندوب من تفاصيل الطرد" />
              <button className="submit-button compact-button" type="submit">
                تعيين مندوب
              </button>
            </form>

            <form className="action-stack" action={updateOrderStatusAction}>
              <input type="hidden" name="orderId" value={order.id} />
              <input name="note" className="input" placeholder="ملاحظة اختيارية" />
              <input name="failureReason" className="input" placeholder="سبب الفشل عند الحاجة" />
              <div className="button-row">
                {order.status === 'ASSIGNED' ? (
                  <button className="submit-button compact-button" name="action" value="driver-acceptance">
                    قبول المندوب للمهمة
                  </button>
                ) : null}
                {order.status === 'DRIVER_ACCEPTED' ? (
                  <button className="submit-button compact-button" name="action" value="pickup">
                    تسليم للمندوب
                  </button>
                ) : null}
                {order.status === 'PICKED_UP' ? (
                  <button className="submit-button compact-button" name="action" value="in-transit">
                    تحويل إلى الطريق
                  </button>
                ) : null}
                {order.status === 'PICKED_UP' || order.status === 'IN_TRANSIT' ? (
                  <>
                    <button className="submit-button compact-button" name="action" value="deliver">
                      تم التسليم
                    </button>
                    <button className="secondary-link inline-link action-link" name="action" value="fail-delivery">
                      فشل التسليم
                    </button>
                  </>
                ) : null}
                <button className="placeholder-button" type="button" disabled>تأجيل</button>
                <button className="placeholder-button" type="button" disabled>إرجاع الطرد</button>
                <button className="placeholder-button" type="button" disabled>تحويل إلى التجهيز</button>
              </div>
            </form>

            <div className="button-row">
              <button className="placeholder-button" type="button" disabled>طباعة الملصق</button>
              <button className="placeholder-button" type="button" disabled>طباعة بوليصة الشحن</button>
              <button className="placeholder-button" type="button" disabled>طباعة ملصق قبول الطرد</button>
            </div>
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
                    <p className="meta-copy">{stop.type === 'PICKUP' ? 'استلام' : 'تسليم'} · التسلسل {stop.sequence}</p>
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
              <div><dt>حالة إثبات التسليم</dt><dd>{formatOrderStatus(order.proofOfDelivery?.status ?? 'PENDING')}</dd></div>
              <div><dt>المستلم</dt><dd>{order.proofOfDelivery?.recipientName ?? unavailableLabel}</dd></div>
              <div><dt>وقت التسليم</dt><dd>{formatDateTime(order.proofOfDelivery?.deliveredAt)}</dd></div>
              <div><dt>رمز التحقق</dt><dd>{order.proofOfDelivery?.otpCode ?? unavailableLabel}</dd></div>
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
                  <span>{settlement.direction === 'CREDIT' ? 'دائن' : 'مدين'}</span>
                  <span className={`badge badge-${getStatusTone(settlement.status)}`}>{formatSettlementStatus(settlement.status)}</span>
                  <span>{formatCurrency(settlement.amount)}</span>
                  <span>{formatLedgerCode(settlement.ledgerCode)}</span>
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
