# Technical Assumptions

## Repository Structure: Monorepo
Maintain a single monorepo that houses the Next.js frontend, FastAPI services, shared schema packages, Terraform/IaC, and automated workflows. This supports consistent versioning, shared type contracts, and streamlined CI/CD.

## Service Architecture
Adopt a modular microservices approach within the monorepo: a gateway/API layer for auth and CRUD, a strategy orchestration service, a simulation worker service for backtests/paper trading, and supporting services (billing, notifications, data ingestion). Services communicate via REST and asynchronous queues to isolate workloads and allow independent scaling.

## Testing Requirements
Establish a full testing pyramid: unit tests for React components, Python business logic, and data transformers; integration tests for API workflows and async jobs; end-to-end tests for critical user journeys (e.g., creating, backtesting, and scheduling a strategy). Include synthetic data fixtures and contract tests for external market data APIs.

## Additional Technical Assumptions and Requests
- Frontend built with Next.js (App Router), TypeScript, TailwindCSS, Radix UI, Tremor UI, React Flow, React Query, and Zustand for state management.
- Backend services use FastAPI with async execution, Celery/Redis (or equivalent) for job orchestration, and TimescaleDB for time-series results.
- Supabase Postgres manages authentication and transactional configuration data; S3-compatible storage retains backtest artifacts and reports.
- Stripe powers billing with usage metering hooks for freemium limits; LaunchDarkly (or open-source equivalent) controls feature flags.
- Sentry and Datadog provide observability, tracing, and anomaly alerting; automated data validation jobs guard against stale or missing market candles.
- Infrastructure targets Vercel for frontend deployments, AWS ECS/EKS (or DigitalOcean Kubernetes) for backend/worker clusters, with IaC modules enforcing cost guardrails and environment parity.

## Implementation & Operational Guidance
### Engineer Bootstrap Checklist
- **Prerequisites:** Install Node.js 18+ with npm, Python 3.11+, and Git. Optional but recommended: `direnv` for env management and `make` for helper scripts referenced in `docs/architecture.md`.
- **Clone & Workspace Setup:**
  - `git clone git@github.com:blockbuilders/strategybuilder.git && cd strategybuilder`
  - Until automation ships, reference this checklist as the canonical bootstrap flow; update the root `README.md` when the helper script is introduced.
- **Frontend Install:**
  - `cd frontend && npm install`
  - Copy `.env.local.example` (when present) to `.env.local`; if absent, create it using the baseline values in `docs/architecture.md` (see Environment Configuration).
  - Verify the dev server with `npm run dev`; confirm http://localhost:3000 renders the onboarding shell.
- **Backend Install:**
  - `cd backend && python -m venv .venv && source .venv/bin/activate`
  - `pip install -e .` (adds FastAPI + Uvicorn)
  - Create a `.env` file using the template below; store secrets in 1Password and inject via `direnv` during local runs.
  - Start the API with `uvicorn app.main:app --reload` and hit `http://127.0.0.1:8000/health` to confirm readiness.
- **Environment Variable Baseline:**

  | Scope | Variable | Notes |
  | --- | --- | --- |
  | Frontend | `NEXT_PUBLIC_API_BASE_URL` | Default: `http://localhost:8000/api/v1` |
  | Frontend | `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Use staging project until dedicated dev project is provisioned |
  | Backend | `DATABASE_URL` | Point to local Postgres or Supabase connection string |
  | Backend | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` | Request via DevOps; never commit |
  | Backend | `STRIPE_SECRET_KEY` | Use test mode key; rotate every 180 days |
  | Shared | `APP_ENV`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `LOG_LEVEL` | Defaults listed in `docs/architecture.md` |
- **Smoke Tests:** Run `./scripts/test.sh` from repo root to validate the backend health check; add frontend lint/test wiring before beta.
- **Documentation Hooks:** Update the root `README.md` when commands change, maintain quick links to the PRD, architecture doc, UX spec, and the PO checklist report, and append new pitfalls or automation scripts to this checklist so onboarding stays current.

