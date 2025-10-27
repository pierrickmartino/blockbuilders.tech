# Blockbuilders — No-Code Crypto Strategy Lab

Blockbuilders lets retail crypto traders design, backtest, and paper-trade algorithmic strategies without writing code. The product centers on a drag-and-drop canvas, trustworthy simulations, and guided learning so builders can reach their first win fast and scale into cohort-ready workflows.

## Quick Start for Contributors

> ⚠️ The codebase is being scaffolded (see planned structure below). These steps capture the agreed setup so you can hit the ground running as soon as the monorepo lands.

### 1. Install Prerequisites

```bash
brew install node@20 pnpm python@3.11 poetry redis awscli pre-commit
brew install --cask docker
```

### 2. Bootstrap the Monorepo

```bash
pnpm install
poetry install --sync --no-root --directory apps/api
poetry install --sync --no-root --directory apps/workers
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
pre-commit install
```

### 3. Run the Stack

```bash
docker compose up redis timescale -d
pnpm turbo run dev --parallel     # launches web, FastAPI, and Celery worker together
```

Useful one-offs:

- `pnpm --filter web dev` — frontend only
- `pnpm --filter @blockbuilders/api dev` — FastAPI with reload via poetry/uvicorn
- `pnpm --filter @blockbuilders/workers dev` — Celery worker using poetry
- `pnpm turbo run test` / `poetry run pytest` — JS/TS and Python tests
- `python scripts/mock_datadog_agent.py --port 8282` — local Datadog shim that echoes audit log payloads for instrumentation checks

Environment variables are documented in `docs/architecture.md#environment-configuration`. Copy `.env.example` as above and fill in Supabase, Stripe, and AWS secrets from 1Password.

## Planned Repository Shape

The monorepo will follow the architecture blueprint:

```text
blockbuilders/
├── apps/
│   ├── web/                     # Next.js App Router UI
│   ├── api/                     # FastAPI service
│   └── workers/                 # Celery workloads
├── packages/                    # Shared types, design system, API client
├── infrastructure/              # Terraform & deployment manifests
├── scripts/                     # Local tooling and automation
├── turbo.json / pnpm-workspace.yaml
├── .env.example / docs/
└── ...
```

Check `docs/architecture.md#unified-project-structure` for the authoritative layout, build commands, and CI/CD flow.

## Key Product Docs

- [Product Requirements Document](docs/prd.md) — source of truth for scope, success metrics, and phased roadmap (v1.7).
- [Fullstack Architecture](docs/architecture.md) — monorepo structure, service contracts, deployment plan, and operational runbooks (v0.4).
- [UI/UX Specification](docs/front-end-spec.md) — personas, flows, component inventory, and visual guardrails (v0.3).
- [Project Brief](docs/brief.md) — market context, research timeline, and risk tracker for PM/leadership syncs.
- [Engineering Constitution](.specify/memory/constitution.md) - non-negotiable principles for code quality, testing, UX consistency, and performance governance (v1.0.0).

## Collaboration Rituals

- **PR workflow:** feature branches → PR with linked story → CI green → PM/QA sign-off → squash merge to `main`.
- **Status updates:** async standup in Linear each morning; beta KPI scorecard reviewed every Friday.
- **Research intake:** log interviews and competitive findings in the shared Notion hub within 24 hours.

Questions or onboarding blockers? Drop them in the `#blockbuilders` Slack channel or tag @John (PM) for triage.
