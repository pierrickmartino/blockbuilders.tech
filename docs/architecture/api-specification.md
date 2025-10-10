# API Specification
Assumes RESTful JSON endpoints under `/api/v1` generated from FastAPI OpenAPI.

```yaml
openapi: 3.0.3
info:
  title: Blockbuilders API
  version: 1.0.0
  description: REST endpoints for strategies, simulations, paper trading, community sharing, and compliance.
servers:
  - url: https://api.blockbuilders.app/api/v1
    description: Production
  - url: https://staging-api.blockbuilders.app/api/v1
    description: Staging
paths:
  /strategies:
    get:
      summary: List strategies with optional visibility filters
      tags: [Strategies]
      responses:
        '200':
          description: Strategy list
    post:
      summary: Create strategy
      security: [{ bearerAuth: [] }]
      responses:
        '201':
          description: Strategy created
  /strategies/{strategyId}/versions:
    post:
      summary: Create new version from canvas payload
      security: [{ bearerAuth: [] }]
  /backtests:
    post:
      summary: Enqueue backtest run
      security: [{ bearerAuth: [] }]
      responses:
        '202':
          description: Job accepted
  /paper-trades:
    get:
      summary: List scheduled paper runs
      security: [{ bearerAuth: [] }]
    post:
      summary: Schedule paper trading
      security: [{ bearerAuth: [] }]
  /templates:
    get:
      summary: Browse published templates
    post:
      summary: Publish strategy template
      security: [{ bearerAuth: [] }]
  /admin/compliance/events:
    get:
      summary: List compliance events
      security: [{ bearerAuth: [] }]
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```