#### Common Pitfalls & Mitigations
- Node <18 will break Next.js 15 features (ESM, App Router). Validate with `node -v` before running installs.
- Forgetting to activate the Python virtual environment causes `uvicorn` import errors; the prompt should show `(.venv)`.
- Port collisions (3000/8000) occur if prior runs remain alive; stop existing processes or export alternate ports in `.env.local`/`.env`.
- Missing `.env` keys lead to silent Supabase/Stripe failures; stub safe defaults for local dev and document overrides in the shared secrets vault.
- Windows developers should run `npm run dev -- --hostname 0.0.0.0` to avoid network binding issues observed during early tests.
### Deployment Cadence & Environments
- Maintain discrete dev, staging, and production environments; target twice-weekly staging releases and a controlled weekly production rollout once beta begins.
- Require release pre-checks (lint, unit, integration, end-to-end smoke) to pass before promotion; document environment-specific configuration toggles in the monorepo README.

### Runbook & Rollback Expectations
- Author service runbooks (canvas, simulation workers, billing, data ingestion) covering startup commands, health checks, alert routing, and dependency diagrams prior to first production deploy.
- Define rollback procedures for frontend (Vercel instant rollback) and backend (ECS task redeploy with previous image) including trigger criteria and communication steps.

### Support & On-Call Coverage
- Establish a lightweight on-call rotation (engineering + PM) during beta with a 2-hour acknowledgement SLA for P1 incidents and 8-hour resolution target.
- Route customer issues via Intercom/Zendesk with tagging for data, billing, or UX, and ensure weekly review of incident trends with founders.

### Third-Party Account Provisioning & Credential Playbook
- **Supabase (Owner: DevOps Lead)** – Create project per environment via Terraform, capture service keys in secrets manager, and document read/write role mapping for app services; rotate keys quarterly with change tickets logged in the ops tracker.
- **AWS Core (Owner: DevOps Lead)** – Provision IAM roles, S3 buckets, and networking stacks through IaC with approval from security advisor; enable MFA for human break-glass accounts and enforce 90-day access review checkpoints.
- **Stripe (Owner: PM + Finance Partner)** – Request production keys through Stripe dashboard once compliance checklist is cleared, store secrets in Vault/Supabase config, and schedule automated webhook replay tests monthly; rotate restricted keys every 180 days.
- **Market Data Vendors (Owner: Data Engineering)** – Contract with CoinDesk Market Data Essentials (executed 2025-10-12, 99.9% uptime SLA) and keep Coin Metrics API warm as standby; capture billing approvals, IP allowlists, and monitoring hooks in the runbook below, validate key health weekly, and archive vendor contact history.

#### Market Data SLA & Fallback Runbook (2025-10-12)
- **Primary vendor:** CoinDesk Market Data Essentials (contract BB-2025-0915) with 99.9% API uptime, <2s response for tracked symbols, 60-minute incident notifications, and escalation alias `md-support@coindesk.com`.
- **Fallback vendor:** Coin Metrics API maintains quota for failover with 5-minute OHLC coverage; disable depth snapshots while fallback is active to stay within rate limits.
- **Monitoring trigger:** Data Engineering on-call watches Datadog `vendor.kpis.marketdata.latency` and the vendor status RSS feed; declare incident when latency exceeds 60s for five consecutive checks or when error rate >5% across two minutes.
- **Fallback activation:** (1) Set feature flag `marketData.source=coin_metrics` in `ops/feature-flags.yaml` and push with "SLA fallback" note. (2) Run `poetry run scripts/swap_market_vendor.py --target=coin_metrics` to repoint ingestion connectors; confirm green status in the `dataplane.status` dashboard. (3) Post incident update on `status.blockbuilders.app` referencing vendor ticket ID and ping `#blockbuilders-product`.
- **Secrets manifest:** Vault entries `Blockbuilders • Ops • Production • Market Data` and `Blockbuilders • Ops • Staging • Market Data` now store CoinDesk production keys, Coin Metrics fallback tokens, and sandbox credentials; quarterly rotation reminders assigned to Data Engineering owner Alyssa Kim.
- **Verification & restoration:** Execute `python scripts/check-market-vendors.py --env=staging` after any credential change, reverse the feature flag and rerun the swap script with `--target=coindesk` once incident clears, then run `poetry run tests/test_data_pipeline.py -k vendor_regression` and log lessons in beta operations log entry `BETA-OPS-2025-10-12`; next fallback drill scheduled 2025-12-15.
- **Sandbox Credential Capture:** Store Supabase, Stripe, and vendor sandbox keys plus replay scripts in the shared 1Password vault (`Blockbuilders • Ops • Sandboxes`) and record access verification steps in the operations tracker so new contributors can self-serve.
- Execute the following lightweight review before onboarding any new environment: (1) Confirm Terraform state ownership and break-glass contacts, (2) validate service keys by running the smoke commands defined in the vault entry, and (3) log the review date and reviewer in the beta operations log.
- This inline checklist supersedes the placeholder reference to external playbooks until the dedicated `ops/playbooks/` folder is created; establish that directory during Sprint 0 and back-link its runbooks here once available so procedures remain actionable within the PRD itself.

