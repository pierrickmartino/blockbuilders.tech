# Unified Project Structure
```text
blockbuilders/
├── apps/
│   ├── web/                     # Next.js App Router UI
│   ├── api/                     # FastAPI service
│   └── workers/                 # Celery workers + scheduler
├── packages/
│   ├── shared/                  # Types, DTOs, error helpers
│   ├── design-system/
│   ├── api-client/
│   └── config/
├── infrastructure/
│   ├── terraform/
│   └── vercel/
├── scripts/
├── .github/workflows/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── poetry.lock (generated)
├── .env.example
└── docs/
    ├── prd.md
    ├── front-end-spec.md
    └── architecture.md
```
