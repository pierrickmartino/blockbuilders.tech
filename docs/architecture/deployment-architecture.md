# Deployment Architecture

## Deployment Strategy
**Frontend Deployment:**
- **Platform:** Vercel
- **Build Command:** `pnpm --filter web build`
- **Output Directory:** `.vercel/output` (App Router)
- **CDN/Edge:** Vercel Edge Network with ISR + stale-while-revalidate

**Backend Deployment:**
- **Platform:** AWS Fargate (ECS) with Application Load Balancer
- **Build Command:** `docker build -t blockbuilders-api apps/api`
- **Deployment Method:** GitHub Actions builds to ECR, CodeDeploy blue/green rollout

## CI/CD Pipeline
```yaml
name: ci-cd
on:
  push:
    branches: [main, staging]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm turbo run lint test
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: uv install poetry
      - run: poetry install --directory apps/api
      - run: poetry install --directory apps/workers
      - run: poetry run pytest apps/api
  deploy-frontend:
    needs: build-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
  deploy-backend:
    needs: build-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: us-east-1
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE }}
      - run: ./scripts/build-backend.sh
      - run: ./scripts/deploy-backend.sh
```

## Environments
| Environment | Frontend URL | Backend URL | Purpose |
| --- | --- | --- | --- |
| Development | http://localhost:3000 | http://localhost:8000 | Local development |
| Staging | https://staging.blockbuilders.app | https://staging-api.blockbuilders.app | Pre-production verification |
| Production | https://blockbuilders.app | https://api.blockbuilders.app | Live environment |

## Operational Playbooks & Responsibilities
### Initial Data Seeding & Reference Fixtures
- **Owner:** Data Engineering Lead (executes) with Product Owner sign-off on reference content; DevOps runs automation hooks during deployments.
- **Source of Truth:** Declarative YAML manifests under `infrastructure/seed-data/` (e.g. `plans.yaml`, `templates.yaml`, `demo-users.yaml`) tracked in Git; generated SQL kept out of version control.
- **Execution Tooling:** Idempotent Python module `apps/api/app/seed/bootstrap.py` orchestrated through `poetry run python -m app.seed.bootstrap --env={env}`; command resolves manifests, applies migrations, and upserts via SQLAlchemy bulk operations with conflict targets to avoid duplicates.
- **Data Sets Covered:**
  - Subscription plans (`free`, `premium`, `educator`) including quota ceilings, Stripe price IDs, and feature flag defaults.
  - Quota policy baselines used by the plan guardrails service (backtests/day, live paper trades, template forks).
  - Starter strategy templates referenced by onboarding flows (momentum, mean reversion, DCA) with localized descriptions and compliance metadata.
  - Demo educator cohort and support accounts with salted passwords pulled from 1Password exports and enforced rotation reminders.
- **Lifecycle:**
  1. Update YAML manifests and run `pnpm seed:lint` (wraps `scripts/validate-seed.ts`) to ensure schema compliance.
  2. Execute `pnpm seed:local` for local Timescale via docker compose; command pipes through bootstrap module and prints summary counts.
  3. GitHub Action `seed-staging.yml` triggers on staging deploys, running bootstrap against Supabase using ephemeral service-role keys stored in AWS Secrets Manager; production deploy requires manual approval with runbook confirmation in Slack `#launch-pad`.
  4. Post-run verification `scripts/check-seed.py --env {env}` compares row hashes against manifest digests and emits Datadog gauge `seed.last_success_timestamp`.
- **Rollback Strategy:** Bootstrap records execution metadata in `seed_runs` table (run id, manifest versions, checksum). `scripts/seed-rollback.py --run <id>` replays prior manifests within a transaction; production rollback requires compliance approval when demo users are involved.
- **Operational Steps (inline reference):**
  1. **Pre-flight:** Confirm latest manifests committed, gather Supabase project + Stripe restricted key from shared secrets vault, and announce window in `#launch-pad`.
  2. **Dry run:** `pnpm seed:lint && pnpm seed:local` to validate schemas and confirm bootstrap summary matches manifest digest counts; remediate lint or checksum drift before proceeding.
  3. **Target run:** `poetry run python -m app.seed.bootstrap --env={staging|production}` executed from CI or approved operator shell; provide manifest git SHA and operator initials in prompt when requested.
  4. **Post-run verification:** Execute `scripts/check-seed.py --env {env}` then review Datadog gauge `seed.last_success_timestamp`; log run id, manifest SHA, and verification outcome in ops notebook (Notion: "Seed Runs").
  5. **Rollback path:** If discrepancies detected, invoke `scripts/seed-rollback.py --run <id>` and re-run verification; escalate to Data Engineering lead if automated rollback surfaces merge conflicts.