### Initial Data Seeding Procedure (Inline Runbook)
- **Objective:** Keep reference data (subscription plans, quotas, onboarding templates, demo cohort) aligned across environments without depending on missing playbook assets.
- **Pre-flight Checks:**
  1. Update manifests under `infrastructure/seed-data/*.yaml` and run `pnpm seed:lint` to verify schema compliance.
  2. Retrieve the target environment service-role key from AWS Secrets Manager (or the shared vault) and perform a quick connectivity check with `psql` or Supabase SQL editor to ensure credentials are valid before seeding.
- **Execution:**
  1. Local: `pnpm seed:local` (wraps `poetry run python -m app.seed.bootstrap --env=local`) populates Docker-backed Timescale; verify counts printed in the summary table.
  2. Staging: Trigger GitHub workflow `Seed Staging` or run `poetry run python -m app.seed.bootstrap --env=staging` with AWS Secrets Manager service-role key exported; capture CLI output in the release checklist.
  3. Production: Execute the staging command behind a change ticket after compliance approval, using the protected production key bundle; notify `#launch-pad` with manifest commit hash.
- **Verification:** Run `python scripts/check-seed.py --env <env>` to compare row hashes against manifest digests and inspect the Datadog metric `seed.last_success_timestamp`; failures require rollback before completing the release.
- **Rollback:** Use `python scripts/seed-rollback.py --run <id>` to replay prior manifests within a transaction. Production rollbacks require Product Owner approval if demo users or billing data will be altered.
- **Documentation & Ownership:** Product Owner records each execution in the beta operations log with run ID, manifest versions, and sign-off status; Data Engineering owns quarterly dry-run drills of the rollback path.
- **Post-decision updates:** When market data contracts or quota thresholds change, regenerate secrets manifests and seed data YAMLs, then log the refresh in the beta operations log for traceability.

### DNS & SSL Provisioning Plan
- **Ownership & Registrar:** Product Owner secures `blockbuilders.app` (plus defensive variants) via AWS Route 53; DevOps Lead administers hosted zones and record updates. Legal/brand approves any additional domains before purchase.
- **Record Topology:**
  - `blockbuilders.app` and `www.blockbuilders.app` → CNAME to Vercel-issued targets; enforce HSTS preload once stability burn-in completes.
  - `api.blockbuilders.app` → ALIAS/ANAME to the AWS Application Load Balancer fronting FastAPI (managed via Terraform under `infrastructure/terraform/networking`).
  - `staging.blockbuilders.app` and `staging-api.blockbuilders.app` mirror production mappings with staged certificates; TTL ≤ 300 seconds during launch to enable fast rollback.
  - `auth.blockbuilders.app` reserved for Supabase auth callbacks; document supporting records (DKIM, SPF, DMARC) before transactional email go-live.
- **Certificate Automation:**
  - Frontend: Vercel automatically issues and renews certificates after DNS verification; Product Owner verifies activation in the dashboard and logs renewal SLA in release checklist.
  - Backend: AWS Certificate Manager issues wildcard `*.blockbuilders.app` plus apex; Terraform module requests via DNS validation CNAMEs, attaches certificates to ALB listeners, and relies on ACM auto-renewal.
  - Stage gating: staging certificates provisioned one sprint ahead of beta to validate OAuth callbacks and Stripe webhooks without production exposure.
