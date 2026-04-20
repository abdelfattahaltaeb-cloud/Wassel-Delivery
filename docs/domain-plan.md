# Domain Plan

## Primary domains

- `wassel.net.ly`: company and customer-facing web entry point
- `api.wassel.net.ly`: backend API and realtime transport origin
- `admin.wassel.net.ly`: internal admin web console
- `track.wassel.net.ly`: customer and merchant delivery tracking interface

## Recommended ownership model

- Separate DNS records for each subdomain
- Separate TLS certificates per environment
- Separate runtime environment variables for each deploy target
- Separate CDN and caching policies for public, admin, and tracking surfaces

## Environment mapping

Suggested pattern:

- local: localhost ports only
- staging: `staging-api.<domain>` style or environment-specific private ingress
- production: canonical domains listed above

## Operational notes

- Do not point any record at an existing Wassel origin.
- Keep admin and public traffic isolated for security controls and caching behavior.
- Treat API and WebSocket ingress as part of the same backend security boundary.
