<!--
Sync Impact Report
Version: 1.0.0 → 1.1.0
Modified Principles:
- PRINCIPLE_1_NAME → Principle I — Code Quality Stewardship
- PRINCIPLE_2_NAME → Principle II — Test-First Evidence
- PRINCIPLE_3_NAME → Principle III — Consistent User Journeys
- PRINCIPLE_4_NAME → Principle IV — Performance Guarantees
Added Sections:
- Implementation Guardrails
- Workflow & Compliance
Removed Sections:
- Principle V placeholder
Templates:
- .specify/templates/plan-template.md ✅ updated
- .specify/templates/spec-template.md ✅ updated
- .specify/templates/tasks-template.md ✅ updated
- README.md ✅ updated
- .specify/templates/commands/ ⚠ pending (directory absent; add guidance once commands exist)
Follow-up TODOs:
- TODO(RATIFICATION_DATE): Provide original adoption date
-->

# Blockbuilders Engineering Constitution

## Core Principles

### Principle I — Code Quality Stewardship

- CI MUST block merges unless linting, formatting, static analysis, and type checks pass for every affected workspace.
- New or modified modules MUST provide typed public contracts and module-level documentation (README or docstring) before they can be consumed by another package.
- Architectural boundaries between `apps/*` and `packages/*` MUST remain acyclic; introduce a new dependency only with an ADR recorded in `docs/architecture/decisions/`.
- Code owners MUST reject pull requests that exceed cyclomatic complexity 10 or 30 executable lines per function unless the PR links a mitigation plan in the spec/plan.

**Rationale:** Stable, well-documented modules prevent cascading regressions and keep the monorepo maintainable as more strategy tooling ships.

### Principle II — Test-First Evidence

- Every feature branch MUST add or update automated tests that fail before implementation and pass afterward; merging without test evidence is prohibited.
- Services MUST maintain ≥85% statement coverage on all files touched by the change; lower coverage requires an explicit waiver logged in `specs/.../plan.md`.
- Critical trading and simulation paths MUST include integration tests (API + worker + data stores) that run in CI pre-merge and nightly.
- The test suite MUST be deterministic; flaky tests block merges until quarantined with an issue link and remediation plan.

**Rationale:** Evidence-driven development catches regressions early, protecting customer trust in simulations and live-trading outcomes.

### Principle III — Consistent User Journeys

- Front-end work MUST compose components and tokens from `packages/design-system`; introducing bespoke UI requires documented approval in the spec.
- All UI additions MUST pass automated accessibility checks (eslint-plugin-jsx-a11y + Lighthouse) meeting WCAG 2.1 AA for semantic structure, contrast, and keyboard flows.
- Feature specs MUST pin the UX reference (e.g., `docs/front-end-spec.md` version) and any deviation MUST include updated mockups reviewed by UX before development starts.
- Responsive breakpoints (mobile ≤640px, tablet ≤1024px, desktop >1024px) MUST be validated before release; failing breakpoints require a follow-up task before launch.

**Rationale:** Consistent interactions and accessible visuals make the no-code lab feel trustworthy for new builders and power users alike.

### Principle IV — Performance Guarantees

- The Next.js app MUST sustain Largest Contentful Paint ≤2.5s at p75 on mid-tier hardware (Chrome: Moto G Power profile) before a feature can graduate from QA.
- FastAPI endpoints serving trade or simulation data MUST meet ≤200ms p95 latency under 500 req/min synthetic load in the staging stack.
- Celery/worker jobs that power backtests MUST finish a 30-day hourly dataset within 5 minutes; longer runtimes require sliced execution plans documented in the spec.
- Every feature plan MUST specify the metric sources (Datadog dashboards, Chrome traces, pytest perf markers) that will demonstrate budget compliance post-release.

**Rationale:** Performance determines whether strategy iteration feels immediate or unusable; guarding budgets keeps the lab viable for realtime decision-making.

## Implementation Guardrails

- Instrumentation: All services MUST emit structured logs with correlation IDs, latency, and error codes; metrics and traces MUST flow to Datadog before feature launch.
- Secrets: Environment configuration MUST come from `.env` templates checked into the repo; hard-coded secrets or ad-hoc env vars are forbidden.
- Dependencies: Third-party libraries MUST undergo security vetting (license + CVE scan) recorded in the plan doc before inclusion.
- Documentation: Every approved ADR MUST note the principle(s) it satisfies and link back to the relevant spec/plan section.

## Workflow & Compliance

- Feature plans MUST document how each principle is satisfied; missing detail blocks Phase 0 research sign-off.
- Specs MUST enumerate test evidence (Principle II), UX references (Principle III), and performance budgets (Principle IV) before status can move past Draft.
- Pull requests MUST reference the governing principle for each non-trivial change in the PR description checklist.
- Quarterly, the engineering leads and PM review adherence metrics (lint pass rate, coverage deltas, performance budgets) and publish an audit note in `/docs/ops/`.

## Governance

- This constitution supersedes contradictory guidance in other docs; conflicts MUST resolve in favor of the latest amended constitution.
- Amendments require (1) linked discussion issue, (2) approval from Engineering Lead, Product Lead, and UX, and (3) updated Sync Impact Report plus version bump per SemVer.
- Ratification changes (MAJOR versions) require migration guidance for existing specs/plans; MINOR captures new principles; PATCH covers textual clarifications only.
- Compliance audits run quarterly; discoverable violations MUST have corrective tasks tracked in Linear within five business days.
- Technical decisions (ADR, plan, spec, PR) MUST cite the relevant principle(s) and record any granted waivers with an expiration date.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE): Provide original adoption date | **Last Amended**: 2025-10-27