- **Inline Runbook & Verification:**
  1. Pre-change: confirm registrar ownership in Route 53, export current records via `aws route53 list-resource-record-sets`, and snapshot configuration in the release ticket.
  2. Apply updates using Terraform from `infrastructure/terraform/networking` (e.g., `terraform plan -target=module.dns && terraform apply`) and capture plan output; obtain dual approval (PO + DevOps) before applying changes.
  3. Validate propagation with `dig +trace blockbuilders.app`, `nslookup api.blockbuilders.app`, and `openssl s_client -connect api.blockbuilders.app:443 -servername api.blockbuilders.app` to inspect certificate chains.
  4. Instrument Datadog HTTPS checks for `https://blockbuilders.app/health` and `https://api.blockbuilders.app/health` with expiry alerts at 30/7/1-day thresholds.
  5. Post-change: document results (commands, TTL observations, health-check screenshots) in the release checklist and capture rollback instructions (reapply previous Terraform state or restore exported records) before closing the ticket.
- **Timeline & Dependencies:** Complete domain acquisition and staging certificate validation before Sprint 1 demo; production DNS/SSL cutover scheduled ≥2 weeks before public beta to unblock OAuth redirect registration and Stripe webhook configuration.

### Responsibility Matrix (Human vs. Agent)
| Task | Human Owner | Agent/Automation | Notes |
| --- | --- | --- | --- |
| Compliance disclosure reviews | Compliance Advisor (quarterly) | Content linting bots flag missing disclaimers | Humans sign off before releases; bot posts checklist status in CI |
| Credential rotation & audit | DevOps Lead (Supabase/AWS); PM (Stripe) | Secrets scanner monitors repo & CI for leaks | Rotation calendar recorded in ops tracker with reminder automations |
| Backup validation & DR drills | DevOps Lead | Scheduled restoration jobs verify snapshots | Drill outcomes logged with pass/fail and remediation items |
| Customer support & incident comms | Support Lead + PM | Intercom auto-triage tags severity | Human decides escalation path; notifications mirrored in Slack |
| Knowledge base updates | PM + UX Writer | Docs pipeline ensures linting & broken link checks | Weekly audit to confirm onboarding and trust content stay current |

### Backup & Restore Execution Plan
- **Tooling:** Use managed TimescaleDB snapshots and S3 lifecycle policies; retain encrypted copies in separate AWS account for disaster recovery.
- **Cadence:** Automate nightly incremental snapshots and weekly full backups for databases; archive application artifacts after each production deploy.
- **Validation:** Schedule monthly restore drills into an isolated staging environment, verifying data integrity and application boot; log outcomes and follow-ups in the reliability register.
- **Ownership & Alerts:** DevOps Lead owns cadence adherence, with Datadog monitors triggering alerts on missed backups or failed restores; compliance advisor receives quarterly summary reports.

### Documentation & Handoff Deliverables
- Produce release notes for every production deployment highlighting user-facing changes, known issues, and mitigation steps.
- Maintain a beta operations log capturing incidents, root cause, and follow-up actions; share summaries during fortnightly stakeholder syncs.
- Stand up an `ops/playbooks/` directory referenced in this PRD and the architecture docs so runbooks, release templates, and incident guides have a canonical repository home.
- Ensure support and compliance teams receive updates to disclosures, onboarding copy, and FAQ/education assets at least 24 hours before release.
- Deliver Sprint 0 knowledge-transfer packet covering release workflow, rollback triggers, support escalation map, and on-call expectations; update after each beta iteration.
- Define user-facing education suite (onboarding checklist copy, trust & compliance FAQ, tutorial videos) mapped to activation KPIs, with owners assigned for creation and maintenance.

### Code Review & Knowledge Sharing Checklist
- Confirm ticket links, acceptance criteria coverage, and test evidence (unit, integration, or manual) before assigning reviewers; block merges until checkboxes complete in the PR template.
- Require at least one specialist reviewer (backend, frontend, or data) plus a secondary reviewer rotating weekly; capture review outcomes and follow-up actions in the beta operations log.
- During weekly dev sync, highlight merged PRs with notable architectural decisions, schema changes, or operational impacts; record Loom/Wiki links in the knowledge-transfer packet.
- Archive review highlights and lessons learned in the shared Notion space (`Engineering • Review Digest`) to accelerate onboarding and reduce tribal knowledge.

### Operational Communication Templates
- **Release Notes Skeleton:**
  ```markdown
  ## Release <version> – <date>
  ### Highlights
  - <Feature/Impact>
  ### User-Facing Changes
  - <Copy updates, UX adjustments>
  ### Operational Notes
  - <Migrations, feature flags, follow-up actions>
  ### Known Issues & Mitigations
  - <Issue + owner + target resolution>
  ```
