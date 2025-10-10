# Epic 3 Paper Trading & Performance Monitoring

**Epic Goal:** Enable users to continue validating strategies through scheduled paper trading, continuous monitoring, and actionable alerts, reinforcing trust and engagement.

## Story 3.1 Paper Trading Scheduler & Execution
As an engaged builder,
I want to schedule strategies for continuous paper trading,
so that I can observe live-like performance without risking capital.

### Acceptance Criteria
1. 1: Users schedule frequency, exchanges, and capital allocation for paper runs with quota checks for freemium limits.
2. 2: Scheduler enqueues runs, executes them on market-close or interval triggers, and stores simulated fills with timestamps.
3. 3: Execution logs differentiate between simulated and historical data, including assumptions used.
4. 4: Emails and in-app notifications summarize run results and status changes.

## Story 3.2 Performance Dashboards & Alerting
As a returning user,
I want dashboards that track paper-trade performance and alert anomalies,
so that I can decide whether to iterate or graduate strategies.

### Acceptance Criteria
1. 1: Dashboard aggregates KPIs (PnL, Sharpe, win rate, drawdown) with trend visualizations across time.
2. 2: Users configure alert thresholds (e.g., drawdown > X%, win rate < Y%) and delivery channels.
3. 3: Real-time notification center displays alert history with acknowledgment workflow.
4. 4: Observability events feed into Datadog dashboards for operations oversight.

## Story 3.3 Educator & Cohort Monitoring Tools
As a community leader,
I want to monitor my shared strategies and cohort engagement,
so that I can support learners and highlight wins.

_Status:_ Phase 2 backlog; begin only after MVP validation scorecard targets hold for three consecutive weeks.

### Acceptance Criteria
1. 1: Educator dashboard lists shared templates, adopters, and their paper-trade performance summaries.
2. 2: Cohort tagging groups learners for aggregated metrics and messaging.
3. 3: Exportable reports share cohort progress while respecting privacy and simulation disclaimers.
4. 4: Role-based access control limits educator views to their shared assets.
