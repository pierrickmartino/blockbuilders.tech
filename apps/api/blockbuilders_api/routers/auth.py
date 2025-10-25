"""Authentication endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response

from blockbuilders_shared import AuditEventType

from ..dependencies.auth import AuthenticatedUser, get_current_user
from ..schemas import AuthSession
from ..services.audit import AuditService
from ..services.supabase import SupabaseService

router = APIRouter(tags=["auth"])


@router.get("/auth/session", response_model=AuthSession)
async def read_session(
    user: AuthenticatedUser = Depends(get_current_user),
    audit: AuditService = Depends(AuditService),
) -> AuthSession:
    """Return the authenticated user's profile and persist an audit trail."""

    await audit.record(actor_id=user.id, event_type=AuditEventType.AUTH_LOGIN)
    return AuthSession.from_metadata(user_id=user.id, email=user.email, metadata=user.metadata)


@router.post("/auth/consent", status_code=204, response_class=Response)
async def persist_consent(
    user: AuthenticatedUser = Depends(get_current_user),
    supabase: SupabaseService = Depends(SupabaseService),
    audit: AuditService = Depends(AuditService),
) -> Response:
    """Persist the user's simulation-only consent via Supabase admin APIs."""

    metadata = await supabase.persist_simulation_consent(user_id=user.id)
    user.metadata = metadata
    await audit.record(actor_id=user.id, event_type=AuditEventType.CONSENT_ACKNOWLEDGED)
    return Response(status_code=204)