- **Troubleshooting:**
  - Supabase RLS failures → ensure service-role key used, inspect `seed_runs` audit for offending table, and temporarily relax conflicting policy via SQL (`alter policy ... using (true)`), restoring original predicate once run succeeds.
  - Stripe price drift → reconcile plan price IDs against Stripe dashboard, update `plans.yaml`, rerun bootstrap, and confirm webhook replay passes without mismatches.

### DNS & SSL Provisioning Runbook
- **Owner:** DevOps Lead (execution) with backup from Staff Engineer.
- **Scope:** Route53, CloudFront, and Vercel certificate lifecycle for `*.blockbuilders.app` domains.
- **Pre-checks:**
  1. Validate desired records in `infrastructure/terraform/dns/records.tf` and confirm ACM certificate request pending/approved.
  2. Verify Cloudflare (if used for marketing site) has updated origin IPs and proxy modes to avoid certificate mismatch.
  3. Ensure change window communicated in `#launch-pad` with rollback contact list.
- **Execution Steps:**
  1. Apply Terraform changes: `terraform workspace select {staging|production}` then `terraform apply -auto-approve`.
  2. For Vercel-managed frontends, run `vercel certs issue blockbuilders.app www.blockbuilders.app` when prompted, copying validation CNAMEs back into Terraform.
  3. Propagate DNS by verifying Route53 change status (`aws route53 get-change <change-id>`), checking `dig +short` results for key records, and confirming CloudFront distribution status is `Deployed`.
- **Validation:** Confirm HTTPS availability via Datadog synthetic monitor or `curl -I https://{domain}`; review AWS Certificate Manager for issued status and expiry > 60 days.
- **Rollback:** Reapply previous Terraform state (`terraform apply "planfiles/{env}-last.plan"`) and restore prior certificate ARN values; notify incident channel if rollback executed.
- **Record Keeping:** Document change, validation evidence, and operator in Notion "DNS & SSL Runbook" page; attach Terraform plan, `aws route53 get-change`, and `curl -I https://{domain}` outputs.

### Third-Party Account Provisioning & Credential Management
- **Supabase (Owner: DevOps Lead)** – Provision projects per environment via Terraform modules under `infrastructure/terraform/supabase`, capture service keys in AWS Secrets Manager, and document read/write role mappings; rotate all non-user keys quarterly with tickets logged in the ops tracker.
- **AWS Core (Owner: DevOps Lead)** – Stand up IAM roles, networking, S3 buckets, and Batch/Fargate stacks through infrastructure code; enforce MFA on human break-glass accounts and schedule 90-day IAM access reviews.
- **Stripe (Owner: PM + Finance Partner)** – Request production keys after compliance checklist sign-off, store secrets in Vault/Supabase configuration tables, and automate webhook replay tests monthly; rotate restricted keys every 180 days.
- **Market Data Vendors (Owner: Data Engineering)** – CoinDesk confirmed as primary feed (contract pending signature 2025-10-15) with Coin Metrics as warm standby; capture SLA clauses, rate limits, and symbol coverage in the "Market Data Vendor Readiness" appendix below and refresh fallback procedure checklist (feature flag toggle + redeploy steps) each quarter; attach procurement status and billing contacts in ops tracker.
- **Sandbox Credential Catalog:** Store Supabase, Stripe, CoinDesk, and Coin Metrics sandbox keys plus replay/mock instructions in 1Password vault `Blockbuilders Ops`; mirror an operator walkthrough in the "Secrets & Sandbox Access" appendix outlining how to request access, rotate credentials, and execute replay smoke tests.
- Centralize detailed playbooks under `ops/playbooks/` with last-reviewed timestamps, escalation contacts, and Terraform state references so new contributors can execute without tribal knowledge.

