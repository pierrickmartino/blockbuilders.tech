# Blockbuilders Fullstack Architecture Document

## Introduction
This document outlines the complete fullstack architecture for Blockbuilders, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project
N/A – greenfield project. We intentionally assemble a Turborepo monorepo combining a Next.js 15 App Router frontend with a FastAPI backend (as mandated by the PRD) so we can codify shared types, design tokens, and generated API clients while keeping services modular.

### Change Log
| Date | Version | Description | Author |
| 2025-09-22 | v0.4 | Documented operational playbooks, responsibility ownership, and resilience cadences | Winston (Architect) |
| 2025-09-21 | v0.3 | Synced with PRD v1.4 & UI spec v0.2: added plan guardrails, notification center, and responsive/accessibility guidance | Winston (Architect) |
| 2025-09-21 | v0.2 | Supabase adoption for auth and managed Postgres | Codex (AI) |
| 2025-09-20 | v0.1 | Initial fullstack architecture synthesized from PRD + UI spec | Winston (Architect) |

## Design Principles

### KISS - Keep It Simple, Stupid
- Simplicity should be a key goal design
- Choose straightforward solutions over complex ones whenever possible
- Simple solutions are easier to understand, maintain, and debug

### DRY - Don’t Repeat Yourself
- Every piece of knowledge should have a single, unambiguous representation in the system
- Avoid duplicating logic, code, or configuration
- Centralize shared functionality so that changes only need to be made once

### YAGNI - You Aren’t Gonna Need It
- Avoid building functionality on speculation
- Implement features only when they are needed, not when you anticipate they might be useful in the future

### TDA - Tell, Don’t Ask
- Objects should be told what to do, not interrogated for state to decide externally
- Encourages encapsulation and reduces coupling
- Leads to more expressive, maintainable, and object-oriented code

### Design Principles
- **Dependency Inversion**: High-level modules should not depend on low-level modules. Both should depend on abstractions.
- **Open/Closed Principle**: Software entities should be open for extension but closed for modification.
- **Vertical Slice Architecture**: Organize by features, not layers
- **Component-First**: Build with reusable, composable components with single responsibility
- **Fail Fast**: Validate inputs early, throw errors immediately

## High Level Architecture

### Technical Summary
Blockbuilders adopts a composable hybrid: the user experience is delivered by Next.js 15 on Vercel Edge, while a containerized FastAPI core on AWS Fargate exposes REST APIs, orchestrates simulations, and enforces compliance. Long-running backtests and paper-trading loops execute asynchronously through Celery workers on AWS Batch backed by Redis Streams and Supabase Postgres hypertables (Timescale extension). Supabase supplies managed Postgres, row-level security, and JWT-based auth that both frontend guards (Zustand + middleware) and backend policy checks consume. Object storage in S3 retains strategy exports, audit packages, and simulation artifacts (with Supabase Storage handling avatars and lightweight uploads), and Datadog/Sentry instrumentation spans every component so anomalies surface within the five-minute NFR window. Plan guardrails surface consistently across tiers through shared quota services, while the notification center, compliance disclosures, and mobile read-only dashboards consume the same APIs to honor the refreshed UX specification. This architecture keeps first-win onboarding fast, makes results trustworthy, and scales into community sharing without sacrificing governance or accessibility.

### Platform and Infrastructure Choice
**Option A – Vercel + Supabase + AWS workers (recommended):** Keeps Next.js on Vercel Edge while delegating auth, managed Postgres (Timescale + pgvector extensions), and lightweight storage to Supabase. AWS Fargate/Batch continue powering FastAPI and simulation workloads with minimal infrastructure drift.

**Platform:** Vercel Edge + Supabase (managed Postgres/Auth) + AWS us-east-1 compute
**Key Services:** Vercel edge hosting, Supabase (Postgres, Auth, Storage, Row Level Security), AWS Fargate (FastAPI), AWS Batch + Celery workers, AWS ElastiCache for Redis Streams, Amazon S3, AWS EventBridge, Stripe
**Deployment Host and Regions:** Vercel global edge (routing to IAD) + Supabase us-east-1 project + AWS us-east-1 for backend, workers, and data

### Repository Structure
Monorepo managed by Turborepo + pnpm. `apps/web` hosts the Next.js frontend, `apps/api` the FastAPI service, `apps/workers` the Celery worker fleet, and `packages` holds shared TypeScript types, generated OpenAPI clients, design tokens, and lint configs. Terraform in `infrastructure/terraform` provisions AWS, and `infrastructure/vercel` captures edge config.

### High Level Architecture Diagram
```mermaid
C4Container
Person(user, "Trader / Educator", "Uses the Blockbuilders workspace")
System_Boundary(blockbuilders, "Blockbuilders Platform") {
  Container(web, "Next.js App", "Vercel Edge", "Canvas, onboarding, dashboards")
  Container(api, "FastAPI Core", "AWS Fargate", "REST APIs, governance, orchestration")
  Container(worker, "Simulation Workers", "AWS Batch", "Backtests, paper trading, analytics")
  ContainerDb(db, "Supabase Postgres", "Managed Supabase (Timescale extension)", "Canonical state + time-series + RLS")
  Container(queue, "Redis Streams", "ElastiCache", "Job + alert queues")
  Container(storage, "Artifact Bucket", "S3", "Exports, trade logs, evidence")
  Container(notify, "Notification Service", "FastAPI/Celery", "Email, in-app, webhooks")
}
System_Ext(supabase_auth, "Supabase Auth", "JWT issuance + row-level policies")
System_Ext(stripe, "Stripe", "Billing + entitlements")
System_Ext(market, "Institutional Data API", "Historical + live prices")
Rel(user, web, "Builds strategies, monitors results")
Rel(web, api, "REST / SSE")
Rel(web, supabase_auth, "Auth flows, session refresh")
Rel(api, queue, "Publish jobs")
Rel(queue, worker, "Deliver workload")
Rel(worker, market, "Fetch price data")
Rel(worker, db, "Persist metrics")
Rel(api, db, "CRUD")
Rel(api, storage, "Store artifacts")
Rel(api, notify, "Trigger notifications")
Rel(api, supabase_auth, "Validate tokens / sync roles")
Rel(api, stripe, "Billing webhooks")
Rel(notify, user, "Emails & in-app alerts")
```

### Architectural Patterns
- Modular monorepo with shared contracts to prevent drift between UI and API.
- REST + async orchestration: synchronous CRUD, asynchronous Redis Streams + Celery for heavy simulations.
- Event-sourced compliance trail stored in Supabase Postgres (Timescale extension) and mirrored to S3 for tamper evidence.
- Progressive disclosure via a thin frontend service layer that aggregates backend responses to satisfy UI spec guardrails.
- Defense-in-depth security: Supabase JWT + row-level policies, signed Stripe and market-data webhooks, encrypted transport/storage everywhere.

## Tech Stack
| Layer | Technology | Rationale |
| --- | --- | --- |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind, React Flow, Radix UI, Lucid icons | Matches UX spec, supports SSR/ISR, strong component ergonomics. |
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

## Data Models

### User
**Purpose:** Authenticated actor (builder, tinkerer, educator, admin) owning strategies, templates, and notifications.

