# Requirements

## Functional
1. FR1: The system must provide a visual drag-and-drop canvas with core block types (data source, indicator, signal logic, risk controls, execution) and inline validation.
2. FR2: Users must be able to configure block parameters, connect blocks into executable strategy graphs, and version their strategies with change history.
3. FR3: The platform must run backtests on at least one year of hourly crypto data per supported exchange, outputting performance, equity curves, and trade logs under 30 seconds for standard runs.
4. FR4: Users must schedule paper-trading runs that mirror strategy parameters, leverage realistic execution assumptions, and deliver alerting via in-app notifications and email.
5. FR5: The application must surface starter templates, guided walkthroughs, and contextual education to drive first successful backtest within 15 minutes of signup.
6. FR6: Community leaders must be able to share strategy templates with attribution, set duplication permissions, and monitor follower copies.
7. FR7: Access must enforce freemium limits (e.g., capped strategies, backtests, and scheduled runs) while enabling premium entitlements and Stripe-powered billing upgrades.
8. FR8: Users must compare multiple strategy results side-by-side, including KPIs, charts, and anomaly flags for variance explanations.
9. FR9: Admins must manage data connectors, plan settings, and compliance messaging through an operations console.

## Non Functional
1. NFR1: Backtests covering one year of hourly data must complete within 30 seconds for standard tier workloads with 95th percentile under 45 seconds.
2. NFR2: UI time-to-interactive must stay under 2 seconds on broadband for authenticated users accessing core flows.
3. NFR3: All data in transit and at rest must be encrypted, with audit logging across strategy changes, executions, and admin actions.
4. NFR4: System uptime must target 99.5% monthly availability across core services during beta.
5. NFR5: Architecture must support horizontal scaling of simulation workers without downtime and allow cost controls to remain within the $8K/month infrastructure budget during beta.
6. NFR6: Regulatory messaging must clearly state “simulation only / not financial advice” across all user touchpoints, with compliance review workflows logged.
7. NFR7: The platform must support the latest two versions of Chrome, Edge, Safari, and Firefox on macOS, Windows, and iPadOS.
8. NFR8: Observability must include centralized logging, metrics, and alerts that surface data quality or execution anomalies within 5 minutes.

## Cross-Functional Requirements

### Data Management
- Core application schema must capture `User`, `Strategy`, `Block`, `BacktestRun`, `PaperTradeRun`, `Template`, and `Notification` entities with immutable audit fields (created/updated timestamps, actor IDs).
- Market data is stored in TimescaleDB with raw OHLCV retained for 24 months and hourly aggregates retained for 5 years to support long-horizon analysis.
- Strategic artifacts (strategy graphs, configuration payloads, simulation results) must be versioned and retained for at least 18 months to preserve reproducibility.
- Compliance and activity logs covering strategy edits, approvals, and exports must be preserved for 7 years and exportable for regulators on request.
- Nightly snapshots and weekly full backups must be automated for TimescaleDB and application databases, with restore drills executed quarterly.

### Integrations
- Market data connectors must support a primary vendor (e.g., CoinDesk) and secondary failover (e.g., Coin Metrics) with hourly reconciliation and API key rotation every 90 days.
- Stripe integration handles billing, entitlement updates, and invoices via signed webhooks; sandbox and production keys must be isolated with replay protection.
- Notification services use SendGrid for email delivery and in-app notification center as fallback; email templates must contain compliance disclosures and unsubscribe links.
- Observability data must stream into Datadog (logs, metrics, traces) with shared dashboards for product, engineering, and operations.
- Authentication delegates to the selected identity provider (see architecture) with SSO roadmap tracked; integrations must expose role-based claims for educator and admin tooling.

### Operational Guardrails
- Environments: maintain development, staging, and production tiers with automated CI/CD; production deploys require passing automated tests and approval from product + engineering leads.
- Monitoring: define alert thresholds for backtest latency, ETL freshness, Stripe webhook failures, and notification bounce rates; alerts must page on-call within 5 minutes.
- Support: offer in-app support intake with response SLAs (business hours <8h, off-hours <24h) and maintain a public status page for incidents.
- Cost management: simulation worker autoscaling must enforce beta budget ($8K/month) with monthly cost reports shared with finance; trigger alerts at 80% budget utilization.
- Compliance: ensure “simulation only” messaging is enforced across onboarding, exports, and emails; quarterly reviews confirm disclosures and policy updates are in place.

## MVP Scope Boundaries

### In Scope (MVP Must-Haves)
- Visual strategy canvas with block configuration, version history, and inline validation (FR1–FR2).
- Trusted backtesting on BTC-USD and ETH-USD with deterministic workers and reporting exports (FR3, Story 2.2).
- Paper-trading scheduler with alerting, dashboards, and compliance messaging (FR4, Epic 3 Stories 3.1–3.2).
- Starter templates, guided onboarding, and education hub that drive first successful backtest within 15 minutes (FR5, Story 1.2).
- Freemium plan enforcement, upgrade prompts, and Stripe-powered entitlements (FR7, Story 4.2).

### Out of Scope (MVP)
- Educator automation and cohort analytics beyond basic template adoption reporting (Story 3.3) — begin only after MVP validation scorecard goals hold for three consecutive weeks.
- Insight engine recommendations and anomaly explanations requiring ML heuristics (Story 2.3) — keep KPI comparisons but exclude automated insights until post-MVP validation unlocks Phase 3.
- Template marketplace monetization levers (e.g., rev-share, paid template listings) — defer until the MVP is validated and community engagement targets are met.
- Community moderation workflows for template governance beyond manual review queues (Story 4.1) — targeted for post-MVP automation.
- Premium-only deep analytics (e.g., scenario stress testing, advanced drawdown attribution) — roadmap feature for premium tiers after validation of core usage.

### Deferred Enhancements & Future Phases
- Unlock Phases 2 and 3 only after MVP validation KPIs (activation, time-to-value, engagement, trust) meet or exceed targets for three consecutive weeks.
- Phase 2: Educator dashboards with cohort tagging, automated compliance workflows, and expanded sharing governance.
- Phase 3: Insight engine, anomaly detection, and template marketplace monetization features.
- Infrastructure roadmap: multi-region data replication, SSO integrations, and real-money trading partner integrations (pending regulatory review).

## MVP Validation & Feedback Plan
- **Activation KPI (≥65% of new accounts complete guided onboarding + first backtest)** — instrument onboarding checklist events, confirm within the first session, and review dashboards weekly during beta (`docs/brief.md:30-45`).
- **Time-to-value KPI (median <20 minutes from first login to first saved strategy)** — log canvas save events and correlate with session start to monitor in Mixpanel/Datadog product analytics.
- **Engagement KPI (≥4 backtests per active builder per week)** — aggregate backtest runs per user; share weekly insights in product standup to prioritize friction fixes.
- **Paper-trade adoption KPI (60% schedule runs within week one)** — track scheduler usage; trigger automated nudges to users who complete backtest but skip scheduling.
- **Net Trust Score (≥8/10)** — launch in-app survey at first completed paper-trade week; collect qualitative feedback tagged by theme for PM/UX review.
- **Feedback Loops** — conduct bi-weekly beta interviews with a mix of new and returning builders, synthesize findings in research repository, and adjust roadmap accordingly.
- **Release Readiness** — maintain a rolling beta scorecard combining KPIs above; greenlight broader GA marketing once activation + trust targets hold steady for three consecutive weeks.
- **Post-MVP Gate** — educator automation, anomaly insight, and marketplace monetization tracks stay frozen until the beta scorecard confirms KPI targets for three consecutive weeks.
