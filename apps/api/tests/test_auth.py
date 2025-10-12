from __future__ import annotations

import pytest

from blockbuilders_api.services.supabase import SupabaseService
from blockbuilders_api.services.workspace import WorkspaceService, get_workspace_service

from .conftest import SupabaseServiceStub

AUTH_HEADER = {"Authorization": "Bearer stub-token"}


@pytest.mark.asyncio
async def test_session_requires_consent(app, client):
    app.dependency_overrides[SupabaseService] = lambda: SupabaseServiceStub(acknowledged=False)

    response = await client.get("/api/v1/auth/session", headers=AUTH_HEADER)

    assert response.status_code == 403


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