**Key Attributes:**
- id: UUID – Primary identifier from Supabase `auth.users`
- email: string – Unique contact for alerts
- display_name: string – Profile name
- roles: string[] – Role claims controlling access (builder, educator, admin)
- plan_tier: enum – free, premium, educator
- created_at: Date – Account creation timestamp
- last_active_at: Date – Engagement tracking

#### TypeScript Interface
```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: ("builder" | "educator" | "admin")[];
  planTier: "free" | "premium" | "educator";
  createdAt: string;
  lastActiveAt: string | null;
}
```

#### Relationships
- Has many Strategy, TemplateShare, Notification records
- Belongs to one SubscriptionPlan
- Drives quota enforcement and compliance approvals

### Strategy
**Purpose:** Canonical trading strategy artifact used across versions, templates, compliance, and collaboration.

**Key Attributes:**
- id: UUID – Primary key
- owner_id: UUID – User who owns the strategy
- title: string – Display name
- slug: string – URL-safe identifier
- status: enum – draft, active, archived
- visibility: enum – private, cohort, public
- tags: string[] – Search filters
- created_at / updated_at: Date – Audit timestamps

#### TypeScript Interface
```typescript
export interface Strategy {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  status: "draft" | "active" | "archived";
  visibility: "private" | "cohort" | "public";
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
```

#### Relationships
- Has many StrategyVersion entries
- Aggregates BacktestRun and PaperTradeRun metrics
- Linked to TemplateShare and ComplianceEvent entities

### StrategyVersion
**Purpose:** Immutable snapshot of a strategy graph used for validation, simulations, and publication.

**Key Attributes:**
- id: UUID – Primary key
- strategy_id: UUID – Parent strategy
- version: int – Monotonic version number
- graph_json: jsonb – Serialized block graph
- notes: string – Changelog notes
- created_by: UUID – Author
- created_at: Date – Audit timestamp

#### TypeScript Interface
```typescript
export interface StrategyVersion {
  id: string;
  strategyId: string;
  version: number;
  graphJson: StrategyGraph;
  notes: string;
  createdBy: string;
  createdAt: string;
}
```

#### Relationships
- Belongs to Strategy
- Referenced by BacktestRun, PaperTradeRun, TemplateShare
- Subject to ComplianceEvent review before publication

### BacktestRun
**Purpose:** Historical simulation request + results for a specific strategy version.

**Key Attributes:**
- id: UUID – Primary key
- strategy_version_id: UUID – Version executed
- requested_by: UUID – Initiating user
- parameters: jsonb – Range, exchange, capital
- status: enum – queued, running, succeeded, failed
- metrics: jsonb – KPIs, equity curve, anomalies
- started_at / completed_at: Date – Timing details

#### TypeScript Interface
```typescript
export interface BacktestRun {
  id: string;
  strategyVersionId: string;
  requestedBy: string;
  parameters: BacktestParameters;
  status: "queued" | "running" | "succeeded" | "failed";
  metrics: BacktestMetrics | null;
  startedAt: string | null;
  completedAt: string | null;
}
```

#### Relationships
- Belongs to StrategyVersion
- Emits Notification entries on completion/failure
- Populates comparison dashboards via materialized views

### PaperTradeRun
**Purpose:** Scheduled or continuous simulation mirroring live execution assumptions.

**Key Attributes:**
- id: UUID – Primary key
- strategy_version_id: UUID – Version monitored
- schedule: jsonb – Frequency, exchanges, capital
- status: enum – scheduled, active, paused, stopped
- performance_snapshot: jsonb – KPI summary
- alert_config: jsonb – Thresholds for anomalies
- last_execution_at: Date – Most recent tick

#### TypeScript Interface
```typescript
export interface PaperTradeRun {
  id: string;
  strategyVersionId: string;
  schedule: PaperTradeSchedule;
  status: "scheduled" | "active" | "paused" | "stopped";
  performanceSnapshot: PerformanceSnapshot | null;
  alertConfig: AlertConfig;
  lastExecutionAt: string | null;
  createdAt: string;
}
```

#### Relationships
- Belongs to StrategyVersion
- Triggers Notification alerts
- Surfaces in educator dashboards and compliance escalations

### TemplateShare
**Purpose:** Published strategy version with metadata, permissions, and attribution for educators.

**Key Attributes:**
- id: UUID – Primary key
- strategy_version_id: UUID – Published version
- educator_id: UUID – Owner
- audience_scope: enum – cohort, public
- metadata: jsonb – Description, tags, disclaimers
- clone_count: int – Adoption metrics
- created_at: Date – Publication timestamp

#### TypeScript Interface
```typescript
export interface TemplateShare {
  id: string;
  strategyVersionId: string;
  educatorId: string;
  audienceScope: "cohort" | "public";
  metadata: TemplateMetadata;
  cloneCount: number;
  createdAt: string;
}
```

#### Relationships
- Belongs to StrategyVersion
- Drives cohort dashboards and clone analytics
- Requires ComplianceEvent approval before public release

### ComplianceEvent
**Purpose:** Tracks disclosures, risk reviews, and moderation decisions mandated by compliance epic.

**Key Attributes:**
- id: UUID – Primary key
- entity_type: enum – strategy, template, cohort, notification
- entity_id: UUID – Target entity
- event_type: enum – disclosure, risk_review, takedown, audit
- payload: jsonb – Structured evidence
- status: enum – open, approved, rejected, escalated
- created_by: UUID – Reviewer
- created_at / resolved_at: Date – Audit trail

#### TypeScript Interface
```typescript
export interface ComplianceEvent {
  id: string;
  entityType: "strategy" | "template" | "cohort" | "notification";
  entityId: string;
  eventType: "disclosure" | "risk_review" | "takedown" | "audit";
  payload: Record<string, unknown>;
  status: "open" | "approved" | "rejected" | "escalated";
  createdBy: string;
  createdAt: string;
  resolvedAt: string | null;
}
```

#### Relationships
- Links to StrategyVersion or TemplateShare records
- Generates Notification alerts to stakeholders
- Mirrors evidence to S3 for regulator-ready archives

### Notification
**Purpose:** Central store for in-app, email, and webhook notifications that power the unified notification center.

**Key Attributes:**
- id: UUID – Primary key
- user_id: UUID – Recipient
- type: enum – backtest_complete, paper_trade_alert, governance_task, system
- payload: jsonb – Structured metadata (e.g., run IDs, anomaly details)
- channel: enum – in_app, email, webhook
- read_at: Date – Null until acknowledged
- created_at: Date – Delivery timestamp

#### TypeScript Interface
```typescript
export interface Notification {
  id: string;
  userId: string;
  type: 'backtest_complete' | 'paper_trade_alert' | 'governance_task' | 'system';
  payload: Record<string, unknown>;
  channel: 'in_app' | 'email' | 'webhook';
  readAt: string | null;
  createdAt: string;
}
```

#### Relationships
- Belongs to User
- References BacktestRun, PaperTradeRun, or ComplianceEvent via payload metadata
- Drives unread counters for notification center and toasts

### PlanUsage
**Purpose:** Tracks daily quota consumption for backtests, paper trades, and template publishes to enforce plan guardrails.

**Key Attributes:**
- id: UUID – Primary key
- user_id: UUID – Associated account
- metric: enum – backtests, paper_trades, template_publishes
- window_start: Date – Beginning of quota window (daily/weekly)
- window_end: Date – End of quota window
- used: int – Units consumed
- limit: int – Plan cap snapshot
- updated_at: Date – Last refresh

