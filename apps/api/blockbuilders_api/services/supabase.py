"""Supabase administration helpers."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

import httpx
from fastapi import HTTPException, status

from pydantic import ValidationError

from blockbuilders_shared import AppMetadata, SimulationConsent

from ..core.config import settings
from ..models.auth import AuthenticatedUser

USER_ENDPOINT = "/auth/v1/user"
ADMIN_UPDATE_ENDPOINT = "/auth/v1/admin/users/{user_id}"


def _empty_metadata() -> Dict[str, Any]:
    return {
        "consents": {
            "simulationOnly": {
                "acknowledged": False,
                "acknowledgedAt": None,
            }
        }
    }


class SupabaseService:
    """Wrapper around Supabase Auth REST endpoints."""

    async def fetch_user(self, access_token: str) -> AuthenticatedUser:
        headers = {
            "Authorization": f"Bearer {access_token}",
            "apikey": settings.supabase_service_role_key,
        }

        async with httpx.AsyncClient(base_url=str(settings.supabase_url), timeout=10.0) as client:
            response = await client.get(USER_ENDPOINT, headers=headers)

        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase token")

        response.raise_for_status()
        payload = response.json()

        try:
            metadata = AppMetadata.model_validate(payload.get("app_metadata") or _empty_metadata())
        except ValidationError:
            metadata = AppMetadata.model_validate(_empty_metadata())
        return AuthenticatedUser(id=payload["id"], email=payload["email"], metadata=metadata)

    async def persist_simulation_consent(self, *, user_id: str) -> AppMetadata:
        consent = SimulationConsent(acknowledged=True, acknowledged_at=datetime.now(timezone.utc))
        metadata_payload: Dict[str, Any] = {
            "app_metadata": {
                "consents": {
                    "simulationOnly": consent.model_dump(by_alias=True)
                }
            }
        }

        headers = {
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "apikey": settings.supabase_service_role_key,
        }

        async with httpx.AsyncClient(base_url=str(settings.supabase_url), timeout=10.0) as client:
            response = await client.put(
                ADMIN_UPDATE_ENDPOINT.format(user_id=user_id),
                headers=headers,
                json=metadata_payload,
            )

        response.raise_for_status()

        payload = response.json() if response.content else metadata_payload
        metadata = AppMetadata.model_validate(payload.get("app_metadata", metadata_payload["app_metadata"]))
        return metadata
