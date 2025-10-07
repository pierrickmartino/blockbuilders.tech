# Project Brief: Blockbuilders

> Owner: **Business Analyst (Mary)** • Status: **Revision in Progress v1.1** • Date: 2025-09-21

---

## Executive Summary
Blockbuilders is a web-based, no-code strategy lab that lets retail crypto traders visually compose, backtest, paper-trade, and compare trading algorithms without writing code. The product addresses the steep learning curve and fragmented toolchain that keeps beginners out of systematic trading.
Targeting curious retail traders and aspiring quants, Blockbuilders bundles an intuitive drag-and-drop canvas with high-fidelity backtesting, ongoing paper trading, and comparison dashboards. The freemium model offers a low-friction entry point while premium unlocks unlimited usage and advanced analytics, building a pathway from experimentation to committed subscription.

## Problem Statement
Retail crypto traders who lack coding skills are locked out of algorithmic trading or forced to rely on unreliable, manual workflows. Current DIY stacks demand Python proficiency, data engineering, and costly infrastructure, while polished SaaS tools skew toward professionals and still require scripting. The result is experimentation that is slow, error-prone, and difficult to trust: users question data quality, can’t replicate results, and risk deploying untested ideas. With crypto markets remaining volatile and fast-moving, there is urgency to provide a safer, educational on-ramp that lets retail traders practice systematic strategies without exposing real capital.

## Proposed Solution
Blockbuilders delivers a no-code strategy builder that chains together data sources, indicators, signal logic, risk controls, and execution parameters through a visual canvas. Every strategy can be versioned, backtested against institutional-grade historical data, and scheduled for paper trading with realistic execution assumptions. Side-by-side comparisons, templated starter strategies, and guided educational flows differentiate the product from incumbent scripting platforms. Success hinges on keeping simulations trustworthy, workflows approachable, and value obvious within minutes, ensuring that novices can progress from idea to actionable insight inside one cohesive application.

## Target Users
### Primary User Segment: Retail Crypto Tinkerers
- **Profile:** Individuals aged 22–45, globally distributed, active on exchanges like Coinbase, Binance, or Kraken with <$25K portfolios.
- **Behaviors:** Consume crypto content, experiment with manual trades, dabble in bots via marketplaces, rely on spreadsheets/TradingView.
- **Needs & Pain Points:** Want systematic approaches without code, need accurate backtests, desire a safe space to practice before risking funds, seek confidence in strategy logic.
- **Goals:** Launch viable strategies, learn best practices, and monitor simulated performance to build discipline.

### Secondary User Segment: Crypto Educators & Community Leaders
- **Profile:** Influencers, newsletter writers, Discord/Telegram community moderators who teach trading concepts.
- **Behaviors:** Produce educational content, host challenges, showcase strategies to engaged audiences.
- **Needs & Pain Points:** Need sharable templates, reproducible backtests, collaboration-friendly tooling, and white-labeled experiences.
- **Goals:** Provide students with structured exercises, monetize premium cohorts, and validate strategies before public releases.

## Research & Market Validation
### Evidence To Date
- Founder discovery sessions reinforce appetite for visual, trustworthy alternatives to Pine Script bots.
- Desk research highlights market chatter around simulation trust gaps and the scarcity of educator-friendly tooling.

### In-Flight Activities
- Five user interviews (three retail traders, two educators) scheduled during Week 1 of Sprint 1 with incentives secured and discussion guides drafted.
- Competitive teardown across Trality, Kryll, and Composer underway to document onboarding friction, pricing, and differentiating features.
- Research repository templates prepared in Notion to capture pains, desired outcomes, and trust signals immediately after each session.

### Upcoming Deliverables
| Initiative | Owner | Status | Target Date | Next Step |
| --- | --- | --- | --- | --- |
| Retail trader interviews | PM (John) + UX (Sally) | Scheduled | 2025-09-27 | Conduct first two sessions and upload recordings/notes |
| Educator interviews | PM (John) | Scheduled | 2025-09-30 | Confirm incentives and finalize synthesis format |
| Competitive benchmarking | BA (Mary) | In Flight | 2025-09-29 | Complete feature/pricing matrix and highlight differentiation |
| Insight synthesis | PM (John) | Pending | 2025-10-02 | Summarize findings, update personas, and feed PRD evidence sections |