#### TypeScript Interface
```typescript
export interface PlanUsage {
  id: string;
  userId: string;
  metric: 'backtests' | 'paper_trades' | 'template_publishes';
  windowStart: string;
  windowEnd: string;
  used: number;
  limit: number;
  updatedAt: string;
}
```

#### Relationships
- Belongs to User
- Hydrated from SubscriptionPlan quota JSONB and worker events
- Queried before simulation actions to gate free-tier boundaries per PRD v1.4

## API Specification
Assumes RESTful JSON endpoints under `/api/v1` generated from FastAPI OpenAPI.

```yaml
openapi: 3.0.3
info:
  title: Blockbuilders API
  version: 1.0.0
  description: REST endpoints for strategies, simulations, paper trading, community sharing, and compliance.
servers:
  - url: https://api.blockbuilders.app/api/v1
    description: Production
  - url: https://staging-api.blockbuilders.app/api/v1
    description: Staging
paths:
  /strategies:
    get:
      summary: List strategies with optional visibility filters
      tags: [Strategies]
      responses:
        '200':
          description: Strategy list
    post:
      summary: Create strategy
      security: [{ bearerAuth: [] }]
      responses:
        '201':
          description: Strategy created
  /strategies/{strategyId}/versions:
    post:
      summary: Create new version from canvas payload
      security: [{ bearerAuth: [] }]
  /backtests:
    post:
      summary: Enqueue backtest run
      security: [{ bearerAuth: [] }]
      responses:
        '202':
          description: Job accepted
  /paper-trades:
    get:
      summary: List scheduled paper runs
      security: [{ bearerAuth: [] }]
    post:
      summary: Schedule paper trading
      security: [{ bearerAuth: [] }]
  /templates:
    get:
      summary: Browse published templates
    post:
      summary: Publish strategy template
      security: [{ bearerAuth: [] }]
  /admin/compliance/events:
    get:
      summary: List compliance events
      security: [{ bearerAuth: [] }]
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Components

### Next.js Experience Layer
**Responsibility:** Implements onboarding, canvas editing, dashboards, notifications per UI spec.

**Key Interfaces:**
- REST client generated from OpenAPI
- Server-sent events for backtest progress
- Supabase auth helpers for session/token management

**Dependencies:** Supabase Auth service, Strategy API, Notification API

**Technology Stack:** Next.js 15, React 18, Tailwind, React Flow, React Query, Zustand

### FastAPI Core Service
**Responsibility:** Exposes CRUD, enforces quotas, orchestrates jobs, handles compliance/billing webhooks.

**Key Interfaces:**
- `/api/v1` REST endpoints
- Redis Streams and EventBridge for async orchestration
- Stripe webhooks and Supabase service role callbacks

**Dependencies:** Supabase Postgres, Redis, S3, Stripe

**Technology Stack:** FastAPI, SQLAlchemy, Pydantic, Celery producers

### Simulation Worker Fleet
**Responsibility:** Executes backtests, calculates KPIs, generates trade logs, publishes anomalies.

**Key Interfaces:**
- Consumes `simulation.run` stream
- Writes metrics to Supabase Postgres (Timescale extension), artifacts to S3
- Emits events to Notification service

**Dependencies:** Institutional market data API, Supabase Postgres, Redis

**Technology Stack:** Python, Celery, Pandas, NumPy, vectorbt, TA-Lib

### Paper Trading Scheduler
**Responsibility:** Maintains recurring paper trades, monitors alert thresholds, feeds dashboards.

**Key Interfaces:**
- EventBridge schedules -> Redis Streams
- REST callbacks for anomaly escalation
- Notification service integration

**Dependencies:** Simulation worker, Supabase Postgres, Notification service

**Technology Stack:** Celery beat, FastAPI background tasks, Redis

### Notification Service
**Responsibility:** Normalizes notifications into email, in-app, and webhooks with delivery tracking.

**Key Interfaces:**
- Consumes `notify.event` stream
- SES/Postmark email, WebSocket gateway for in-app center
- Writes Notification records to Supabase Postgres

**Dependencies:** FastAPI core, Redis, SES/Postmark, Supabase profiles

**Technology Stack:** FastAPI, Celery worker, Jinja templating

### Compliance & Governance Module
**Responsibility:** Manages disclosures, risk reviews, takedown workflows, exports audit packages.

**Key Interfaces:**
- Admin REST endpoints `/api/v1/admin/compliance/*`
- S3 evidence archive
- Notification hooks for reviewer tasks

**Dependencies:** Supabase Postgres (role metadata), Notification service

**Technology Stack:** FastAPI, SQLAlchemy, Prefect for longer audits

### Component Diagram
```mermaid
graph LR
  subgraph Web
    UI[Next.js UI]
    SL[Service Layer]
  end
  subgraph Backend
    API[FastAPI Core]
    GOV[Compliance Module]
    BILL[Billing Adapter]
  end
  subgraph Async
    QUEUE[Redis Streams]
    WORKERS[Celery Workers]
    NOTIFY[Notification Worker]
  end
  subgraph Data
    DB[(Supabase Postgres)]
    S3[(S3 Artifacts)]
  end
  UI --> SL --> API
  API --> QUEUE --> WORKERS --> DB
  WORKERS --> S3
  API --> GOV --> DB
  API --> BILL --> DB
  QUEUE --> NOTIFY --> UI
```

## External APIs

### Institutional Market Data API
- **Purpose:** Provide historical and near-real-time crypto data for backtests and paper trades.
- **Documentation:** https://docs.kaiko.com/
- **Base URL(s):** https://gateway.kaiko.com
- **Authentication:** API key in `Authorization` header
- **Rate Limits:** Enterprise SLA 200 req/minute (burst 400)

**Key Endpoints Used:**
- `GET /v2/data/trades.v1/exchanges/{exchange}/instrument/{pair}` – trade history

**Integration Notes:** Cache candles in Redis for short windows, implement retry/backoff, store API key in AWS Secrets Manager.

### Stripe Billing API
- **Purpose:** Manage subscriptions, quotas, invoices, and premium upgrades.
- **Documentation:** https://stripe.com/docs/api
- **Base URL(s):** https://api.stripe.com
- **Authentication:** Bearer token (secret key)
- **Rate Limits:** Stripe-managed; respect idempotency keys for retries

**Key Endpoints Used:**
- `POST /v1/checkout/sessions` – start upgrade flow

**Integration Notes:** Webhooks (invoice.paid, customer.subscription.updated) processed via FastAPI with signature verification and replay protection.

### Supabase Admin API
- **Purpose:** Manage elevated user operations (invites, metadata sync, role promotion) and inspect auth audits.
- **Documentation:** https://supabase.com/docs/reference/admin/introduction
- **Base URL(s):** https://{project}.supabase.co
- **Authentication:** Supabase service-role key (JWT)
- **Rate Limits:** 500 requests/minute; coalesce metadata writes and prefer SQL policies for bulk changes

**Key Endpoints Used:**
- `POST /auth/v1/admin/users` – provision elevated reviewer/educator accounts
- `PATCH /auth/v1/admin/users/{id}` – update `app_metadata.roles`

**Integration Notes:** Store the service-role key in AWS Secrets Manager, issue requests from FastAPI only, audit each mutation via the ComplianceEvent log.

## Core Workflows
```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant FE as Next.js App
  participant API as FastAPI Core
  participant Q as Redis Streams
  participant W as Simulation Workers
  participant DB as Supabase Postgres
  participant N as Notification Service
  participant MD as Market Data API
  rect rgb(230,230,250)
    U->>FE: Complete onboarding checklist
    FE->>API: POST /strategies (select template)
    API->>DB: Persist strategy + first version
    FE->>API: POST /backtests
    API->>DB: Check plan usage + quotas
    alt Quota exceeded
      API-->>FE: 403 quota_exceeded (upgrade CTA)
    else Within quota
      API->>Q: Publish simulation job
      Q->>W: Deliver payload
      W->>MD: Fetch candles
      W->>DB: Write metrics + trade log
      W->>N: Emit completion event
      N->>FE: WebSocket toast + badge update
      FE->>FE: Update notification center unread count
      N->>U: Email summary
    end
  end
  rect rgb(220,245,220)
    FE->>API: POST /paper-trades (schedule)
    API->>EventBridge: Register cron rule
    EventBridge->>Q: Trigger paper run
    Q->>W: Execute paper iteration
    W->>DB: Append simulated fills
    W->>API: Flag anomalies
    API->>N: Notify thresholds exceeded
    N->>FE: Push alert center update
  end
  rect rgb(255,240,220)
    Educator FE->>API: POST /templates
    API->>Compliance: Queue review
    Compliance->>DB: Record compliance_event
    Compliance->>N: Notify reviewers
    Reviewer->>API: PATCH compliance status
    API->>DB: Publish template + audit trail
  end
```

## Database Schema
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  roles TEXT[] NOT NULL,
  plan_tier TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ
);

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  plan_code TEXT NOT NULL,
  quota JSONB NOT NULL,
  status TEXT NOT NULL,
  renewal_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE plan_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  plan_limit INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric, window_start)
);
CREATE INDEX plan_usage_lookup_idx ON plan_usage (user_id, metric, window_start DESC);

CREATE TABLE strategies (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL,
  visibility TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE strategy_versions (
  id UUID PRIMARY KEY,
  strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  graph_json JSONB NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(strategy_id, version)
);

CREATE TABLE backtest_runs (
  id UUID PRIMARY KEY,
  strategy_version_id UUID REFERENCES strategy_versions(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES users(id),
  parameters JSONB NOT NULL,
  status TEXT NOT NULL,
  metrics JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
SELECT create_hypertable('backtest_runs', 'created_at', if_not_exists => TRUE);

CREATE TABLE paper_trade_runs (
  id UUID PRIMARY KEY,
  strategy_version_id UUID REFERENCES strategy_versions(id) ON DELETE CASCADE,
  schedule JSONB NOT NULL,
  status TEXT NOT NULL,
  last_execution_at TIMESTAMPTZ,
  performance_snapshot JSONB,
  alert_config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  channel TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_unread_idx ON notifications (user_id) WHERE read_at IS NULL;

CREATE TABLE template_shares (
  id UUID PRIMARY KEY,
  strategy_version_id UUID REFERENCES strategy_versions(id) ON DELETE CASCADE,
  educator_id UUID REFERENCES users(id),
  audience_scope TEXT NOT NULL,
  metadata JSONB NOT NULL,
  clone_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE compliance_events (
  id UUID PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_compliance_entity ON compliance_events(entity_type, entity_id);
```

## Frontend Architecture

### Component Architecture
#### Component Organization
```text
apps/web/src/
├── app/
│   ├── (public)/
│   ├── (auth)/login/
│   └── (dashboard)/
│       ├── dashboard/
│       ├── strategies/[strategyId]/
│       ├── templates/
│       ├── notifications/
│       ├── paper-trading/
│       ├── account/plan/
│       └── educator/
├── components/
│   ├── canvas/
│   ├── analytics/
│   ├── onboarding/
│   ├── notifications/
│   ├── paper-trading/
│   ├── billing/
│   ├── compliance/
│   └── primitives/
├── hooks/
├── services/
├── stores/
└── utils/
```

#### Component Template
```typescript
import { memo } from 'react';
import { useStrategyCanvas } from '@/stores/canvas';
import { useValidation } from '@/hooks/useValidation';
import { CanvasNode } from '@/components/canvas/CanvasNode';

type StrategyCanvasProps = {
  strategyId: string;
  versionId: string;
};

export const StrategyCanvas = memo(function StrategyCanvas({ strategyId, versionId }: StrategyCanvasProps) {
  const graph = useStrategyCanvas(strategyId, versionId);
  const { issues, validate } = useValidation(strategyId, versionId);

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Strategy Canvas</h2>
        <button className="btn-primary" onClick={validate}>Validate</button>
      </header>
      <div className="canvas-grid">
        {graph.nodes.map((node) => (
          <CanvasNode key={node.id} node={node} issues={issues[node.id] ?? []} />
        ))}
      </div>
    </section>
  );
});
```

### Feature Modules
- **Onboarding & Education Hub:** Guided checklist, starter templates, and contextual education tiles that mirror the UX spec's progressive disclosure cues.
- **Strategy Canvas & Validation:** Drag-and-drop canvas, inline validation badges, and comparison table surfaces tied to shared Zustand stores.
- **Results & Insight Dashboards:** Backtest summaries, comparison hub, anomaly inspector, and insight engine panels with shared data loaders.
- **Paper Trading Scheduler & Alert Center:** Scheduling wizard, alert thresholds, notification inbox, and acknowledgement flows introduced in UI spec v0.2.
- **Plan & Billing Guardrails:** Plan usage banner, upgrade modals, and quota tooltips that surface before heavy actions to reinforce freemium boundaries.
- **Compliance & Disclosure Surfaces:** Disclosure banners, compliance checklists, and educator governance panes to keep messaging consistent across flows.

### State Management Architecture
#### State Structure
```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { StrategyGraph } from '@blockbuilders/shared/types';

type CanvasState = {
  graphs: Record<string, StrategyGraph>;
  setGraph: (versionId: string, graph: StrategyGraph) => void;
  updateNode: (versionId: string, nodeId: string, updates: Partial<StrategyGraph['nodes'][number]>) => void;
};

export const useStrategyCanvas = create<CanvasState>()(
  devtools(
    persist((set) => ({
      graphs: {},
      setGraph: (versionId, graph) => set((state) => ({ graphs: { ...state.graphs, [versionId]: graph } })),
      updateNode: (versionId, nodeId, updates) =>
        set((state) => {
          const graph = state.graphs[versionId];
          if (!graph) return state;
          const nodes = graph.nodes.map((node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          );
          return { graphs: { ...state.graphs, [versionId]: { ...graph, nodes } } };
        }),
    }), { name: 'bb-canvas' })
  )
);
```

#### State Management Patterns
- Separate server state (React Query) from local canvas edits (Zustand) to avoid cache churn.
- Persist drafts locally to support offline tinkering; sync when validation is triggered.
- Emit validation events via Zustand listeners to provide immediate UX feedback.
- Mirror Supabase `app_metadata.roles` into store on login for consistent feature gating.
- Hydrate plan quotas and usage counters from React Query selectors so quota modals render before API calls.
- Maintain notification inbox state (unread counts, acknowledgements) independently to keep toasts and the notification center in sync.

### Routing Architecture
#### Route Organization
```text
app/
├── layout.tsx
├── page.tsx
├── (auth)/login/page.tsx
├── (dashboard)/layout.tsx
├── (dashboard)/dashboard/page.tsx
├── (dashboard)/strategies/page.tsx
├── (dashboard)/strategies/[strategyId]/page.tsx
├── (dashboard)/templates/page.tsx
├── (dashboard)/notifications/page.tsx
├── (dashboard)/paper-trading/page.tsx
├── (dashboard)/account/plan/page.tsx
├── (dashboard)/educator/page.tsx
└── api/notifications/route.ts
```

#### Protected Route Pattern
```typescript
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { redirect } from 'next/navigation';

export async function withRoleGuard(route: string, requiredRoles: string[], next: () => Promise<JSX.Element>) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    redirect(`/login?next=${route}`);
  }
  const roles = (session.user.app_metadata?.roles ?? []) as string[];
  if (!requiredRoles.some((role) => roles.includes(role))) {
    redirect('/403');
  }
  return next();
}
```

### Frontend Services Layer
#### API Client Setup
```typescript
import ky from 'ky';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ApiError } from '@blockbuilders/shared/errors';

const supabase = createClientComponentClient();

export const apiClient = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  hooks: {
    beforeRequest: [async (request) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }],
    afterResponse: [(_request, _options, response) => {
      if (!response.ok) {
        return response.json().then((payload) => {
          throw ApiError.fromResponse(payload, response.status);
        });
      }
    }],
  },
});
```

#### Service Example
```typescript
import { apiClient } from './client';
import { StrategyInput, Strategy } from '@blockbuilders/shared/types';

export async function createStrategy(input: StrategyInput): Promise<Strategy> {
  return apiClient.post('strategies', { json: input }).json<Strategy>();
}
```

#### Guard Example
```typescript
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@blockbuilders/shared/errors';
import { PlanUsage } from '@blockbuilders/shared/types';

export function assertBacktestQuota(queryClient: ReturnType<typeof useQueryClient>) {
  const usage = queryClient.getQueryData<PlanUsage>(['planUsage', 'backtests']);
  if (!usage) return;
  if (usage.used >= usage.limit) {
    throw new ApiError('quota_exceeded', 'Upgrade to unlock more backtests today.', {
      metric: 'backtests',
      limit: usage.limit,
    });
  }
}
```

### Responsive & Accessibility Strategy
- Breakpoints mirror the UX spec: mobile (≤599px) surfaces read-only strategy cards, alert acknowledgements, and upgrade CTAs; tablet (600–1023px) unlocks simplified canvas editing; desktop and wide retain full drag-and-drop plus analytics panes.
- Side panels collapse into drawers on tablet/mobile, dashboards stack vertically with sticky KPI summaries, and notification toasts funnel into the persistent notification center entry point.
- High-contrast 2px focus rings, semantic headings, and chart summaries keep interfaces aligned with WCAG 2.1 AA, matching the front-end spec's accessibility guardrails.
- Canvas blocks expose ARIA labels, validation badges emit polite live-region updates, and animations respect `prefers-reduced-motion` to support inclusive UX.

## Backend Architecture

### Service Architecture
#### Serverless Architecture
Not applicable; CPU-intensive simulations and compliance workflows favor containerized services with predictable runtime.

#### Traditional Server Architecture
##### Controller/Route Organization
```text
apps/api/src/
├── main.py
├── api/
│   ├── dependencies.py
│   ├── routers/
│   │   ├── strategies.py
│   │   ├── strategy_versions.py
│   │   ├── backtests.py
│   │   ├── paper_trades.py
│   │   ├── templates.py
│   │   ├── notifications.py
│   │   ├── plan_usage.py
│   │   └── admin/compliance.py
├── services/
├── repositories/
├── workers/
└── settings.py
```

##### Controller Template
```python
from fastapi import APIRouter, Depends, status
from typing import List
from app.schemas.strategy import StrategyCreate, StrategyResponse
from app.services.strategy_service import StrategyService
from app.dependencies import get_current_user

router = APIRouter(prefix='/strategies', tags=['strategies'])

@router.get('', response_model=List[StrategyResponse])
async def list_strategies(service: StrategyService = Depends()):
    return await service.list_strategies()

@router.post('', response_model=StrategyResponse, status_code=status.HTTP_201_CREATED)
async def create_strategy(payload: StrategyCreate,
                          user=Depends(get_current_user),
                          service: StrategyService = Depends()):
    return await service.create_strategy(user=user, payload=payload)
```

### Database Architecture
#### Schema Design
See SQL DDL above. Migrations managed with Alembic, and Supabase Timescale extension retention policies compress raw metrics after 90 days while rolling up aggregates for dashboards.

#### Data Access Layer
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.strategy import StrategyModel
from app.schemas.strategy import StrategyResponse

class StrategyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self, owner_id: str | None = None) -> list[StrategyResponse]:
        stmt = select(StrategyModel).order_by(StrategyModel.created_at.desc())
        if owner_id:
            stmt = stmt.where(StrategyModel.owner_id == owner_id)
        result = await self.session.execute(stmt)
        return [StrategyResponse.model_validate(row) for row in result.scalars()]
```

### Quota Enforcement Service
```python
from datetime import datetime, timezone
from app.repositories.plan_usage_repository import PlanUsageRepository
from app.schemas.errors import QuotaExceededError

class PlanUsageService:
    def __init__(self, repo: PlanUsageRepository):
        self.repo = repo

    async def assert_within_quota(self, user_id: str, metric: str) -> None:
        usage = await self.repo.get_active_window(user_id=user_id, metric=metric)
        if usage.used >= usage.limit:
            raise QuotaExceededError(metric=metric, limit=usage.limit)
        await self.repo.increment(user_id=user_id, metric=metric, at=datetime.now(timezone.utc))
```

### Authentication and Authorization
#### Auth Flow
```mermaid
sequenceDiagram
  participant U as User
  participant FE as Next.js App
  participant Supa as Supabase Auth
  participant API as FastAPI
  participant DB as Supabase Postgres
  U->>FE: Initiate login
  FE->>Supa: Exchange credentials (PKCE / magic link)
  Supa->>FE: Return session (access + refresh tokens)
  FE->>API: Invoke API with bearer token
  API->>Supa: Fetch latest app_metadata (service role)
  API->>DB: Sync user + roles if first login
  API-->>FE: Respond with role-aware payload
```

#### Middleware/Guards
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import jwt
from app.settings import settings
from app.repositories.user_repository import UserRepository

auth_scheme = HTTPBearer(auto_error=False)

async def get_current_user(token=Depends(auth_scheme), repo: UserRepository = Depends()):
    if token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing bearer token')
    try:
        payload = jwt.decode(
            token.credentials,
            settings.supabase_jwt_secret,
            algorithms=['HS256'],
            audience=settings.supabase_api_audience,
        )
    except jwt.JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from exc
    return await repo.get_or_create_from_claims(payload)
```

## Unified Project Structure
```text
blockbuilders/
├── apps/
│   ├── web/                     # Next.js App Router UI
│   ├── api/                     # FastAPI service
│   └── workers/                 # Celery workers + scheduler
├── packages/
│   ├── shared/                  # Types, DTOs, error helpers
│   ├── design-system/
│   ├── api-client/
│   └── config/
├── infrastructure/
│   ├── terraform/
│   └── vercel/
├── scripts/
├── .github/workflows/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── poetry.lock (generated)
├── .env.example
└── docs/
    ├── prd.md
    ├── front-end-spec.md
    └── architecture.md
```

## Development Workflow

### Local Development Setup
#### Prerequisites
```bash
# Toolchain
brew install node@20 pnpm python@3.11 poetry redis awscli
uv install --upgrade uv
uv install pre-commit
brew install --cask docker
```

#### Initial Setup
```bash
pnpm install
poetry install --sync --no-root --directory apps/api
poetry install --sync --no-root --directory apps/workers
cp .env.example .env
cp .env.example apps/web/.env.local
pre-commit install
```

#### Development Commands
```bash
# Start everything
docker compose up redis timescale -d
pnpm turbo run dev --parallel

# Frontend only
pnpm --filter web dev

# Backend only
make api-dev  # wraps uvicorn with reload

# Tests
pnpm turbo run test
poetry run pytest apps/api
poetry run pytest apps/workers
```

### Environment Configuration
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=...

# Backend (.env)
API_HOST=0.0.0.0
API_PORT=8000
DATABASE_URL=postgresql+asyncpg://blockbuilders:password@localhost:5432/blockbuilders
REDIS_URL=redis://localhost:6379/0
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
SUPABASE_API_AUDIENCE=authenticated
STRIPE_SECRET_KEY=sk_test_...
TIMESCALE_SSL_MODE=require
S3_BUCKET=bb-artifacts-dev

# Shared
APP_ENV=development
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
LOG_LEVEL=INFO
```

## Deployment Architecture

### Deployment Strategy
**Frontend Deployment:**
- **Platform:** Vercel
- **Build Command:** `pnpm --filter web build`
- **Output Directory:** `.vercel/output` (App Router)
- **CDN/Edge:** Vercel Edge Network with ISR + stale-while-revalidate

**Backend Deployment:**
- **Platform:** AWS Fargate (ECS) with Application Load Balancer
- **Build Command:** `docker build -t blockbuilders-api apps/api`
- **Deployment Method:** GitHub Actions builds to ECR, CodeDeploy blue/green rollout

### CI/CD Pipeline
```yaml
name: ci-cd
on:
  push:
    branches: [main, staging]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm turbo run lint test
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: uv install poetry
      - run: poetry install --directory apps/api
      - run: poetry install --directory apps/workers
      - run: poetry run pytest apps/api
  deploy-frontend:
    needs: build-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
  deploy-backend:
    needs: build-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: us-east-1
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE }}
      - run: ./scripts/build-backend.sh
      - run: ./scripts/deploy-backend.sh
```

### Environments
| Environment | Frontend URL | Backend URL | Purpose |
| --- | --- | --- | --- |
| Development | http://localhost:3000 | http://localhost:8000 | Local development |
| Staging | https://staging.blockbuilders.app | https://staging-api.blockbuilders.app | Pre-production verification |
| Production | https://blockbuilders.app | https://api.blockbuilders.app | Live environment |

### Operational Playbooks & Responsibilities
#### Initial Data Seeding & Reference Fixtures
- **Owner:** Data Engineering Lead (executes) with Product Owner sign-off on reference content; DevOps runs automation hooks during deployments.
- **Source of Truth:** Declarative YAML manifests under `infrastructure/seed-data/` (e.g. `plans.yaml`, `templates.yaml`, `demo-users.yaml`) tracked in Git; generated SQL kept out of version control.
- **Execution Tooling:** Idempotent Python module `apps/api/app/seed/bootstrap.py` orchestrated through `poetry run python -m app.seed.bootstrap --env={env}`; command resolves manifests, applies migrations, and upserts via SQLAlchemy bulk operations with conflict targets to avoid duplicates.
- **Data Sets Covered:**
  - Subscription plans (`free`, `premium`, `educator`) including quota ceilings, Stripe price IDs, and feature flag defaults.
  - Quota policy baselines used by the plan guardrails service (backtests/day, live paper trades, template forks).
  - Starter strategy templates referenced by onboarding flows (momentum, mean reversion, DCA) with localized descriptions and compliance metadata.
  - Demo educator cohort and support accounts with salted passwords pulled from 1Password exports and enforced rotation reminders.
- **Lifecycle:**
  1. Update YAML manifests and run `pnpm seed:lint` (wraps `scripts/validate-seed.ts`) to ensure schema compliance.
  2. Execute `pnpm seed:local` for local Timescale via docker compose; command pipes through bootstrap module and prints summary counts.
  3. GitHub Action `seed-staging.yml` triggers on staging deploys, running bootstrap against Supabase using ephemeral service-role keys stored in AWS Secrets Manager; production deploy requires manual approval with runbook confirmation in Slack `#launch-pad`.
  4. Post-run verification `scripts/check-seed.py --env {env}` compares row hashes against manifest digests and emits Datadog gauge `seed.last_success_timestamp`.
- **Rollback Strategy:** Bootstrap records execution metadata in `seed_runs` table (run id, manifest versions, checksum). `scripts/seed-rollback.py --run <id>` replays prior manifests within a transaction; production rollback requires compliance approval when demo users are involved.
- **Operational Steps (inline reference):**
  1. **Pre-flight:** Confirm latest manifests committed, gather Supabase project + Stripe restricted key from shared secrets vault, and announce window in `#launch-pad`.
  2. **Dry run:** `pnpm seed:lint && pnpm seed:local` to validate schemas and confirm bootstrap summary matches manifest digest counts; remediate lint or checksum drift before proceeding.
  3. **Target run:** `poetry run python -m app.seed.bootstrap --env={staging|production}` executed from CI or approved operator shell; provide manifest git SHA and operator initials in prompt when requested.
  4. **Post-run verification:** Execute `scripts/check-seed.py --env {env}` then review Datadog gauge `seed.last_success_timestamp`; log run id, manifest SHA, and verification outcome in ops notebook (Notion: "Seed Runs").
  5. **Rollback path:** If discrepancies detected, invoke `scripts/seed-rollback.py --run <id>` and re-run verification; escalate to Data Engineering lead if automated rollback surfaces merge conflicts.
- **Troubleshooting:**
  - Supabase RLS failures → ensure service-role key used, inspect `seed_runs` audit for offending table, and temporarily relax conflicting policy via SQL (`alter policy ... using (true)`), restoring original predicate once run succeeds.
  - Stripe price drift → reconcile plan price IDs against Stripe dashboard, update `plans.yaml`, rerun bootstrap, and confirm webhook replay passes without mismatches.

#### DNS & SSL Provisioning Runbook
- **Owner:** DevOps Lead (execution) with backup from Staff Engineer.
- **Scope:** Route53, CloudFront, and Vercel certificate lifecycle for `*.blockbuilders.app` domains.
- **Pre-checks:**
  1. Validate desired records in `infrastructure/terraform/dns/records.tf` and confirm ACM certificate request pending/approved.
  2. Verify Cloudflare (if used for marketing site) has updated origin IPs and proxy modes to avoid certificate mismatch.
  3. Ensure change window communicated in `#launch-pad` with rollback contact list.
- **Execution Steps:**
  1. Apply Terraform changes: `terraform workspace select {staging|production}` then `terraform apply -auto-approve`.
  2. For Vercel-managed frontends, run `vercel certs issue blockbuilders.app www.blockbuilders.app` when prompted, copying validation CNAMEs back into Terraform.
  3. Propagate DNS by verifying Route53 change status (`aws route53 get-change <change-id>`), checking `dig +short` results for key records, and confirming CloudFront distribution status is `Deployed`.
- **Validation:** Confirm HTTPS availability via Datadog synthetic monitor or `curl -I https://{domain}`; review AWS Certificate Manager for issued status and expiry > 60 days.
- **Rollback:** Reapply previous Terraform state (`terraform apply "planfiles/{env}-last.plan"`) and restore prior certificate ARN values; notify incident channel if rollback executed.
- **Record Keeping:** Document change, validation evidence, and operator in Notion "DNS & SSL Runbook" page; attach Terraform plan, `aws route53 get-change`, and `curl -I https://{domain}` outputs.

#### Third-Party Account Provisioning & Credential Management
- **Supabase (Owner: DevOps Lead)** – Provision projects per environment via Terraform modules under `infrastructure/terraform/supabase`, capture service keys in AWS Secrets Manager, and document read/write role mappings; rotate all non-user keys quarterly with tickets logged in the ops tracker.
- **AWS Core (Owner: DevOps Lead)** – Stand up IAM roles, networking, S3 buckets, and Batch/Fargate stacks through infrastructure code; enforce MFA on human break-glass accounts and schedule 90-day IAM access reviews.
- **Stripe (Owner: PM + Finance Partner)** – Request production keys after compliance checklist sign-off, store secrets in Vault/Supabase configuration tables, and automate webhook replay tests monthly; rotate restricted keys every 180 days.
- **Market Data Vendors (Owner: Data Engineering)** – Kaiko confirmed as primary feed (contract pending signature 2025-10-15) with Coin Metrics as warm standby; capture SLA clauses, rate limits, and symbol coverage in the "Market Data Vendor Readiness" appendix below and refresh fallback procedure checklist (feature flag toggle + redeploy steps) each quarter; attach procurement status and billing contacts in ops tracker.
- **Sandbox Credential Catalog:** Store Supabase, Stripe, Kaiko, and Coin Metrics sandbox keys plus replay/mock instructions in 1Password vault `Blockbuilders Ops`; mirror an operator walkthrough in the "Secrets & Sandbox Access" appendix outlining how to request access, rotate credentials, and execute replay smoke tests.
- Centralize detailed playbooks under `ops/playbooks/` with last-reviewed timestamps, escalation contacts, and Terraform state references so new contributors can execute without tribal knowledge.

#### Responsibility Matrix (Human vs. Automation)
| Task | Human Owner | Automation Support | Notes |
| --- | --- | --- | --- |
| Compliance disclosure reviews | Compliance Advisor (quarterly) | Content linting bots flag missing disclaimers in CI | Manual approval required before production deploys; bot posts checklist status to GitHub checks. |
| Credential rotation & audit | DevOps Lead (Supabase/AWS); PM (Stripe) | Secrets scanner watches repo/CI for leaks | Rotation calendar tracked in ops tracker with Slack reminders. |
| Backup validation & DR drills | DevOps Lead | Scheduled restore jobs verify snapshots automatically | Drill reports captured in reliability register with remediation tasks logged to Jira. |
| Customer support & incident comms | Support Lead + PM | Intercom auto-triage tags severity | Humans arbitrate escalation path; alerts mirrored to Slack incident channel. |
| Knowledge base & onboarding assets | PM + UX Writer | Docs pipeline lints Markdown, checks links | Weekly audit ensures onboarding, trust, and compliance artifacts stay current. |

#### Backup & Restore Execution Plan
- **Tooling:** Use Supabase managed Timescale snapshots and AWS Backup for S3 buckets; replicate encrypted copies to a separate AWS account for disaster recovery.
- **Cadence:** Run nightly incremental snapshots and weekly full database backups; archive application artifacts after every production deploy.
- **Validation:** Execute monthly restore drills into isolated staging namespaces, verifying schema migrations and application boot; log outcomes in `ops/playbooks/backup-restore.md`.
- **Monitoring:** Datadog monitors alert on missed backups, replication lag, or failed restores; compliance advisor receives quarterly summary exports.

#### Knowledge Transfer & Support Handoffs
- Produce Sprint 0 knowledge-transfer packet covering release workflow, rollback triggers, support escalation map, and on-call expectations; refresh after each beta iteration.
- Maintain beta operations log (incidents, root cause, follow-ups) using the template below and distribute summaries during fortnightly stakeholder syncs.
- Ensure support and compliance teams receive updated disclosures, onboarding copy, and FAQ assets at least 24 hours before deploy; host documentation in shared Notion with repository pointers and attach release notes generated from the template below.
- Deliver user-facing education suite (onboarding checklist copy, trust/compliance FAQ, tutorial videos) mapped to activation KPIs, with clear ownership and review cadence.

#### Code Review & Knowledge Sharing Checklist
- [ ] Reference story acceptance criteria and affected modules before opening PR; list scenarios validated locally (unit/integration/E2E).
- [ ] Pair reviewer assigned in Linear ticket; add subject-matter reviewer for domain-heavy PRs (compliance, billing, seeding).
- [ ] Ensure architectural decision records (ADRs) updated when PR changes system boundaries or workflows.
- [ ] Post-review summary in `#dev-updates` including feature flag status, rollout plan, and follow-up tasks.
- [ ] Capture learnings or debugging insights in team handbook within 24 hours; link handbook entry back to originating PR.

#### Release Notes & Incident Log Templates
```markdown
## Release Note
- Date:
- Release Owner:
- Feature Highlights:
  -
- Migrations/Operational Tasks:
  -
- Rollback Plan:
- Customer Comm Link:

---

## Beta Incident Log
- Incident ID:
- Detected (date/time):
- Reporter:
- Severity:
- User Impact Summary:
- Timeline:
  -
- Root Cause:
- Mitigations Applied:
- Follow-up Actions:
- Verification Evidence:
```

#### Market Data Vendor Readiness
| Item | Kaiko (Primary) | Coin Metrics (Secondary) |
| --- | --- | --- |
| Contract status | Pending signature (expected 2025-10-15) | Active evaluation sandbox |
| Coverage | Spot + derivatives for top 150 assets | Spot focus, derivatives limited |
| SLAs | 99.9% uptime, 300ms P95 latency | 99.5% uptime, 500ms P95 |
| Rate limits | 600 requests/min per API key | 400 requests/min |
| Fallback procedure | Update runtime feature flag `marketData.provider=coinMetrics`, redeploy workers, flush Redis caches, and validate dashboard parity | Maintain warm cache, sync once per hour |
| Monitoring | Datadog synthetic `marketdata-primary` + webhook heartbeat | Datadog synthetic `marketdata-fallback` |
| Contacts | Vendor TAM: tam@kaiko.com; escalation: support@kaiko.com | Support: support@coinmetrics.io |

#### Secrets & Sandbox Access
- All sandbox credentials stored in 1Password vault `Blockbuilders Ops`; access requires DevOps approval and Okta MFA.
- Redacted walkthrough (request, retrieval, rotation) maintained in Notion "Secrets Operations" page; update page when keys rotate or tooling changes.
- Replay tests: run `stripe trigger payment_intent.succeeded` and `poetry run python -m app.seed.bootstrap --env=sandbox` monthly to validate integrations; record outcomes in beta operations log template above.
- Rotation cadence: Supabase service keys quarterly, Stripe restricted keys every 180 days, market data keys monthly; log rotations in ops tracker with link to verification artifacts.

## Security and Performance

### Security Requirements
**Frontend:**
- CSP: default-src 'self'; frame-ancestors none; script-src 'self' vercel.dev analytics; allow Kaiko endpoint.
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

### Performance Optimization
**Frontend:**
- Initial JS bundle target <250 KB for authenticated shell.
- Stream onboarding/backtest panels using React Server Components + Suspense.
- Cache API responses via React Query (stale-while-revalidate) and CDN for marketing pages.

**Backend:**
- P95 API latency target <150 ms; asynchronous DB driver (asyncpg) with connection pooling.
- Timescale compression + partial indexes on `status`, `owner_id`, and `created_at`.
- Redis caching for hot template metadata and comparison aggregates.

## Testing Strategy

### Testing Pyramid
```text
E2E Tests
/        \
Integration Tests
/            \
Frontend Unit  Backend Unit
```

### Test Organization
#### Frontend
```text
apps/web/tests/
├── unit/
│   ├── components/StrategyCanvas.test.tsx
│   └── components/NotificationCenter.test.tsx
├── integration/
│   ├── flows/onboard-to-backtest.test.tsx
│   └── flows/paper-trading-scheduler.test.tsx
└── utils/test-utils.ts
```

#### Backend
```text
apps/api/tests/
├── unit/test_strategy_service.py
├── unit/test_plan_usage_service.py
├── integration/test_backtest_flow.py
└── fixtures/mock_market_data.py
```

#### E2E
```text
tests/e2e/
├── onboarding.spec.ts
├── backtest-run.spec.ts
├── plan-guardrails.spec.ts
└── educator-sharing.spec.ts
```

### Test Examples
#### Frontend Component Test
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrategyCanvas } from '@/components/canvas/StrategyCanvas';
import { canvasStoreWrapper } from '@/tests/utils';

test('runs validation when user clicks validate', async () => {
  const user = userEvent.setup();
  render(<StrategyCanvas strategyId="s1" versionId="v1" />, { wrapper: canvasStoreWrapper });
  await user.click(screen.getByRole('button', { name: /validate/i }));
  expect(screen.getByText(/running validation/i)).toBeVisible();
});
```

#### Backend API Test
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_strategy(async_client: AsyncClient, auth_header):
    payload = {
        'title': 'Mean Reversion Alpha',
        'visibility': 'private',
        'tags': ['mean reversion'],
        'graphJson': {'nodes': [], 'edges': []}
    }
    response = await async_client.post('/api/v1/strategies', json=payload, headers=auth_header)
    assert response.status_code == 201
    body = response.json()
    assert body['title'] == 'Mean Reversion Alpha'
    assert body['status'] == 'draft'
```

#### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('free-tier user hits backtest quota and sees upgrade CTA', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /get started/i }).click();
  await page.getByLabel('Email').fill('free-builder@example.com');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('button', { name: /start with template/i }).click();
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: /run backtest/i }).click();
    await expect(page.getByText(/backtest queued/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /close/i }).click();
  }
  await page.getByRole('button', { name: /run backtest/i }).click();
  await expect(page.getByText(/upgrade to unlock more backtests/i)).toBeVisible();
});
```

## Coding Standards

### Critical Fullstack Rules
- **Shared contracts only:** Define request/response types in `packages/shared` and consume via generated clients—no ad-hoc interfaces.
- **Async everywhere:** Never block FastAPI or Next.js handlers; move CPU-heavy analytics into Celery workers.
- **Feature gates:** Use the central `FeatureGate` helper; do not hard-code role checks in components or routes.
- **Compliance hooks:** Any template visibility change must call `compliance_service.audit_change` before persistence.
- **Observability:** Wrap external API calls with the `with_tracing` decorator to capture spans + correlation IDs.

### Naming Conventions
| Element | Frontend | Backend | Example |
| --- | --- | --- | --- |
| Components | PascalCase | - | `StrategyCanvas.tsx` |
| Hooks | camelCase with `use` | - | `useBacktestStatus.ts` |
| API Routes | - | kebab-case | `/api/v1/paper-trades` |
| Database Tables | - | snake_case | `paper_trade_runs` |

## Error Handling Strategy

### Error Flow
```mermaid
sequenceDiagram
  participant FE as Next.js App
  participant API as FastAPI Core
  participant W as Worker
  participant N as Notification Service
  FE->>API: POST /backtests
  API->>API: Validate quota + payload
  alt Quota exceeded
    API-->>FE: 403 ApiError{code='quota_exceeded'}
    FE->>FE: Surface upgrade CTA
  else Worker failure
    API->>W: Enqueue job
    W-->>API: Failure event
    API-->>FE: SSE with failure message
    API->>N: Emit failure notification
    N->>User: Email + in-app alert
  end
```

### Error Response Format
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling
```typescript
export class ApiError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, unknown>;

  private constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }

  static fromResponse(payload: ApiError, status: number) {
    const { code, message, details } = payload.error;
    return new ApiError(code, message, { ...details, status });
  }
}

export function interpretError(error: unknown): { title: string; description: string } {
  if (error instanceof ApiError) {
    switch (error.code) {
      case 'quota_exceeded':
        return { title: 'Quota reached', description: 'Upgrade to unlock more backtests today.' };
      case 'validation_failed':
        return { title: 'Validation failed', description: 'Fix highlighted blocks and retry.' };
      default:
        return { title: 'Unexpected error', description: error.message };
    }
  }
  return { title: 'Network error', description: 'Check your connection and try again.' };
}
```

### Backend Error Handling
```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.core.logging import logger
from app.core.errors import DomainError

async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
    logger.warning(
        'domain_error',
        extra={
            'code': exc.code,
            'details': exc.details,
            'request_id': request.state.request_id,
        },
    )
    return JSONResponse(
        status_code=exc.status_code or status.HTTP_400_BAD_REQUEST,
        content={
            'error': {
                'code': exc.code,
                'message': exc.message,
                'details': exc.details,
                'timestamp': request.state.timestamp.isoformat(),
                'requestId': request.state.request_id,
            }
        },
    )
```

## Monitoring and Observability

### Monitoring Stack
- **Frontend:** Vercel Analytics + Sentry browser SDK with release tags and session replay for core flows.
- **Backend:** Datadog APM (FastAPI, Celery, Timescale) via OpenTelemetry exporters.
- **Error Tracking:** Sentry (frontend + backend) with Slack pager integration.
- **Performance Monitoring:** Datadog RUM, synthetic API checks, Timescale continuous aggregates for run durations.

### Key Metrics
**Frontend:** Core Web Vitals, JS error rate, API latency (React Query), guided onboarding completion.

**Backend:** Request rate, error rate, P95 latency, worker throughput, Redis queue depth, Timescale query performance.

## Checklist Results Report
Architect checklist not yet executed—run `*execute-checklist architect-checklist` after team review to append outcomes here.
