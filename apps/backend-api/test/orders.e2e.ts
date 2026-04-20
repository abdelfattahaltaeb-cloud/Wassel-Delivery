import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCreateOrderPayload,
  createE2eHarness,
  destroyE2eHarness,
  developmentSeedTracking,
  developmentSeedUsers,
  getAuthHeader,
  loginAs
} from './helpers/test-harness';

test('orders, dispatch, tracking, and dashboard flows work end-to-end', async (t) => {
  const harness = await createE2eHarness();

  t.after(async () => {
    await destroyE2eHarness(harness);
  });

  const adminSession = await loginAs(harness.http, developmentSeedUsers.adminEmail);
  const driverSession = await loginAs(harness.http, developmentSeedUsers.driverEmail);

  const dashboardResponse = await harness.http
    .get('/v1/dashboard-summary')
    .set(getAuthHeader(adminSession.accessToken));

  assert.equal(dashboardResponse.status, 200);
  assert.equal(dashboardResponse.body.orders.total, 3);

  const ordersResponse = await harness.http
    .get('/v1/orders')
    .set(getAuthHeader(adminSession.accessToken));

  assert.equal(ordersResponse.status, 200);
  assert.equal(ordersResponse.body.orders.length, 3);

  const deliveryOrderResponse = await harness.http
    .post('/v1/orders')
    .set(getAuthHeader(adminSession.accessToken))
    .send(buildCreateOrderPayload(harness.seed, 'delivery'));

  assert.equal(deliveryOrderResponse.status, 201);

  const deliveryOrderId = deliveryOrderResponse.body.order.id as string;

  const manualAssignResponse = await harness.http
    .post(`/v1/dispatch/orders/${deliveryOrderId}/manual-assign`)
    .set(getAuthHeader(adminSession.accessToken))
    .send({ driverId: harness.seed.driverId, note: 'Assign delivery flow order.' });

  assert.equal(manualAssignResponse.status, 201);
  assert.equal(manualAssignResponse.body.order.status, 'ASSIGNED');

  const driverAcceptResponse = await harness.http
    .post(`/v1/orders/${deliveryOrderId}/driver-acceptance`)
    .set(getAuthHeader(driverSession.accessToken))
    .send({ note: 'Driver accepted delivery flow order.' });

  assert.equal(driverAcceptResponse.status, 201);
  assert.equal(driverAcceptResponse.body.order.status, 'DRIVER_ACCEPTED');

  const pickupResponse = await harness.http
    .post(`/v1/orders/${deliveryOrderId}/pickup`)
    .set(getAuthHeader(driverSession.accessToken))
    .send({ note: 'Driver picked up delivery flow order.' });

  assert.equal(pickupResponse.status, 201);
  assert.equal(pickupResponse.body.order.status, 'PICKED_UP');

  const inTransitResponse = await harness.http
    .post(`/v1/orders/${deliveryOrderId}/in-transit`)
    .set(getAuthHeader(driverSession.accessToken))
    .send({ note: 'Driver is en route.' });

  assert.equal(inTransitResponse.status, 201);
  assert.equal(inTransitResponse.body.order.status, 'IN_TRANSIT');

  const deliverResponse = await harness.http
    .post(`/v1/orders/${deliveryOrderId}/deliver`)
    .set(getAuthHeader(driverSession.accessToken))
    .send({
      note: 'Delivered to customer.',
      deliveredPhotoUrl: 'https://example.com/pod/e2e-delivery.jpg',
      otpCode: '1234',
      recipientName: 'Lina Customer'
    });

  assert.equal(deliverResponse.status, 201);
  assert.equal(deliverResponse.body.order.status, 'DELIVERED');
  assert.equal(deliverResponse.body.order.proofOfDelivery.status, 'DELIVERED');

  const failedOrderResponse = await harness.http
    .post('/v1/orders')
    .set(getAuthHeader(adminSession.accessToken))
    .send(buildCreateOrderPayload(harness.seed, 'failure'));

  assert.equal(failedOrderResponse.status, 201);

  const failedOrderId = failedOrderResponse.body.order.id as string;

  const failedAssignResponse = await harness.http
    .post(`/v1/dispatch/orders/${failedOrderId}/manual-assign`)
    .set(getAuthHeader(adminSession.accessToken))
    .send({ driverId: harness.seed.driverId, note: 'Assign failure flow order.' });

  assert.equal(failedAssignResponse.status, 201);
  assert.equal(failedAssignResponse.body.order.status, 'ASSIGNED');

  const failedAcceptResponse = await harness.http
    .post(`/v1/orders/${failedOrderId}/driver-acceptance`)
    .set(getAuthHeader(driverSession.accessToken))
    .send({ note: 'Driver accepted failure flow order.' });

  assert.equal(failedAcceptResponse.status, 201);

  const failedPickupResponse = await harness.http
    .post(`/v1/orders/${failedOrderId}/pickup`)
    .set(getAuthHeader(driverSession.accessToken))
    .send({ note: 'Driver picked up failure flow order.' });

  assert.equal(failedPickupResponse.status, 201);

  const failedTransitResponse = await harness.http
    .post(`/v1/orders/${failedOrderId}/in-transit`)
    .set(getAuthHeader(driverSession.accessToken))
    .send({ note: 'Failure flow order is in transit.' });

  assert.equal(failedTransitResponse.status, 201);

  const failDeliveryResponse = await harness.http
    .post(`/v1/orders/${failedOrderId}/fail-delivery`)
    .set(getAuthHeader(driverSession.accessToken))
    .send({
      failureReason: 'Customer unavailable',
      note: 'Customer could not be reached at the address.'
    });

  assert.equal(failDeliveryResponse.status, 201);
  assert.equal(failDeliveryResponse.body.order.status, 'FAILED_DELIVERY');
  assert.equal(failDeliveryResponse.body.order.proofOfDelivery.status, 'FAILED');

  const publicTrackingResponse = await harness.http.get(
    `/v1/tracking/public/${developmentSeedTracking.inTransitTrackingCode}`
  );

  assert.equal(publicTrackingResponse.status, 200);
  assert.equal(publicTrackingResponse.body.tracking.currentStatus, 'IN_TRANSIT');
  assert.ok(publicTrackingResponse.body.tracking.timeline.length >= 1);
});