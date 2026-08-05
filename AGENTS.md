# Wassel Delivery Guardrails

This repository and workspace are for Wassel Delivery only.

- Never use, modify, deploy, or infer configuration from Wassel Logistics for this repo.
- Never use the Logistics GCP project `wassel-logistics-478502`.
- Never use old Logistics Cloud Run services or Logistics runtime domains.
- Do not use `api.wassel.org.ly`, `wassel.org.ly`, `wassal.ly`, or other Logistics domains unless the user explicitly asks for a Logistics task later.

Delivery identity:

- GCP project: `wassel-delivery-27d8c`
- Region: `europe-west1`
- API base URL: `https://api.wassel.net.ly/api`
- Admin Web: `https://admin.wassel.net.ly`
- Public Web: `https://wassel.net.ly`

Before any deploy or cloud mutation:

- Verify the active gcloud project is `wassel-delivery-27d8c`.
- Verify the active Cloud Run region is `europe-west1`.
- Confirm the target service belongs to Wassel Delivery.

Secrets and local artifacts:

- Never commit `.env`, tokens, keys, keystores, service account JSON files, Firebase credentials, or local runtime artifacts.
- Never print secrets, refresh tokens, service account keys, private credentials, or Firebase tokens in logs or final responses.

Validation:

- Do not ask for screenshots for validation.
- Use commands, logs, tests, build results, HTTP responses, and Cloud/GitHub status checks.
