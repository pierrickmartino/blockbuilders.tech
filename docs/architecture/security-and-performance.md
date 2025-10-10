# Security and Performance

## Security Requirements
**Frontend:**
- CSP: default-src 'self'; frame-ancestors none; script-src 'self' vercel.dev analytics; allow CoinDesk endpoint.
- XSS: Rely on React escaping; sanitize user-generated descriptions via DOMPurify; avoid raw HTML injection.
- Storage: Keep tokens in HttpOnly cookies; use localStorage only for non-sensitive preferences.

**Backend:**
- Input validation via Pydantic schemas + custom graph validator.
- Rate limiting with Envoy sidecar + Redis token bucket for mutation endpoints.
- CORS locked to Vercel domains per environment with strict methods/headers.

**Authentication:**
- Supabase access tokens limited to 60 minutes with silent refresh via auth helpers; store refresh tokens in HttpOnly cookies.
- Stream Supabase `auth.audit_log_events` into Datadog for anomaly detection and alerting.
- Enforce password and MFA policies through Supabase (min length ≥12, breached password checks, email domain allowlist).

## Performance Optimization
**Frontend:**
- Initial JS bundle target <250 KB for authenticated shell.
- Stream onboarding/backtest panels using React Server Components + Suspense.
- Cache API responses via React Query (stale-while-revalidate) and CDN for marketing pages.

**Backend:**
- P95 API latency target <150 ms; asynchronous DB driver (asyncpg) with connection pooling.
- Timescale compression + partial indexes on `status`, `owner_id`, and `created_at`.
- Redis caching for hot template metadata and comparison aggregates.