## Goals & Success Metrics
### Business Objectives
- Launch private beta within 16 weeks and onboard 250 qualified testers with ≥50% weekly activity.
- Reach 10,000 free-tier signups and 700 premium conversions within the first 6 months post-launch.
- Attain monthly churn <5% for premium subscribers by month nine.

### User Success Metrics
- 70% of new users run a first backtest within 15 minutes of onboarding.
- Median time from first login to first saved strategy stays below 20 minutes.
- At least 60% of active builders schedule a paper-trade run within their first week.

### Key Performance Indicators (KPIs)
- **Activation:** % of new accounts completing guided onboarding + first backtest (target ≥65%).
- **Engagement:** Weekly Active Builders (WAB) and average backtests per builder (target ≥4/week).
- **Monetization:** Free-to-premium conversion rate (target 6–8% in 90 days) and ARPU growth.
- **Trust:** Net Trust Score (NTS) gathered via in-app surveys about data fidelity (target ≥8/10).

## MVP Scope
### Core Features (Must Have)
- **Visual Strategy Canvas:** Drag-and-drop blocks for indicators, signal logic, risk controls, and execution settings with inline validation.
- **Backtesting Engine:** One-click simulation with configurable parameters, realistic fee/slippage modeling, and exportable reports.
- **Paper-Trading Scheduler:** Continuous simulated execution with alerting, performance dashboards, and head-to-head comparisons.
- **Template Library & Guided Onboarding:** Starter strategies, tutorials, and walkthroughs for first-time users.
- **Freemium Access Controls:** Usage caps, workspace limits, and premium entitlements integrated with billing.

### Out of Scope for MVP
- Live exchange integrations or API key management.
- Derivatives (options/futures) or high-frequency trading capabilities.
- Automated strategy marketplace or revenue sharing.
- Native mobile app (responsive web only).
- AI-generated strategies beyond curated templates.

### MVP Success Criteria
MVP is successful when a cohort of 500 free users and 100 paying subscribers iteratively build, backtest, and paper trade strategies with ≥4 weekly sessions, report ≥8/10 trust in results, and generate at least two comparison reports per month without customer support escalation.

## Post-MVP Vision
### Phase 2 Features
- Collaborative workspaces with shared strategy libraries and role-based permissions.
- Parameter optimization tools (grid, genetic algorithms) with overfitting protections.
- Marketplace for vetted community templates and educator monetization.

### Long-term Vision
Over 12–24 months, Blockbuilders evolves into the preferred experimentation environment for retail and semi-professional crypto traders, offering seamless transitions from design to simulated or controlled live trading. It becomes a data-rich learning platform with personalized coaching, regulatory-friendly guardrails, and integrations into portfolio management suites.

### Expansion Opportunities
- Regionalized data packs (e.g., EU-regulated exchanges) and localized education content.
- API access for partners building on top of the simulation engine.
- Institutional lite tier for boutique funds wanting sandboxed modeling.

## Technical Considerations
### Platform Requirements
- **Target Platforms:** Responsive web app optimized for desktop and large tablets.
- **Browser/OS Support:** Latest two releases of Chrome, Edge, Safari, Firefox; macOS, Windows, iPadOS support.
- **Performance Requirements:** Backtests of one year of hourly data should complete <30s in standard tier; UI time-to-interactive <2s on broadband.

### Technology Preferences
- **Frontend:** Next.js (App Router) with TypeScript and TailwindCSS.
- **Backend:** FastAPI services in Python with async workers for long-running jobs.
- **Database:** Supabase Postgres for auth/config; TimescaleDB for time-series storage.
- **Hosting/Infrastructure:** Vercel for frontend, managed Kubernetes or container services (e.g., AWS ECS) for API/workers, Redis for task queues, S3-compatible storage for results.

### Architecture Considerations
- **Repository Structure:** Monorepo containing Next.js frontend, FastAPI backend, shared TypeScript/Pydantic schemas, and infrastructure IaC modules.
- **Service Architecture:** Modular services (auth, strategy builder, simulation engine, analytics) communicating via REST/gRPC events dispatched through message queues.
- **Integration Requirements:** Connectors for market data providers (REST/WebSocket), Stripe billing, email/push notification services, observability (Sentry/Datadog).
- **Security/Compliance:** Role-based access control, audit logging, encryption at rest/in transit, clear messaging that the platform is simulation-only.

