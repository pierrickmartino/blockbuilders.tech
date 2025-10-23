from __future__ import annotations

import pytest

from blockbuilders_shared import PlanUsageMetric

from blockbuilders_api.services.plan_usage import PlanUsageService
from blockbuilders_api.services.supabase import SupabaseService

from .conftest import SupabaseServiceStub

AUTH_HEADER = {"Authorization": "Bearer stub-token"}


@pytest.mark.asyncio
async def test_plan_usage_get_returns_usage_snapshot(app, client):
    app.dependency_overrides[SupabaseService] = lambda: SupabaseServiceStub(acknowledged=True)

    response = await client.get("/api/v1/plan-usage/backtests", headers=AUTH_HEADER)

    assert response.status_code == 200
    payload = response.json()
    assert payload["used"] == 0
    assert payload["limit"] == 20
    assert payload["metric"] == "backtests"


@pytest.mark.asyncio
async def test_plan_usage_assert_increments_usage(app, client, plan_usage_service: PlanUsageService):
    app.dependency_overrides[SupabaseService] = lambda: SupabaseServiceStub(acknowledged=True)

    first = await client.post("/api/v1/plan-usage/assert", headers=AUTH_HEADER, json={"metric": "backtests"})
    assert first.status_code == 204

    status_response = await client.get("/api/v1/plan-usage/backtests", headers=AUTH_HEADER)
    assert status_response.status_code == 200
    assert status_response.json()["used"] == 1


@pytest.mark.asyncio
@pytest.mark.parametrize("amount", [0, -1])
async def test_plan_usage_assert_rejects_non_positive_amount(app, client, amount):
    app.dependency_overrides[SupabaseService] = lambda: SupabaseServiceStub(acknowledged=True)

    response = await client.post(
        "/api/v1/plan-usage/assert",
        headers=AUTH_HEADER,
        json={"metric": "backtests", "amount": amount},
    )

    assert response.status_code == 422
    detail = response.json()["detail"]
    assert any(error.get("loc", [])[-1] == "amount" for error in detail)


@pytest.mark.asyncio
async def test_plan_usage_assert_blocks_when_over_limit(app, client, plan_usage_service: PlanUsageService):
    app.dependency_overrides[SupabaseService] = lambda: SupabaseServiceStub(acknowledged=True)

    await plan_usage_service.repo.set_limit(metric=PlanUsageMetric.BACKTESTS, limit=1)

    allowed = await client.post("/api/v1/plan-usage/assert", headers=AUTH_HEADER, json={"metric": "backtests"})
    assert allowed.status_code == 204

    blocked = await client.post("/api/v1/plan-usage/assert", headers=AUTH_HEADER, json={"metric": "backtests"})
    assert blocked.status_code == 403
    detail = blocked.json()["detail"]
    assert detail["error"] == "quota_exceeded"
    assert detail["limit"] == 1


@pytest.mark.asyncio
async def test_strategy_creation_blocks_when_quota_exhausted(app, client, plan_usage_service: PlanUsageService, audit_service):
    app.dependency_overrides[SupabaseService] = lambda: SupabaseServiceStub(acknowledged=True)

    await plan_usage_service.repo.set_limit(metric=PlanUsageMetric.BACKTESTS, limit=0)

    response = await client.post("/api/v1/strategies", headers=AUTH_HEADER)
    assert response.status_code == 403
    assert response.json()["detail"]["error"] == "quota_exceeded"
