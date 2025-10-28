<!--
Sync Impact Report
Version: 1.1.0 → 1.2.0
Modified Principles:
- Principle I — Code Quality Stewardship (decision evidence made explicit)
- Principle II — Test-First Evidence (planning and waiver governance clarified)
- Principle III — Consistent User Journeys (evidence and validation tightened)
- Principle IV — Performance Guarantees (measurement governance clarified)
Added Sections:
- None
Removed Sections:
- None
Templates:
- .specify/templates/plan-template.md ✅ aligned (Principle Evidence heading added)
- .specify/templates/spec-template.md ✅ aligned (owner prompts added)
- .specify/templates/tasks-template.md ✅ aligned (no change required)
- README.md ✅ version reference updated
- .specify/templates/commands/ ⚠ pending (directory absent; add guidance when commands exist)
Follow-up TODOs:
- TODO(RATIFICATION_DATE): Provide original adoption date
-->

# Blockbuilders Engineering Constitution

## Core Principles

### Principle I — Code Quality Stewardship

Disciplined engineering keeps the monorepo modular and reviewable as teams scale.

- Engineering artifacts (research, plan, ADR, PR) MUST document the modules affected, the code ownership approvals obtained, and the lint/static analysis status before implementation starts.
- CI MUST block merges unless linting, formatting, static analysis, and type checks pass for every affected workspace.
- New or modified modules MUST provide typed public contracts and module-level documentation before they can be consumed by another package.
- Architectural boundaries between `apps/*` and `packages/*` MUST remain acyclic; introduce a new dependency only with an ADR recorded in `docs/architecture/decisions/`.
- Code owners MUST reject pull requests that exceed cyclomatic complexity 10 or 30 executable lines per function unless the accompanying plan documents a remediation owner and deadline.

**Rationale:** Explicit decision evidence and stable, well-documented modules prevent cascading regressions and keep the monorepo maintainable as more strategy tooling ships.

### Principle II — Test-First Evidence

We prove value through automated evidence before shipping features.

- Plans and specs MUST enumerate the unit, integration, contract, and performance tests that will fail before implementation and pass afterward for every acceptance criterion.
- Every feature branch MUST add or update automated tests that fail before implementation and pass afterward; merging without test evidence is prohibited.
- Services MUST maintain ≥85% statement coverage on all files touched by the change; lower coverage requires an explicit waiver logged in `specs/.../plan.md` with expiry and owner.
- Critical trading and simulation paths MUST include integration tests (API + worker + data stores) that run in CI pre-merge and nightly.
- The test suite MUST be deterministic; flaky tests block merges until quarantined with an issue link and remediation plan.

**Rationale:** Evidence-driven development catches regressions early, protecting customer trust in simulations and live-trading outcomes.

### Principle III — Consistent User Journeys

Users experience Blockbuilders through consistent, accessible journeys.

- Front-end work MUST compose components and tokens from `packages/design-system`; introducing bespoke UI requires documented approval in the spec signed by UX.
- All UI additions MUST pass automated accessibility checks (eslint-plugin-jsx-a11y + Lighthouse) meeting WCAG 2.1 AA for semantic structure, contrast, and keyboard flows.
- Feature specs MUST pin the UX reference (e.g., `docs/front-end-spec.md` version) and any deviation MUST include updated mockups reviewed by UX before development starts.
- Responsive breakpoints (mobile ≤640px, tablet ≤1024px, desktop >1024px) MUST be validated before release; failing breakpoints require a follow-up task before launch.
- Pull requests touching UI MUST attach before/after screenshots or recordings demonstrating compliance with the pinned UX reference and accessibility results.

**Rationale:** Consistent interactions and accessible visuals make the no-code lab feel trustworthy for new builders and power users alike.

### Principle IV — Performance Guarantees

Every performance budget guards the lab's responsiveness.

- Feature plans MUST declare the performance budgets they will protect and list the measurement tooling (Datadog dashboards, Chrome traces, pytest perf markers) before implementation begins.
- The Next.js app MUST sustain Largest Contentful Paint ≤2.5s at p75 on mid-tier hardware (Chrome: Moto G Power profile) before a feature can graduate from QA.
- FastAPI endpoints serving trade or simulation data MUST meet ≤200ms p95 latency under 500 req/min synthetic load in the staging stack.
- Celery/worker jobs that power backtests MUST finish a 30-day hourly dataset within 5 minutes; longer runtimes require sliced execution plans documented in the spec.
- Performance regressions detected post-merge MUST trigger an immediate rollback or hotfix plan reviewed within one business day.

**Rationale:** Performance determines whether strategy iteration feels immediate or unusable; guarding budgets keeps the lab viable for realtime decision-making.

## Implementation Guardrails

- **Decision Traceability:** All plans, ADRs, and PR templates MUST include a "Principle Evidence" section summarizing how the change satisfies or waives Principles I–IV and linking to supporting artifacts.
- **Instrumentation:** All services MUST emit structured logs with correlation IDs, latency, and error codes; metrics and traces MUST flow to Datadog before feature launch.
- **Secrets:** Environment configuration MUST come from `.env` templates checked into the repo; hard-coded secrets or ad-hoc env vars are forbidden.
- **Dependencies:** Third-party libraries MUST undergo security vetting (license + CVE scan) recorded in the plan doc before inclusion.
- **Documentation:** Every approved ADR MUST note the principle(s) it satisfies, link back to the relevant spec/plan section, and capture any waivers with expiration and owner.

## Workflow & Compliance

- Feature plans MUST map requirements to the supporting principle evidence before Phase 0 research concludes; missing detail blocks sign-off.
- Specs MUST enumerate test evidence (Principle II), UX references (Principle III), performance budgets (Principle IV), and name the accountable owner for each validation before status can move past Draft.
- Pull requests MUST reference the governing principle for each non-trivial change and link to the evidence captured in the plan, spec, or ADR.
- Waivers granted during review MUST be logged with owner, expiry, and mitigation path in the relevant plan or ADR before merge.
- Quarterly, the engineering leads and PM review adherence metrics (lint pass rate, coverage deltas, performance budgets) and publish an audit note in `/docs/ops/`.

## Governance

- This constitution supersedes contradictory guidance in other docs; conflicts MUST resolve in favor of the latest amended constitution.
- Amendments require (1) linked discussion issue, (2) approval from Engineering Lead, Product Lead, and UX, and (3) updated Sync Impact Report plus version bump per SemVer.
- Ratification changes (MAJOR versions) require migration guidance for existing specs/plans; MINOR captures new or materially expanded principles; PATCH covers textual clarifications only.
- Compliance audits run quarterly; discoverable violations MUST have corrective tasks tracked in Linear within five business days and associated waivers revoked.
- Technical decisions (ADR, plan, spec, PR) MUST cite the relevant principle(s), record any granted waivers with an expiration date, and escalate unresolved conflicts to the Engineering Lead before implementation proceeds.

**Version**: 1.2.0 | **Ratified**: TODO(RATIFICATION_DATE): Provide original adoption date | **Last Amended**: 2025-10-28
