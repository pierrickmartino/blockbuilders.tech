# Epic 4 Community Sharing & Monetization

**Epic Goal:** Strengthen growth loops and revenue by enabling sharing, collaboration, and premium entitlements while keeping compliance and governance tight.

_Post-MVP Note:_ Marketplace monetization mechanics and paid template flows remain Phase 3 items and should not start until MVP validation KPIs hold steady.

## Story 4.1 Template Sharing & Governance
As a strategy author,
I want to publish and manage strategy templates,
so that others can clone, learn, and credit my work safely.

### Acceptance Criteria
1. 1: Template publishing flow captures metadata (description, tags, disclaimers) and review checklist.
2. 2: Consumers can clone templates with attribution preserved and optional educator annotations.
3. 3: Governance controls enforce moderation workflows and takedown requests.
4. 4: Activity logs track clones, edits, and compliance approvals.

## Story 4.2 Freemium Limits & Premium Entitlements
As a product owner,
I want to enforce plan limits and unlock premium features,
so that we monetize while keeping the free tier compelling.

### Quota Workshop Snapshot
- **Freemium guardrails:** 3 active strategies (10 drafts), 20 backtests/24h (1 concurrent), 1 active paper schedule (200 orders/month), 30-day analytics retention, in-app alerts only.
- **Premium allowances:** 20 active strategies (200 drafts), 250 backtests/24h (5 concurrent), 10 active paper schedules (5,000 orders/month), 365-day analytics retention, email + Slack alerts.
- **Upgrade prompts:** Informational banner at 70% usage, upgrade modal/email at 85%, hard stop paywall with plan comparison at quota breach; auto-pause paper trades on limit with Premium unlocking Slack notifications.

### Acceptance Criteria
1. 1: Plan definitions specify quotas (strategies, backtests/day, paper runs) with usage tracking per account.
2. 2: Over-limit attempts prompt upgrade CTAs and gated functionality messaging.
3. 3: Premium activation via Stripe updates entitlements in near real-time and unlocks advanced analytics.
4. 4: Billing events and receipts are auditable and exportable for finance review.

_Implementation notes:_ Monetization manifest from the Sprint 0 quota workshop is stored at `docs/monetization/manifest.md`; Story 4.2 and the release checklist must link to it and implement the quotas, prompts, and instrumentation it defines before moving to development.

## Story 4.3 Compliance & Trust Framework
As a compliance advisor,
I want safeguards and messaging controls,
so that the platform remains clearly simulation-only and regulator-friendly.

### Acceptance Criteria
1. 1: Compliance toolkit manages disclosure snippets and ensures they appear on onboarding, strategy views, and exports.
2. 2: Risk review workflow flags high-risk templates or anomalies for manual approval.
3. 3: Content moderation integrates with educator publishing to prevent financial advice claims.
4. 4: Trust & safety dashboard reports incidents, resolutions, and policy updates.
