"""Authentication dependencies leveraging Supabase metadata."""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..models.auth import AuthenticatedUser
from ..services.supabase import SupabaseService


security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    supabase: SupabaseService = Depends(SupabaseService),
) -> AuthenticatedUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Supabase token")

    user = await supabase.fetch_user(credentials.credentials)

    consent = user.metadata.consents.simulation_only
    if not consent.acknowledged:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Simulation consent required")

    return user
