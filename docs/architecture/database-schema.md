# Database Schema
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
