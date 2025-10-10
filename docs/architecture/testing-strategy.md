# Testing Strategy

## Testing Pyramid
```text
E2E Tests
/        \
Integration Tests
/            \
Frontend Unit  Backend Unit
```

## Test Organization
### Frontend
```text
apps/web/tests/
├── unit/
│   ├── components/StrategyCanvas.test.tsx
│   └── components/NotificationCenter.test.tsx
├── integration/
│   ├── flows/onboard-to-backtest.test.tsx
│   └── flows/paper-trading-scheduler.test.tsx
└── utils/test-utils.ts
```

### Backend
```text
apps/api/tests/
├── unit/test_strategy_service.py
├── unit/test_plan_usage_service.py
├── integration/test_backtest_flow.py
└── fixtures/mock_market_data.py
```

### E2E
```text
tests/e2e/
├── onboarding.spec.ts
├── backtest-run.spec.ts
├── plan-guardrails.spec.ts
└── educator-sharing.spec.ts
```

## Test Examples
### Frontend Component Test
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrategyCanvas } from '@/components/canvas/StrategyCanvas';
import { canvasStoreWrapper } from '@/tests/utils';

test('runs validation when user clicks validate', async () => {
  const user = userEvent.setup();
  render(<StrategyCanvas strategyId="s1" versionId="v1" />, { wrapper: canvasStoreWrapper });
  await user.click(screen.getByRole('button', { name: /validate/i }));
  expect(screen.getByText(/running validation/i)).toBeVisible();
});
```

### Backend API Test
```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_strategy(async_client: AsyncClient, auth_header):
    payload = {
        'title': 'Mean Reversion Alpha',
        'visibility': 'private',
        'tags': ['mean reversion'],
        'graphJson': {'nodes': [], 'edges': []}
    }
    response = await async_client.post('/api/v1/strategies', json=payload, headers=auth_header)
    assert response.status_code == 201
    body = response.json()
    assert body['title'] == 'Mean Reversion Alpha'
    assert body['status'] == 'draft'
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('free-tier user hits backtest quota and sees upgrade CTA', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /get started/i }).click();
  await page.getByLabel('Email').fill('free-builder@example.com');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.getByRole('button', { name: /start with template/i }).click();
  for (let i = 0; i < 3; i += 1) {
    await page.getByRole('button', { name: /run backtest/i }).click();
    await expect(page.getByText(/backtest queued/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /close/i }).click();
  }
  await page.getByRole('button', { name: /run backtest/i }).click();
  await expect(page.getByText(/upgrade to unlock more backtests/i)).toBeVisible();
});
```