## Constraints & Assumptions
### Constraints
- **Budget:** Seed-stage runway targeting <$500K burn for first year; infrastructure budget capped at $8K/month during beta.
- **Timeline:** Alpha in 12 weeks (backtesting + canvas), beta in 16 weeks (adds scheduler/comparisons), GA six months after project start.
- **Resources:** Core team of 6 (1 PM/BA, 2 Frontend, 2 Backend/Quant, 1 Designer) with fractional DevOps and compliance advisor.
- **Technical:** Must remain within prescribed tech stack; market data licensing must honor redistribution limits.

### Key Assumptions
- Target users accept simulation-only experience for first year if scenario fidelity is high.
- Freemium tier plus community templates will drive organic acquisition via influencers.
- Reliable historical and real-time market data sources are contractually accessible within budget.
- Educational content and guardrails reduce compliance risk by clarifying non-advisory positioning.

## Risks & Open Questions
### Key Risks
- **Regulatory Perception:** Misinterpretation as investment advice; mitigate with clear disclaimers, supervised content, and compliance reviews.
- **Data Quality & Coverage:** Gaps or incorrect candles erode trust; mitigate with multi-source validation and automated alerts.
- **Simulation Realism:** Unrealistic fill assumptions mislead users; mitigate with conservative defaults, sensitivity analysis, and transparency.
- **Infrastructure Costs:** Intensive simulations may spike costs; mitigate through workload prioritization, caching, and premium-tier throttling.
- **User Overwhelm:** Too many advanced options may intimidate beginners; mitigate with progressive disclosure and tutorial modes.

#### Risk Tracking Summary
| Risk Focus | Owner | Target Date | Current Status | Mitigation Notes |
| --- | --- | --- | --- | --- |
| Market data vendor selection | PM (John) + Data Engineer (TBD) | 2025-09-29 | On Track | Evaluate Kaiko vs. Coin Metrics licensing, document cost/coverage trade-offs |
| Simulation realism validation | Backend/Quant Lead (TBD) | 2025-10-06 | Planned | Prototype slippage models, compare outputs against historical exchange data |
| Freemium quota definition | PM (John) + Growth (TBD) | 2025-10-03 | Needs Kickoff | Model load impact and align quotas with monetization targets |

### Open Questions
- Which market data vendors balance cost, latency, and licensing flexibility for launch?
- What limits (runs/day, strategy count) make the freemium tier attractive yet convert at target rates?
- How should educator/partner sharing workflows handle revenue splits or IP concerns?
- What minimum indicator/block set constitutes “complete enough” for beta vs GA?
- Do we introduce social/community features early or defer until core workflows stabilize?

### Areas Needing Further Research
- Competitive teardown of leading no-code and low-code algo trading tools.
- Legal review across key jurisdictions (US, EU, APAC) for simulation products.
- Pricing and willingness-to-pay validation with target segments.
- Onboarding UX usability testing with non-programmer traders.

## Appendices
### A. Research Summary
- Completed discovery notes confirm demand for intuitive, trustworthy strategy tooling and highlight onboarding confusion within incumbent platforms.
- Upcoming interviews (Week 1, Sprint 1) and competitive teardown (Week 2, Sprint 1) will provide evidence to validate personas, pricing, and adoption assumptions.
- Synthesis cadence established: publish insight brief within two business days after final interview and circulate to PM/UX/Engineering for roadmap alignment.

### B. Stakeholder Input
Founders emphasize educational guardrails, community-led growth, and ensuring that “first win” happens in under 20 minutes.

### C. References
- Founders’ discovery notes (Sept 2025)
- Compliance advisor memo outline (scheduled)

## Next Steps
1. Conduct five user discovery interviews and publish synthesized persona updates by 2025-10-02.
2. Complete competitive benchmarking deliverable and integrate takeaways into positioning brief by 2025-09-29.
3. Draft beta implementation playbook (deployment cadence, runbooks, support SLAs) with Engineering and Support leads before architecture kickoff.
4. Finalize market data vendor shortlist with cost/coverage comparison and present recommendation to founders by 2025-09-29.
5. Validate pricing and freemium quota limits through survey experiments, feeding results into monetization plan by 2025-10-03.
6. Align with legal counsel on disclaimers and simulation-only positioning, updating copy guidelines ahead of UX workshops.

### PM Handoff
This Project Brief provides the full context for Blockbuilders. Please start in “PRD Generation Mode,” review the brief thoroughly, and collaborate to draft the PRD, asking for any necessary clarifications or suggesting improvements.
