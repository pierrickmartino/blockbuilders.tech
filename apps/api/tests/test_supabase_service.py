from __future__ import annotations

from datetime import datetime
from typing import Any

import pytest

from blockbuilders_api.services.supabase import SupabaseService


class _DummyResponse:
    def __init__(self, payload: dict[str, Any]) -> None:
        self._payload = payload
        self.status_code = 200
        self.content = b"{}"

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, Any]:
        return self._payload


class _DummyClient:
    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self._last_payload: dict[str, Any] | None = None

    async def __aenter__(self) -> "_DummyClient":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> bool:
        return False

    async def put(self, url: str, *, headers: dict[str, str] | None = None, json: dict[str, Any] | None = None):
        self._last_payload = json or {}
        payload = {"app_metadata": (json or {}).get("app_metadata", {})}
        return _DummyResponse(payload)

    @property
    def last_payload(self) -> dict[str, Any] | None:
        return self._last_payload


@pytest.mark.asyncio
async def test_simulation_consent_payload_serializes_datetime(monkeypatch):
    dummy_client = _DummyClient()
    monkeypatch.setattr("blockbuilders_api.services.supabase.httpx.AsyncClient", lambda *a, **kw: dummy_client)

    service = SupabaseService()

    metadata = await service.persist_simulation_consent(user_id="user-123")

    payload = dummy_client.last_payload
    assert payload is not None
    consent = payload["app_metadata"]["consents"]["simulationOnly"]

    assert consent["acknowledged"] is True
    assert isinstance(consent["acknowledgedAt"], str)
    parsed = datetime.fromisoformat(consent["acknowledgedAt"])
    assert parsed.tzinfo is not None

    assert metadata.consents.simulation_only.acknowledged is True
    assert metadata.consents.simulation_only.acknowledged_at is not None