- **Beta Incident Log Entry:**
  ```markdown
  - Timestamp (UTC):
  - Severity:
  - Detection Source:
  - Impacted Users/Requests:
  - Immediate Mitigation:
  - Root Cause Summary:
  - Follow-up Tasks & Owners:
  - Customer Communication Sent:
  ```
- Reference these templates in the operations log and attach completed entries to each release ticket to maintain consistent communication quality.

## Technical Risks & Investigation Focus
- **Market Data Vendor Validation (Owner: PM + Data Engineering, Completed: 2025-10-12, Status: Closed):** Signed CoinDesk Market Data Essentials contract (99.9% uptime, <2s latency SLA), documented Coin Metrics fallback playbook, and updated secrets manifests (`Blockbuilders • Ops • Production/Staging • Market Data`) plus beta operations log entry `BETA-OPS-2025-10-12`; continue monthly SLA reviews with vendor CSM.
- **Simulation Realism & Execution Modeling (Owner: Backend/Quant Lead, Due: Sprint 2, Status: Planned):** Validate fill assumptions, slippage models, and sensitivity analysis to ensure users trust paper-trade outcomes; schedule the validation review during Sprint 1 readiness so investigation tasks stay visible.
- **Infrastructure Cost Guardrails (Owner: DevOps Lead, Due: 2025-10-25, Status: Action Required):** Model worker scaling scenarios against the $8K/month cap, stand up Datadog dashboards with alert thresholds, and document throttling strategies before public beta (`docs/brief.md:97-115`).
- **Freemium Quota Definition (Owner: PM + Growth, Completed: 2025-10-18, Status: Closed):** Sprint 0 workshop captured plan guardrails in `docs/monetization/manifest.md`, detailing freemium/premium quotas, upgrade prompts, and instrumentation; Engineering and Growth now integrate entitlements middleware and dashboards ahead of Epic 3.
- **Compliance Review Workflow (Owner: Compliance Advisor + PM, Due: 2025-10-22, Status: Pending Scheduling):** Draft approval RACI, integrate the disclosure checklist into the release template, and rehearse the workflow during the first beta content update to validate timing assumptions.

### Risk Mitigation Action Tracker
| Risk | Owner | Severity | Likelihood | Target Date | Status | Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| Market data vendor contract & fallback SLA | PM + Data Engineering | High | Medium | 2025-10-15 | Completed | Monitor SLA performance weekly, keep vendor ticket log current, and rehearse fallback drill on 2025-12-15 |
| Freemium quota guardrails & monetization manifest | PM + Growth | Medium | Medium | 2025-10-18 | Completed | Manifest published at `docs/monetization/manifest.md`; next integrate entitlements middleware and quota dashboards (Engineering Lead + Growth Ops) |
| Compliance dry-run & disclosure rehearsal | Compliance Advisor + PM | Medium | Medium | 2025-10-22 | Pending | Book dry-run session, capture findings in the release template, and refine approval workflow steps |
| Cost monitoring dashboards & alert thresholds | DevOps Lead | Medium | Low | 2025-10-25 | In Progress | Build Datadog cost dashboards, configure $8K/month alerts, and document the response playbook in `ops/playbooks/` |

Review this tracker during the weekly product/engineering/design triad to confirm owners and dates remain accurate.

## Sprint 0 Kickoff Preconditions (Conditional Go)
- **Market data contract & fallback SLA signed** — owners PM + Data Engineering, completed 2025-10-12; CoinDesk designated primary, Coin Metrics fallback documented, secrets manifests updated for production/staging, and beta operations log entry `BETA-OPS-2025-10-12` captured.
- **Freemium quota workshop completed** — owners PM + Growth, completed 2025-10-18; outcomes documented in `docs/monetization/manifest.md` and referenced by Story 4.2 plus the release checklist.
- **Compliance approval dry-run scheduled and documented** — owners Compliance Advisor + PM, target 2025-10-22; run through the disclosure checklist, capture findings, and integrate adjustments into the release template before beta content updates.
- **Cost monitoring dashboards & alert thresholds live** — owner DevOps Lead, target 2025-10-25; stand up Datadog dashboards tied to the $8K/month cap, define escalation routing, and store the response playbook in `ops/playbooks/`.

Address these items before closing Sprint 0 intake to honor the conditional go decision captured in the PO checklist report.
