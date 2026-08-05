# Wassel Delivery Low-Cost Testing Runbook

This runbook explains how to operate Wassel Delivery in controlled low-cost testing mode. It applies only to the Delivery project `wassel-delivery-27d8c` in `europe-west1`.

Do not use this runbook for Wassel Logistics. Do not deploy public web from this runbook.

## 1. Current Low-Cost Architecture

English:

- Backend API runs on Cloud Run as `wassel-delivery-api`.
- Admin Web runs on Cloud Run as `wassel-delivery-admin-web`.
- Public Web is intentionally disabled for now.
- Backend runs with `LOW_COST_MODE=true`.
- Redis and BullMQ workers are disabled in low-cost mode.
- No Memorystore Redis instance should exist.
- No VPC connector should be attached.
- Cloud Run services must use `min instances = 0` and `max instances = 1`.
- Cloud SQL `delivery-postgres` is used only during manual test windows.
- The active monthly budget target is 10 USD.

العربية:

- تعمل واجهة الـ Backend API على Cloud Run باسم `wassel-delivery-api`.
- تعمل لوحة التحكم Admin Web على Cloud Run باسم `wassel-delivery-admin-web`.
- الموقع العام Public Web متوقف حاليا عن قصد.
- يعمل الـ Backend مع `LOW_COST_MODE=true`.
- Redis و BullMQ workers معطلة في وضع التكلفة المنخفضة.
- يجب ألا توجد خدمة Memorystore Redis.
- يجب ألا يتم ربط VPC connector.
- يجب أن تكون Cloud Run بقيم `min instances = 0` و `max instances = 1`.
- قاعدة Cloud SQL باسم `delivery-postgres` تعمل فقط أثناء نافذة اختبار يدوية.
- هدف الميزانية الشهرية الحالي هو 10 دولار أمريكي.

## 2. Why Cloud SQL Must Stay Stopped

English:

Cloud SQL is the main always-on cost risk. Even a small instance can consume most of the 10 USD monthly target if it stays running all month. Keep `delivery-postgres` stopped outside testing by setting `activationPolicy=NEVER`.

العربية:

Cloud SQL هي أكبر مصدر تكلفة مستمرة. حتى النسخة الصغيرة قد تستهلك معظم ميزانية 10 دولار إذا بقيت تعمل طوال الشهر. لذلك يجب إبقاء `delivery-postgres` متوقفة خارج وقت الاختبار باستخدام `activationPolicy=NEVER`.

## 3. Start a Test Window

English:

Start Cloud SQL only when you are ready to test the API or Admin Web.

العربية:

شغل Cloud SQL فقط عندما تكون جاهزا لاختبار الـ API أو لوحة التحكم.

```bash
gcloud config set project wassel-delivery-27d8c
gcloud config set run/region europe-west1
gcloud sql instances patch delivery-postgres --activation-policy=ALWAYS --project=wassel-delivery-27d8c
gcloud sql instances describe delivery-postgres --project=wassel-delivery-27d8c --format='value(name,state,settings.activationPolicy)'
```

Exact start command:

```bash
gcloud sql instances patch delivery-postgres --activation-policy=ALWAYS --project=wassel-delivery-27d8c
```

Expected safe testing state: `RUNNABLE` and `ALWAYS`.

## 4. Stop Cloud SQL After Testing

English:

Stop Cloud SQL immediately after testing. Do this before leaving the machine or ending the session.

العربية:

أوقف Cloud SQL مباشرة بعد انتهاء الاختبار. نفذ ذلك قبل ترك الجهاز أو إنهاء الجلسة.

Exact stop command:

```bash
gcloud sql instances patch delivery-postgres --activation-policy=NEVER --project=wassel-delivery-27d8c
```

Verify:

```bash
gcloud sql instances describe delivery-postgres --project=wassel-delivery-27d8c --format='value(name,state,settings.activationPolicy)'
```

Expected low-cost state: `STOPPED` and `NEVER`.

## 5. Verify API Health

English:

Run these checks while Cloud SQL is running. The health response should show Postgres as `ok` and Redis as `disabled`.

العربية:

نفذ هذه الفحوصات أثناء تشغيل Cloud SQL. يجب أن تظهر حالة Postgres كـ `ok` وحالة Redis كـ `disabled`.

```bash
curl -i https://api.wassel.net.ly/api/health
curl -i https://api.wassel.net.ly/api/build-info
```

## 6. Verify Admin Web

English:

Confirm the Admin login page is reachable.

العربية:

تأكد أن صفحة تسجيل الدخول للوحة التحكم تعمل.

```bash
curl -i https://admin.wassel.net.ly/login
```

## 7. Confirm Redis and VPC Connector Are Not Running

English:

These commands should return no active Redis instances and no VPC connectors.

العربية:

