import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createE2eHarness,
  destroyE2eHarness,
  developmentSeedUsers,
  getAuthHeader,
  loginAs,
  refreshWith
} from './helpers/test-harness';

test('auth login, refresh rotation, logout, and protected route access', async (t) => {
  const harness = await createE2eHarness();

  t.after(async () => {
    await destroyE2eHarness(harness);
  });

  const anonymousDashboard = await harness.http.get('/v1/dashboard-summary');
  assert.equal(anonymousDashboard.status, 401);

  const initialSession = await loginAs(harness.http, developmentSeedUsers.adminEmail);

  assert.ok(initialSession.accessToken);
  assert.ok(initialSession.refreshToken);
  assert.equal(initialSession.user.email, developmentSeedUsers.adminEmail);

  const meResponse = await harness.http
    .get('/v1/auth/me')
    .set(getAuthHeader(initialSession.accessToken));

  assert.equal(meResponse.status, 200);
  assert.equal(meResponse.body.user.email, developmentSeedUsers.adminEmail);

  const protectedDashboard = await harness.http
    .get('/v1/dashboard-summary')
    .set(getAuthHeader(initialSession.accessToken));

  assert.equal(protectedDashboard.status, 200);
  assert.equal(protectedDashboard.body.orders.total, 3);

  const rotatedSessionResponse = await refreshWith(harness.http, initialSession.refreshToken);
  assert.equal(rotatedSessionResponse.status, 200);
  assert.notEqual(rotatedSessionResponse.body.refreshToken, initialSession.refreshToken);

  const reusedRefreshAttempt = await refreshWith(harness.http, initialSession.refreshToken);
  assert.equal(reusedRefreshAttempt.status, 401);

  const familyRevokedAttempt = await refreshWith(
    harness.http,
    rotatedSessionResponse.body.refreshToken as string
  );
  assert.equal(familyRevokedAttempt.status, 401);

  const freshSession = await loginAs(harness.http, developmentSeedUsers.adminEmail);
  const logoutResponse = await harness.http
    .post('/v1/auth/logout')
    .set(getAuthHeader(freshSession.accessToken))
    .send({ refreshToken: freshSession.refreshToken });

  assert.equal(logoutResponse.status, 200);
  assert.equal(logoutResponse.body.success, true);

  const refreshAfterLogout = await refreshWith(harness.http, freshSession.refreshToken);
  assert.equal(refreshAfterLogout.status, 401);
});