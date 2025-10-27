"""Supabase administration helpers."""

from __future__ import annotations

import base64
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

import httpx
from fastapi import HTTPException, status
from pydantic import ValidationError

from blockbuilders_shared import AppMetadata, SimulationConsent

from ..core.config import settings
from ..models.auth import AuthenticatedUser

USER_ENDPOINT = "/auth/v1/user"
ADMIN_UPDATE_ENDPOINT = "/auth/v1/admin/users/{user_id}"

LOGGER = logging.getLogger(__name__)


def _empty_metadata() -> Dict[str, Any]:
    return {
        "consents": {
            "simulationOnly": {
                "acknowledged": False,
                "acknowledgedAt": None,
            }
        }
    }


def _metadata_with_consent(metadata: AppMetadata, consent: SimulationConsent) -> AppMetadata:
    """Return a new metadata object with the supplied consent applied."""

    metadata_dict = metadata.model_dump(by_alias=True)
    metadata_dict.setdefault("consents", {})
    metadata_dict["consents"]["simulationOnly"] = consent.model_dump(by_alias=True, mode="json")
    return AppMetadata.model_validate(metadata_dict)


class SupabaseService:
    """Wrapper around Supabase Auth REST endpoints with local fallbacks for offline development."""

    _metadata_cache: Dict[str, AppMetadata] = {}

    @classmethod
    def _cache_metadata(cls, user_id: str, metadata: AppMetadata) -> None:
        cls._metadata_cache[user_id] = metadata

    @classmethod
    def _get_cached_metadata(cls, user_id: str) -> Optional[AppMetadata]:
        return cls._metadata_cache.get(user_id)

    async def fetch_user(self, access_token: str) -> AuthenticatedUser:
        fallback_user = self._user_from_token_with_cache(access_token)
        if settings.supabase_http_timeout_seconds <= 0 and fallback_user is not None:
            return fallback_user

        headers = {
            "Authorization": f"Bearer {access_token}",
            "apikey": settings.supabase_service_role_key,
        }

        try:
            timeout = httpx.Timeout(
                settings.supabase_http_timeout_seconds,
                connect=settings.supabase_http_timeout_seconds,
                read=settings.supabase_http_timeout_seconds,
                write=settings.supabase_http_timeout_seconds,
            )
        except ValueError:
            timeout = httpx.Timeout(1.0)

        try:
            async with httpx.AsyncClient(base_url=str(settings.supabase_url), timeout=timeout) as client:
                response = await client.get(USER_ENDPOINT, headers=headers)
        except httpx.HTTPError as exc:
            LOGGER.warning("Supabase fetch_user failed, falling back to JWT payload: %s", exc)
            cached_user = fallback_user or self._user_from_token_with_cache(access_token)
            if cached_user is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Supabase user service unavailable",
                ) from exc
            return cached_user

        if response.status_code == status.HTTP_401_UNAUTHORIZED:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase token")

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            LOGGER.warning("Supabase fetch_user returned error response: %s", exc)
            cached_user = fallback_user or self._user_from_token_with_cache(access_token)
            if cached_user is None:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Supabase user service unavailable",
                ) from exc
            return cached_user

        payload = response.json()

        try:
            metadata = AppMetadata.model_validate(payload.get("app_metadata") or _empty_metadata())
        except ValidationError:
            metadata = AppMetadata.model_validate(_empty_metadata())

        user = AuthenticatedUser(id=payload["id"], email=payload["email"], metadata=metadata)
        self._cache_metadata(user.id, metadata)
        return user

    async def persist_simulation_consent(self, *, user_id: str) -> AppMetadata:
        consent = SimulationConsent(acknowledged=True, acknowledged_at=datetime.now(timezone.utc))
        metadata_payload: Dict[str, Any] = {
            "app_metadata": {
                "consents": {
                    "simulationOnly": consent.model_dump(by_alias=True, mode="json")
                }
            }
        }

        headers = {
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "apikey": settings.supabase_service_role_key,
        }

        if settings.supabase_http_timeout_seconds <= 0:
            return self._persist_consent_locally(user_id=user_id, consent=consent)

        try:
            timeout = httpx.Timeout(
                settings.supabase_http_timeout_seconds,
                connect=settings.supabase_http_timeout_seconds,
                read=settings.supabase_http_timeout_seconds,
                write=settings.supabase_http_timeout_seconds,
            )
        except ValueError:
            timeout = httpx.Timeout(1.0)

        try:
            async with httpx.AsyncClient(base_url=str(settings.supabase_url), timeout=timeout) as client:
                response = await client.put(
                    ADMIN_UPDATE_ENDPOINT.format(user_id=user_id),
                    headers=headers,
                    json=metadata_payload,
                )
        except httpx.HTTPError as exc:
            LOGGER.warning("Supabase consent persistence failed, caching locally: %s", exc)
            return self._persist_consent_locally(user_id=user_id, consent=consent)

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            LOGGER.warning("Supabase consent persistence returned error response: %s", exc)
            return self._persist_consent_locally(user_id=user_id, consent=consent)

        payload = response.json() if response.content else metadata_payload
        metadata = AppMetadata.model_validate(payload.get("app_metadata", metadata_payload["app_metadata"]))
        self._cache_metadata(user_id, metadata)
        return metadata

    def _persist_consent_locally(self, *, user_id: str, consent: SimulationConsent) -> AppMetadata:
        """Fallback path used when Supabase is unreachable. Keeps metadata cached per user."""

        cached = self._get_cached_metadata(user_id)
        baseline = cached or AppMetadata.model_validate(_empty_metadata())
        metadata = _metadata_with_consent(baseline, consent)
        self._cache_metadata(user_id, metadata)
        return metadata

    def _user_from_token_with_cache(self, token: str) -> Optional[AuthenticatedUser]:
        """Decode the JWT locally and merge with any cached metadata."""

        decoded = self._decode_access_token(token)
        if decoded is None:
            return None

        user_id, email, metadata_payload = decoded
        if user_id is None:
            return None

        cached_metadata = self._get_cached_metadata(user_id)
        metadata: Optional[AppMetadata] = None

        if metadata_payload:
            try:
                metadata = AppMetadata.model_validate(metadata_payload)
            except ValidationError:
                metadata = None

        if cached_metadata:
            metadata = cached_metadata
        elif metadata is None:
            metadata = AppMetadata.model_validate(_empty_metadata())
            self._cache_metadata(user_id, metadata)
        else:
            self._cache_metadata(user_id, metadata)

        resolved_email = email or "unknown@blockbuilders.tech"
        return AuthenticatedUser(id=user_id, email=resolved_email, metadata=metadata)

    @staticmethod
    def _decode_access_token(token: str) -> Optional[Tuple[Optional[str], Optional[str], Optional[Dict[str, Any]]]]:
        """Decode a Supabase JWT without verification. Used strictly as an offline fallback."""

        parts = token.split(".")
        if len(parts) != 3:
            return None

        payload_segment = parts[1]
        padding = "=" * (-len(payload_segment) % 4)
        try:
            decoded_bytes = base64.urlsafe_b64decode(payload_segment + padding)
            payload = json.loads(decoded_bytes.decode("utf-8"))
        except (ValueError, json.JSONDecodeError):
            return None

        user_id = payload.get("sub")
        email = payload.get("email") or payload.get("user_metadata", {}).get("email")
        app_metadata = payload.get("app_metadata")
        return user_id, email, app_metadata
