# Epic 2 Trusted Backtesting & Data Pipeline

**Epic Goal:** Deliver dependable data ingestion and simulation capabilities that generate insightful reports users can trust. This epic ensures backtests are fast, explainable, and auditable.

## Story 2.1 Market Data Ingestion & Quality Guardrails
As a data steward,
I want market data ingestion with automated validation,
so that strategy results reflect accurate and complete historical information.

### Acceptance Criteria
1. 1: TimescaleDB (or equivalent) stores normalized OHLCV data for at least BTC-USD and ETH-USD pairs from two vendors.
2. 2: ETL jobs run hourly, reconciling discrepancies and logging anomalies with automated alerting to Slack/email.
3. 3: Data catalog UI lists data coverage, freshness, and known issues for transparency.
4. 4: Cost guardrails monitor data API usage against budget thresholds with automated notifications.

## Story 2.2 Backtest Engine & Execution Service
As a strategy builder,
I want to run deterministic backtests from the canvas,
so that I can evaluate performance with confidence.

### Acceptance Criteria
1. 1: Canvas trigger packages strategy graph into executable payload and submits to simulation service via queue.
2. 2: Backtest worker executes strategies with configurable fee/slippage models and position sizing.
3. 3: Results include equity curve, drawdown, trade ledger, and scenario metadata stored for later comparison.
4. 4: Standard tier backtests complete within 30 seconds and return status updates to the UI.

## Story 2.3 Insights & Comparison Dashboard
As an analytical user,
I want rich reporting and comparison tools,
so that I can interpret results and iterate faster.

_Status:_ Phase 3 backlog; unlock after MVP validation confirms KPI targets for three consecutive weeks.

### Acceptance Criteria
1. 1: Backtest results view visualizes KPIs, charts, and anomaly callouts with export to CSV/PDF.
2. 2: Comparison dashboard allows selecting up to five strategies, highlighting deltas in KPIs and risk metrics.
3. 3: Insight engine surfaces recommendations (e.g., max drawdown exceeds threshold) with links to learning content.
4. 4: All reporting components meet WCAG AA contrast and interaction standards.