### Responsibility Matrix (Human vs. Automation)
| Task | Human Owner | Automation Support | Notes |
| --- | --- | --- | --- |
| Compliance disclosure reviews | Compliance Advisor (quarterly) | Content linting bots flag missing disclaimers in CI | Manual approval required before production deploys; bot posts checklist status to GitHub checks. |
| Credential rotation & audit | DevOps Lead (Supabase/AWS); PM (Stripe) | Secrets scanner watches repo/CI for leaks | Rotation calendar tracked in ops tracker with Slack reminders. |
| Backup validation & DR drills | DevOps Lead | Scheduled restore jobs verify snapshots automatically | Drill reports captured in reliability register with remediation tasks logged to Jira. |
| Customer support & incident comms | Support Lead + PM | Intercom auto-triage tags severity | Humans arbitrate escalation path; alerts mirrored to Slack incident channel. |
| Knowledge base & onboarding assets | PM + UX Writer | Docs pipeline lints Markdown, checks links | Weekly audit ensures onboarding, trust, and compliance artifacts stay current. |

### Backup & Restore Execution Plan
- **Tooling:** Use Supabase managed Timescale snapshots and AWS Backup for S3 buckets; replicate encrypted copies to a separate AWS account for disaster recovery.
- **Cadence:** Run nightly incremental snapshots and weekly full database backups; archive application artifacts after every production deploy.
- **Validation:** Execute monthly restore drills into isolated staging namespaces, verifying schema migrations and application boot; log outcomes in `ops/playbooks/backup-restore.md`.
- **Monitoring:** Datadog monitors alert on missed backups, replication lag, or failed restores; compliance advisor receives quarterly summary exports.

### Knowledge Transfer & Support Handoffs
- Produce Sprint 0 knowledge-transfer packet covering release workflow, rollback triggers, support escalation map, and on-call expectations; refresh after each beta iteration.
- Maintain beta operations log (incidents, root cause, follow-ups) using the template below and distribute summaries during fortnightly stakeholder syncs.
- Ensure support and compliance teams receive updated disclosures, onboarding copy, and FAQ assets at least 24 hours before deploy; host documentation in shared Notion with repository pointers and attach release notes generated from the template below.
- Deliver user-facing education suite (onboarding checklist copy, trust/compliance FAQ, tutorial videos) mapped to activation KPIs, with clear ownership and review cadence.

### Code Review & Knowledge Sharing Checklist
- [ ] Reference story acceptance criteria and affected modules before opening PR; list scenarios validated locally (unit/integration/E2E).
- [ ] Pair reviewer assigned in Linear ticket; add subject-matter reviewer for domain-heavy PRs (compliance, billing, seeding).
- [ ] Ensure architectural decision records (ADRs) updated when PR changes system boundaries or workflows.
- [ ] Post-review summary in `#dev-updates` including feature flag status, rollout plan, and follow-up tasks.
- [ ] Capture learnings or debugging insights in team handbook within 24 hours; link handbook entry back to originating PR.

### Release Notes & Incident Log Templates
```markdown
# Release Note
- Date:
- Release Owner:
- Feature Highlights:
  -
- Migrations/Operational Tasks:
  -
- Rollback Plan:
- Customer Comm Link:

---

# Beta Incident Log
- Incident ID:
- Detected (date/time):
- Reporter:
- Severity:
- User Impact Summary:
- Timeline:
  -
- Root Cause:
- Mitigations Applied:
- Follow-up Actions:
- Verification Evidence:
```

### Market Data Vendor Readiness
| Item | CoinDesk (Primary) | Coin Metrics (Secondary) |
| --- | --- | --- |
| Contract status | Pending signature (expected 2025-10-15) | Active evaluation sandbox |
| Coverage | Spot + derivatives for top 150 assets | Spot focus, derivatives limited |
| SLAs | 99.9% uptime, 300ms P95 latency | 99.5% uptime, 500ms P95 |
| Rate limits | 600 requests/min per API key | 400 requests/min |
| Fallback procedure | Update runtime feature flag `marketData.provider=coinMetrics`, redeploy workers, flush Redis caches, and validate dashboard parity | Maintain warm cache, sync once per hour |
| Monitoring | Datadog synthetic `marketdata-primary` + webhook heartbeat | Datadog synthetic `marketdata-fallback` |

### Secrets & Sandbox Access
- All sandbox credentials stored in 1Password vault `Blockbuilders Ops`; access requires DevOps approval and Okta MFA.
- Redacted walkthrough (request, retrieval, rotation) maintained in Notion "Secrets Operations" page; update page when keys rotate or tooling changes.
- Replay tests: run `stripe trigger payment_intent.succeeded` and `poetry run python -m app.seed.bootstrap --env=sandbox` monthly to validate integrations; record outcomes in beta operations log template above.
- Rotation cadence: Supabase service keys quarterly, Stripe restricted keys every 180 days, market data keys monthly; log rotations in ops tracker with link to verification artifacts.
