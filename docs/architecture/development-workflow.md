# Development Workflow

## Local Development Setup
### Prerequisites
```bash
# Toolchain
brew install node@20 pnpm python@3.11 poetry redis awscli
uv install --upgrade uv
uv install pre-commit
brew install --cask docker
```

### Initial Setup
```bash
pnpm install
poetry install --sync --no-root --directory apps/api
poetry install --sync --no-root --directory apps/workers
cp .env.example .env
cp .env.example apps/web/.env.local
pre-commit install
```

### Development Commands
```bash
# Start everything
docker compose up redis timescale -d
pnpm turbo run dev --parallel

# Frontend only
pnpm --filter web dev

# Backend only
make api-dev  # wraps uvicorn with reload

# Tests
pnpm turbo run test
poetry run pytest apps/api
poetry run pytest apps/workers
```

## Environment Configuration
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=...

# Backend (.env)
API_HOST=0.0.0.0
API_PORT=8000
DATABASE_URL=postgresql+asyncpg://blockbuilders:password@localhost:5432/blockbuilders
REDIS_URL=redis://localhost:6379/0
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
SUPABASE_API_AUDIENCE=authenticated
STRIPE_SECRET_KEY=sk_test_...
TIMESCALE_SSL_MODE=require
S3_BUCKET=bb-artifacts-dev

# Shared
APP_ENV=development
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
LOG_LEVEL=INFO
```
