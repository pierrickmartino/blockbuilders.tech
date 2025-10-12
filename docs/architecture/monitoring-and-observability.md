# Monitoring and Observability

## Monitoring Stack
- **Frontend:** Vercel Analytics + Sentry browser SDK with release tags and session replay for core flows.
- **Backend:** Datadog APM (FastAPI, Celery, Timescale) via OpenTelemetry exporters.
- **Error Tracking:** Sentry (frontend + backend) with Slack pager integration.
- **Performance Monitoring:** Datadog RUM, synthetic API checks, Timescale continuous aggregates for run durations.

## Key Metrics
**Frontend:** Core Web Vitals, JS error rate, API latency (React Query), guided onboarding completion.

**Backend:** Request rate, error rate, P95 latency, worker throughput, Redis queue depth, Timescale query performance.

## Log Index Tags
- `service:auth-gateway` – FastAPI auth endpoints and Supabase sync flows (Story 1.1 instrumentation target).
- `service:workspace-seeding` – Demo workspace provisioning pipeline including strategy creation and onboarding callouts.
- `env:{env}` – Deployment environment (`local`, `staging`, `prod`) for dashboards and monitors.
