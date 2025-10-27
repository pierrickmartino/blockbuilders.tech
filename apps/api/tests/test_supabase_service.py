from __future__ import annotations

import base64
import json
from datetime import datetime
from typing import Any, Dict

import httpx
import pytest

from blockbuilders_api.core.config import settings
from blockbuilders_api.services.supabase import SupabaseService, _empty_metadata


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


class _FailingClient:
    def __init__(self, method: str) -> None:
        self._request = httpx.Request(method, "https://example.com")

    async def __aenter__(self) -> "_FailingClient":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> bool:
        return False

    async def get(self, *args: Any, **kwargs: Any):
        raise httpx.ConnectTimeout("timeout", request=self._request)

    async def put(self, *args: Any, **kwargs: Any):
        raise httpx.ConnectTimeout("timeout", request=self._request)


def _make_jwt(payload: Dict[str, Any]) -> str:
    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode("utf-8")).rstrip(b"=").decode("utf-8")
    body = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).rstrip(b"=").decode("utf-8")
    return f"{header}.{body}.signature"


@pytest.fixture(autouse=True)
def _clear_supabase_cache():
    original_timeout = settings.supabase_http_timeout_seconds
    SupabaseService._metadata_cache.clear()
    yield
    SupabaseService._metadata_cache.clear()
    settings.supabase_http_timeout_seconds = original_timeout


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


@pytest.mark.asyncio
async def test_fetch_user_falls_back_to_jwt_payload(monkeypatch):
    token = _make_jwt(
        {
            "sub": "user-123",
            "email": "fallback@blockbuilders.tech",
            "app_metadata": _empty_metadata(),
        }
    )

    monkeypatch.setattr(
        "blockbuilders_api.services.supabase.httpx.AsyncClient",
        lambda *a, **kw: _FailingClient("GET"),
    )

    service = SupabaseService()
    user = await service.fetch_user(token)

    assert user.id == "user-123"
    assert user.email == "fallback@blockbuilders.tech"
    assert user.metadata.consents.simulation_only.acknowledged is False


@pytest.mark.asyncio
async def test_persist_consent_fallback_updates_cache(monkeypatch):
    token = _make_jwt(
        {
            "sub": "user-456",
            "email": "demo@blockbuilders.tech",
            "app_metadata": _empty_metadata(),
        }
    )

    monkeypatch.setattr(
        "blockbuilders_api.services.supabase.httpx.AsyncClient",
        lambda *a, **kw: _FailingClient("PUT"),
    )

    service = SupabaseService()
    metadata = await service.persist_simulation_consent(user_id="user-456")

    assert metadata.consents.simulation_only.acknowledged is True

    monkeypatch.setattr(
        "blockbuilders_api.services.supabase.httpx.AsyncClient",
        lambda *a, **kw: _FailingClient("GET"),
    )

    user = await service.fetch_user(token)
    assert user.metadata.consents.simulation_only.acknowledged is True


@pytest.mark.asyncio
async def test_timeout_zero_short_circuits_remote_call(monkeypatch):
    monkeypatch.setattr(settings, "supabase_http_timeout_seconds", 0.0, raising=False)
    token = _make_jwt(
        {
            "sub": "user-offline",
            "email": "offline@blockbuilders.tech",
            "app_metadata": _empty_metadata(),
        }
    )

    service = SupabaseService()
    user = await service.fetch_user(token)
    assert user.id == "user-offline"
    assert user.metadata.consents.simulation_only.acknowledged is False