يجب ألا تعرض هذه الأوامر أي Redis أو VPC connector نشط.

Confirm no Redis:

```bash
gcloud redis instances list --region=europe-west1 --project=wassel-delivery-27d8c
```

Confirm no VPC connector:

```bash
gcloud compute networks vpc-access connectors list --region=europe-west1 --project=wassel-delivery-27d8c
```

## 8. Confirm Cloud Run min=0 and max=1

English:

Inspect both services and confirm:

- `autoscaling.knative.dev/minScale` is absent or `0`.
- `autoscaling.knative.dev/maxScale` is `1`.
- Backend has `LOW_COST_MODE=true`.
- Backend has no `REDIS_*` environment variables.
- No VPC connector annotation is present.

العربية:

افحص الخدمتين وتأكد من التالي:

- `autoscaling.knative.dev/minScale` غير موجودة أو قيمتها `0`.
- `autoscaling.knative.dev/maxScale` قيمتها `1`.
- الـ Backend يحتوي على `LOW_COST_MODE=true`.
- الـ Backend لا يحتوي على متغيرات `REDIS_*`.
- لا توجد إعدادات VPC connector.

```bash
gcloud run services describe wassel-delivery-api --region=europe-west1 --project=wassel-delivery-27d8c
gcloud run services describe wassel-delivery-admin-web --region=europe-west1 --project=wassel-delivery-27d8c
```

Optional compact check:

```bash
gcloud run services list --region=europe-west1 --project=wassel-delivery-27d8c
```

## 9. Check the 10 USD Budget Alert

English:

Confirm the `Wassel Delivery 10 USD Monthly` budget exists with 50%, 80%, and 100% thresholds.

العربية:

تأكد من وجود ميزانية `Wassel Delivery 10 USD Monthly` بحدود تنبيه 50% و 80% و 100%.

```bash
gcloud billing budgets list --billing-account=01FE02-8EC0A1-E7D6F0
```

If the Billing Budgets API is disabled, enable it:

```bash
gcloud services enable billingbudgets.googleapis.com --project=wassel-delivery-27d8c
```

If the budget needs to be recreated:

```bash
gcloud billing budgets create --billing-account=01FE02-8EC0A1-E7D6F0 --display-name="Wassel Delivery 10 USD Monthly" --budget-amount=10USD --calendar-period=month --filter-projects=projects/wassel-delivery-27d8c --threshold-rule=percent=0.50 --threshold-rule=percent=0.80 --threshold-rule=percent=1.00
```

## 10. Emergency Shutdown

English:

Use these commands if cost increases unexpectedly. They stop the database and remove backend/admin Cloud Run services. Do not delete Artifact Registry images or other resources unless reviewed separately.

العربية:

استخدم هذه الأوامر إذا ارتفعت التكلفة بشكل غير متوقع. هذه الأوامر توقف قاعدة البيانات وتحذف خدمات Cloud Run للـ Backend والـ Admin فقط. لا تحذف صور Artifact Registry أو أي موارد أخرى إلا بعد مراجعة منفصلة.

Stop database:

```bash
gcloud sql instances patch delivery-postgres --activation-policy=NEVER --project=wassel-delivery-27d8c
```

Delete backend service:

```bash
gcloud run services delete wassel-delivery-api --region=europe-west1 --project=wassel-delivery-27d8c
```

Delete admin service:

```bash
gcloud run services delete wassel-delivery-admin-web --region=europe-west1 --project=wassel-delivery-27d8c
```

Verify shutdown:

```bash
gcloud sql instances describe delivery-postgres --project=wassel-delivery-27d8c --format='value(name,state,settings.activationPolicy)'
gcloud run services list --region=europe-west1 --project=wassel-delivery-27d8c
gcloud redis instances list --region=europe-west1 --project=wassel-delivery-27d8c
gcloud compute networks vpc-access connectors list --region=europe-west1 --project=wassel-delivery-27d8c
```

## 11. Important Rules

English:

- Do not restore Public Web unless explicitly approved.
- Do not create Redis or Memorystore.
- Do not attach a VPC connector.
- Do not set Cloud Run min instances above `0`.
- Do not set Cloud Run max instances above `1` for controlled testing.
- Do not leave Cloud SQL running after testing.
- Do not print or commit secrets.
- Do not touch Wassel Logistics.

العربية:

- لا تشغل Public Web إلا بموافقة صريحة.
- لا تنشئ Redis أو Memorystore.
- لا تربط VPC connector.
- لا تجعل Cloud Run min instances أكبر من `0`.
- لا تجعل Cloud Run max instances أكبر من `1` أثناء الاختبار المحدود.
- لا تترك Cloud SQL تعمل بعد الاختبار.
- لا تطبع ولا تحفظ الأسرار في Git.
- لا تلمس Wassel Logistics.
