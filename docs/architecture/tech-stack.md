# Tech Stack
| Layer | Technology | Rationale |
| --- | --- | --- |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind, Radix UI, Tremor UI, React Flow, Lucid icons | Matches UX spec, supports SSR/ISR, strong component ergonomics. |
| Frontend State | React Query + Zustand + Zustand persist | Separates server data from canvas draft state; optimistic UX for validation. |
| Backend | FastAPI, Uvicorn, SQLAlchemy, Pydantic v2 | High-performance async APIs with strict schema validation and OpenAPI generation. |
| Workers | Celery 5, Redis Streams, AWS Batch, Pandas, vectorbt | Durable backtests/paper trading with horizontal scaling and time-series tooling. |
| Database | Supabase Postgres (Timescale + pgvector) | Managed Postgres with row-level security, native time-series compression, analytical queries. |
| Cache/Queue | AWS ElastiCache for Redis | Job queue, transient cache, pub/sub for notifications. |
| Object Storage | Amazon S3 | Strategy exports, compliance evidence, large result sets. |
| Auth | Supabase Auth (JWT + Row Level Security) | Unified auth + Postgres policies, fast iteration without custom IAM plumbing. |
| Billing | Stripe Billing + Customer Portal | Enables freemium caps and premium upgrades with auditability. |
| Observability | Datadog APM + Logs, Sentry, OpenTelemetry | Meets NFR latency + anomaly detection requirements. |
| IaC & CI/CD | Terraform + Terragrunt, GitHub Actions, Vercel Deploy Hooks | Repeatable environments, automated build/test/deploy with approvals. |
