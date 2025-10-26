from __future__ import annotations

import pytest

from blockbuilders_shared import AppMetadata, ONBOARDING_CALLOUT_ORDER

from blockbuilders_api.models.auth import AuthenticatedUser
from blockbuilders_api.services.supabase import SupabaseService
from blockbuilders_api.services.workspace import WorkspaceService, get_workspace_service

from .conftest import SupabaseServiceStub

AUTH_HEADER = {"Authorization": "Bearer stub-token"}


@pytest.mark.asyncio
async def test_cors_preflight_allows_auth_endpoints(client):
    response = await client.options(
        "/api/v1/auth/session",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization,Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    allow_methods = response.headers.get("access-control-allow-methods", "")
    assert allow_methods == "*" or "GET" in {method.strip().upper() for method in allow_methods.split(",")}


@pytest.mark.asyncio
async def test_session_reflects_consent_state(app, client):
    stub = SupabaseServiceStub(acknowledged=False)
    app.dependency_overrides[SupabaseService] = lambda: stub

    response = await client.get("/api/v1/auth/session", headers=AUTH_HEADER)

    assert response.status_code == 200
    payload = response.json()
    assert payload["appMetadata"]["consents"]["simulationOnly"]["acknowledged"] is False
    assert payload["appMetadata"]["consents"]["simulationOnly"]["acknowledgedAt"] is None


@pytest.mark.asyncio
async def test_consent_persist_updates_metadata(app, client):
    stub = SupabaseServiceStub(acknowledged=False)
    app.dependency_overrides[SupabaseService] = lambda: stub

    persist_response = await client.post("/api/v1/auth/consent", headers=AUTH_HEADER)

    assert persist_response.status_code == 204
    assert stub.persist_calls == 1

    session_response = await client.get("/api/v1/auth/session", headers=AUTH_HEADER)
    assert session_response.status_code == 200
    payload = session_response.json()
    assert payload["appMetadata"]["consents"]["simulationOnly"]["acknowledged"] is True
    assert payload["appMetadata"]["consents"]["simulationOnly"]["acknowledgedAt"] is not None


@pytest.mark.asyncio
async def test_strategy_creation_requires_consent(app, client):
    stub = SupabaseServiceStub(acknowledged=False)
    app.dependency_overrides[SupabaseService] = lambda: stub

    response = await client.post("/api/v1/strategies", headers=AUTH_HEADER)

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_strategy_creation_succeeds_after_consent(app, client):
    stub = SupabaseServiceStub(acknowledged=False)
    app.dependency_overrides[SupabaseService] = lambda: stub

    persist_response = await client.post("/api/v1/auth/consent", headers=AUTH_HEADER)
    assert persist_response.status_code == 204

    strategy_response = await client.post("/api/v1/strategies", headers=AUTH_HEADER)
    assert strategy_response.status_code == 200


@pytest.mark.asyncio
async def test_workspace_provision_logs_once(app, client, audit_service):
    app.dependency_overrides[SupabaseService] = lambda: SupabaseServiceStub(acknowledged=True)

    workspace_service = WorkspaceService()
    app.dependency_overrides[get_workspace_service] = lambda: workspace_service

    first = await client.post("/api/v1/strategies", headers=AUTH_HEADER)
    assert first.status_code == 200
    strategy_id = first.json()["strategyId"]

    second = await client.post(f"/api/v1/strategies/{strategy_id}/versions", headers=AUTH_HEADER)

    assert second.status_code == 200

    workspace_events = [event for event in audit_service.history() if event.event_type.value == "WORKSPACE_CREATED"]
    assert len(workspace_events) == 1
    assert workspace_events[0].metadata["strategyId"].startswith("demo-")


def test_workspace_seed_matches_spec():
    workspace_service = WorkspaceService()
    metadata = AppMetadata.model_validate(
        {
            "consents": {
                "simulationOnly": {
                    "acknowledged": True,
                    "acknowledgedAt": "2024-01-01T00:00:00Z",
                }
            }
        }
    )
    user = AuthenticatedUser(id="user-quickstart", email="demo@blockbuilders.tech", metadata=metadata)

    seed, created = workspace_service.get_or_create_demo_workspace(user)
    assert created is True

    assert [block.kind for block in seed.blocks] == [
        "data-source",
        "indicator",
        "signal",
        "risk",
        "execution",
    ]
    risk_block = next(block for block in seed.blocks if block.id == "node-risk")
    assert risk_block.label == "Risk Control"
    assert risk_block.config == {"positionSize": 0.02, "stopLoss": 0.03}

    execution_block = next(block for block in seed.blocks if block.id == "node-execution")
    assert execution_block.config == {"adapter": "paper-trading", "mode": "simulation"}

    edge_targets = {(edge.source, edge.target) for edge in seed.edges}
    assert ("node-signal", "node-risk") in edge_targets
    assert ("node-risk", "node-execution") in edge_targets

    assert [callout.id for callout in seed.callouts] == ONBOARDING_CALLOUT_ORDER
