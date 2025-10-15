# Source Tree

This file documents the authoritative layout of the BlockBuilders monorepo so new contributors can locate code, shared assets, and tooling without guesswork.

```text
blockbuilders.tech/
├── apps/                    # Deployable application workspaces
│   ├── web/                 # Next.js UI
│   ├── api/                 # FastAPI gateway + Alembic migrations
│   └── workers/             # Celery worker entrypoints
├── packages/                # Reusable libraries (TS + Python)
├── docs/                    # Product, architecture, QA documentation
├── ops/                     # Operational runbooks and automation
├── node_modules/            # Root pnpm install (managed)
├── package.json             # Turborepo root package definition
├── pnpm-workspace.yaml      # Workspace membership rules
├── turbo.json               # Turborepo pipeline configuration
├── docker-compose.yaml      # Local service orchestration
└── README.md                # Quickstart + contributor notes
```

## Monorepo Overview
- Turborepo + pnpm manage JavaScript/TypeScript workspaces, while Poetry drives the Python environments.
- Deployable surfaces live under `apps/` and share code through `packages/shared`.
- Documentation and architectural guidance lives in `docs/`, which is the source of truth for standards.
- Operations playbooks are versioned in `ops/` to keep runbooks co-located with the code they reference.

## Top-Level Directories
- `apps/` — contains the three primary services: the Next.js web client, the FastAPI gateway, and Celery workers.
- `packages/` — houses shared libraries. Currently includes cross-language helpers under `shared/`.
- `docs/` — product specs, architecture, testing strategy, and other reference material. Architecture docs (including this file) are under `docs/architecture/`.
- `ops/` — operational checklists and automation scripts (`ops/playbooks/`).
- Root configs: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig*.json`, `docker-compose.yaml`, and `pnpm-lock.yaml`.
- Machine-managed directories: `node_modules/` at the root and within workspaces, plus Python virtual environment artifacts created by Poetry.

## Application Workspaces (`apps/`)

### `apps/web` — Next.js App Router UI
- `app/` — Route handlers and server components following the App Router convention.
- `components/` — Reusable React components.
- `lib/` — Client/server utilities (Supabase setup, formatting helpers, API clients).
- `stores/` — Zustand store definitions and related logic.
- `middleware.ts` — Next.js middleware for auth and request preprocessing.
- Tooling: `next.config.mjs`, `tsconfig.json`, `vitest.config.ts`, and `vitest.setup.ts`.
- Tests live alongside the code and execute through `pnpm test --filter web` (vitest).

### `apps/api` — FastAPI Gateway
- `blockbuilders_api/` — FastAPI application package split into `routers`, `core`, `dependencies`, `models`, `schemas`, and `services`.
- `migrations/` — Database migration scripts managed externally (Alembic-compatible).
- `tests/` — Pytest suite covering routers and services.
- Dependencies defined in `pyproject.toml` (Poetry); shared contracts consumed via `packages/shared/python`.
- Local runs use `uvicorn` or the docker compose stack.

### `apps/workers` — Background Processing
- `blockbuilders_workers/` — Celery application entrypoints (`celery_app.py`).
- Shared logic is minimal today; workers import domain code from `blockbuilders_api` or `packages/shared/python` as needed.
- Poetry-managed dependencies (`pyproject.toml` + `poetry.lock`); keep worker-only dependencies isolated here.

## Shared Libraries (`packages/`)
- `packages/shared/` — Language-agnostic contracts and helpers.
  - `src/` — TypeScript exports (`auth.ts`, `workspace.ts`, `index.ts`) consumed by Next.js and other TS packages.
  - `python/blockbuilders_shared/` — Python package mirroring cross-service schemas and utilities.
  - Separate `package.json` and `pyproject.toml` ensure JavaScript and Python consumers can version independently.
- When adding new shared modules, keep TypeScript and Python analogs aligned and update downstream import paths (`@blockbuilders/shared`).

## Documentation (`docs/`)
- `docs/architecture/` — System blueprints, coding standards, deployment and monitoring guides (this file included).
- `docs/prd/` — Sharded product requirements (`docs/prd.md` is the canonical combined view).
- `docs/qa/` — QA gates, test strategies, and validation artifacts.
- Keep architecture docs synchronized with code changes; new services should add their own subsections here.

## Operations and Tooling
- `ops/playbooks/` — Step-by-step operational guides (incident handling, deployments, maintenance).
- `docker-compose.yaml` — Standardized local stack (API, DB, queues). Extend this file when services require new dependencies.
- `README.md` — Contributor quickstart. Update when the setup process or core tooling changes.
- `tsconfig.base.json` and `tsconfig.json` — TypeScript compiler settings shared across workspaces.
- `turbo.json` — Defines task graph; ensure new build/test commands are registered for cacheability.

## Managed & Generated Assets
- `node_modules/`, `.next/`, `dist/`, coverage outputs, and Python `__pycache__` directories are generated; do not commit changes manually.
- Alembic migration revisions under `apps/api/migrations/` are source-controlled; new migrations should follow the naming convention established there.

## Contributor Notes
- Prefer adding new deployable surfaces under `apps/` and shared logic under `packages/`.
- Keep tests close to the code they validate (`tests/` for Python, colocated `.test.ts(x)` for TypeScript).
- Use Turborepo tasks (`pnpm turbo run <task>`) to respect the existing pipeline graph.
