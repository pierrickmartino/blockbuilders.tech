<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- (new) -> Production-Grade Code Quality
- (new) -> Contract-Led Testing Discipline
- (new) -> Unified Experience Consistency
- (new) -> Performance Budget Accountability
Added sections:
- Implementation Guardrails
- Delivery Workflow & Compliance
Removed sections:
- None
Templates requiring updates:
- UPDATED .specify/templates/plan-template.md
- UPDATED .specify/templates/spec-template.md
- UPDATED .specify/templates/tasks-template.md
- PENDING .specify/templates/commands/ (directory absent; add guidance when commands are introduced)
Follow-up TODOs: None
-->

# Blockbuilders Constitution

## Core Principles

### Production-Grade Code Quality
**Non-Negotiables**
- All services and packages MUST ship with automated linting, formatting, and static analysis that run in CI with zero warnings tolerated; suppression requires an approved, time-boxed remediation plan documented in the implementation plan.
- Implementation plans and specs MUST call out refactors or debt paydown necessary to keep modules cohesive; code review MUST block hidden coupling, shared mutable state, or abstractions without owners.
- Shared libraries MUST expose typed, documented contracts and changelogs; breaking changes demand a migration note and version bump synchronized across dependents.

**Rationale**
High-quality code keeps the rapidly evolving monorepo maintainable, enabling safe reuse and faster iteration.

### Contract-Led Testing Discipline
**Non-Negotiables**
- Every feature spec MUST enumerate unit, integration, end-to-end, and non-functional tests that prove each acceptance scenario before implementation starts; plans must schedule when those tests fail first (red) and pass (green).
- CI pipelines MUST block merges until all mandated tests run green, including contract tests for APIs, worker smoke suites, and frontend journeys; touched modules MUST sustain >=85% statement coverage with any gaps justified in the QA record.
- Nightly jobs MUST execute load/backtest harnesses and alert on regressions; failures pause new releases until resolved with documented root cause analysis.

**Rationale**
Testing first protects product integrity, uncovers regressions early, and keeps confidence high for continuous delivery.

### Unified Experience Consistency
**Non-Negotiables**
- User-facing work MUST map each component to the canonical design system tokens and patterns in `docs/front-end-spec.md`; deviations require UX approval captured in the spec's decision log.
- All flows MUST satisfy WCAG 2.1 AA, declare responsive breakpoints, and define consistent loading, empty, and error treatments before implementation.
- Copy, onboarding, and in-app education updates MUST route through UX review and localization checks that land in the relevant quickstart or documentation updates.

**Rationale**
A cohesive, accessible experience builds user trust and accelerates onboarding for non-technical traders.

### Performance Budget Accountability
**Non-Negotiables**
- Backend endpoints MUST sustain <=150 ms p95 latency and queue-backed workloads MUST meet SLAs defined in `docs/architecture/security-and-performance.md`; instrumentation MUST be in place before feature toggles lift.
- Frontend routes MUST keep Largest Contentful Paint <=2.5 s on mid-tier hardware, limit critical JavaScript to <=100 KB, and log core web vitals to monitoring dashboards.
- Strategy backtests and simulations MUST complete standard workloads in <=30 s (per PRD FR3) with performance smoke tests executed on every release candidate.

**Rationale**
Measured performance ensures simulations feel responsive, protects infrastructure costs, and preserves competitive differentiation.

## Implementation Guardrails

- Specifications, plans, and task breakdowns MUST explicitly document how each principle is satisfied, including the code quality plan, enumerated tests with owners, UX alignment references, and the performance budget with instrumentation strategy.
- Feature work MUST include monitoring dashboards, observability hooks, and post-launch validation tasks that confirm the stated budgets and UX guardrails remain intact.
- Any exception to the principles requires a written risk acceptance signed by Engineering, Product, and QA leadership, including a concrete remediation deadline.

## Delivery Workflow & Compliance

1. **Planning Gate** - `/speckit.plan` outputs MUST populate the Constitution Check with evidence for all four principles before Phase 0 research commences.
2. **Specification Gate** - `spec.md` MUST carry traceable acceptance tests, UX artefact links, and performance budgets so implementation tasks inherit explicit requirements.
3. **Execution Gate** - `/speckit.tasks` MUST tie every task to its corresponding tests, UX acceptance, and performance verification; no development task closes without linked test execution evidence.
4. **Release Gate** - CI, QA, and UX sign-offs confirm principle compliance; unresolved variances escalate to the governance review for decision or rollback.

## Governance

- **Authority** - This constitution supersedes conflicting documentation; engineering decisions that diverge from it are invalid until amended.
- **Amendments** - Changes require a PR describing rationale, impact analysis, and updates to affected templates or guidance. Approval from Engineering Lead, Product Lead, and QA Lead is mandatory before merge.
- **Versioning Policy** - Semantic versioning governs updates: MAJOR for principle redefinitions or removals, MINOR for new principles or governance steps, PATCH for clarifications. Version increments occur within the amendment PR.
- **Compliance Review** - Quarterly audits sample features to verify principle adherence, retrospectives document variances, and corrective actions feed the backlog with tracked owners and due dates.

**Version**: 1.0.0 | **Ratified**: 2025-10-27 | **Last Amended**: 2025-10-27
