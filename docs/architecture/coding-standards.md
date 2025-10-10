# Coding Standards

## Critical Fullstack Rules
- **Shared contracts only:** Define request/response types in `packages/shared` and consume via generated clients—no ad-hoc interfaces.
- **Async everywhere:** Never block FastAPI or Next.js handlers; move CPU-heavy analytics into Celery workers.
- **Feature gates:** Use the central `FeatureGate` helper; do not hard-code role checks in components or routes.
- **Compliance hooks:** Any template visibility change must call `compliance_service.audit_change` before persistence.
- **Observability:** Wrap external API calls with the `with_tracing` decorator to capture spans + correlation IDs.

## Naming Conventions
| Element | Frontend | Backend | Example |
| --- | --- | --- | --- |
| Components | PascalCase | - | `StrategyCanvas.tsx` |
| Hooks | camelCase with `use` | - | `useBacktestStatus.ts` |
| API Routes | - | kebab-case | `/api/v1/paper-trades` |
| Database Tables | - | snake_case | `paper_trade_runs` |
