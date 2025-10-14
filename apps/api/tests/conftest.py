from __future__ import annotations

import asyncio
import sys
from collections.abc import AsyncIterator
from pathlib import Path
from typing import AsyncGenerator

import pytest
from httpx import AsyncClient

PROJECT_ROOT = Path(__file__).resolve().parents[3]
API_SRC = PROJECT_ROOT / "apps" / "api"
SHARED_SRC = PROJECT_ROOT / "packages" / "shared" / "python"

for path in (API_SRC, SHARED_SRC):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from blockbuilders_shared import AppMetadata

from blockbuilders_api.main import create_app
from blockbuilders_api.models.auth import AuthenticatedUser
from blockbuilders_api.services.audit import AuditService
from blockbuilders_api.services.supabase import SupabaseService


class SupabaseServiceStub(SupabaseService):
    def __init__(self, *, acknowledged: bool) -> None:
        self._acknowledged = acknowledged
        self.persist_calls = 0
        self._metadata = AppMetadata.model_validate(
            {
                "consents": {
                    "simulationOnly": {
                        "acknowledged": acknowledged,
                        "acknowledgedAt": "2024-01-01T00:00:00Z",
                    }
                }
            }
        )
        self._user = AuthenticatedUser(id="user-123", email="demo@blockbuilders.tech", metadata=self._metadata)

    async def fetch_user(self, access_token: str) -> AuthenticatedUser:  # noqa: ARG002
        return self._user

    async def persist_simulation_consent(self, *, user_id: str) -> AppMetadata:  # noqa: ARG002
        self.persist_calls += 1
        self._metadata = AppMetadata.model_validate(
            {
                "consents": {
                    "simulationOnly": {
                        "acknowledged": True,
                        "acknowledgedAt": "2024-01-01T00:00:00Z",
                    }
                }
            }
        )
        self._user.metadata = self._metadata
        return self._metadata


@pytest.fixture()
def event_loop() -> AsyncIterator[asyncio.AbstractEventLoop]:
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture()
def audit_service() -> AuditService:
    return AuditService()


@pytest.fixture()
def app(audit_service: AuditService):
    application = create_app()
    application.dependency_overrides[AuditService] = lambda: audit_service
    return application


@pytest.fixture()
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(app=app, base_url="http://testserver") as async_client:
        yield async_client
