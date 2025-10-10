# Data Models

## User
**Purpose:** Authenticated actor (builder, tinkerer, educator, admin) owning strategies, templates, and notifications.

**Key Attributes:**
- id: UUID – Primary identifier from Supabase `auth.users`
- email: string – Unique contact for alerts
- display_name: string – Profile name
- roles: string[] – Role claims controlling access (builder, educator, admin)
- plan_tier: enum – free, premium, educator
- created_at: Date – Account creation timestamp
- last_active_at: Date – Engagement tracking

### TypeScript Interface
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

### Relationships
- Has many Strategy, TemplateShare, Notification records
- Belongs to one SubscriptionPlan
- Drives quota enforcement and compliance approvals

## Strategy
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

### TypeScript Interface
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

### Relationships
- Has many StrategyVersion entries
- Aggregates BacktestRun and PaperTradeRun metrics
- Linked to TemplateShare and ComplianceEvent entities

## StrategyVersion
**Purpose:** Immutable snapshot of a strategy graph used for validation, simulations, and publication.

**Key Attributes:**
- id: UUID – Primary key
- strategy_id: UUID – Parent strategy
- version: int – Monotonic version number
- graph_json: jsonb – Serialized block graph
- notes: string – Changelog notes
- created_by: UUID – Author
- created_at: Date – Audit timestamp

### TypeScript Interface
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

### Relationships
- Belongs to Strategy
- Referenced by BacktestRun, PaperTradeRun, TemplateShare
- Subject to ComplianceEvent review before publication

## BacktestRun
**Purpose:** Historical simulation request + results for a specific strategy version.

**Key Attributes:**
- id: UUID – Primary key
- strategy_version_id: UUID – Version executed
- requested_by: UUID – Initiating user
- parameters: jsonb – Range, exchange, capital
- status: enum – queued, running, succeeded, failed
- metrics: jsonb – KPIs, equity curve, anomalies
- started_at / completed_at: Date – Timing details

### TypeScript Interface
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

### Relationships
- Belongs to StrategyVersion
- Emits Notification entries on completion/failure
- Populates comparison dashboards via materialized views

## PaperTradeRun
**Purpose:** Scheduled or continuous simulation mirroring live execution assumptions.

**Key Attributes:**
- id: UUID – Primary key
- strategy_version_id: UUID – Version monitored
- schedule: jsonb – Frequency, exchanges, capital
- status: enum – scheduled, active, paused, stopped
- performance_snapshot: jsonb – KPI summary
- alert_config: jsonb – Thresholds for anomalies
- last_execution_at: Date – Most recent tick

### TypeScript Interface
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

### Relationships
- Belongs to StrategyVersion
- Triggers Notification alerts
- Surfaces in educator dashboards and compliance escalations

## TemplateShare
**Purpose:** Published strategy version with metadata, permissions, and attribution for educators.

**Key Attributes:**
- id: UUID – Primary key
- strategy_version_id: UUID – Published version
- educator_id: UUID – Owner
- audience_scope: enum – cohort, public
- metadata: jsonb – Description, tags, disclaimers
- clone_count: int – Adoption metrics
- created_at: Date – Publication timestamp

### TypeScript Interface
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

### Relationships
- Belongs to StrategyVersion
- Drives cohort dashboards and clone analytics
- Requires ComplianceEvent approval before public release

## ComplianceEvent
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

### TypeScript Interface
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

### Relationships
- Links to StrategyVersion or TemplateShare records
- Generates Notification alerts to stakeholders
- Mirrors evidence to S3 for regulator-ready archives

## Notification
**Purpose:** Central store for in-app, email, and webhook notifications that power the unified notification center.

**Key Attributes:**
- id: UUID – Primary key
- user_id: UUID – Recipient
- type: enum – backtest_complete, paper_trade_alert, governance_task, system
- payload: jsonb – Structured metadata (e.g., run IDs, anomaly details)
- channel: enum – in_app, email, webhook
- read_at: Date – Null until acknowledged
- created_at: Date – Delivery timestamp

### TypeScript Interface
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

### Relationships
- Belongs to User
- References BacktestRun, PaperTradeRun, or ComplianceEvent via payload metadata
- Drives unread counters for notification center and toasts

## PlanUsage
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

### TypeScript Interface
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

### Relationships
- Belongs to User
- Hydrated from SubscriptionPlan quota JSONB and worker events
- Queried before simulation actions to gate free-tier boundaries per PRD v1.4
