"""Strategy bootstrap endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from blockbuilders_shared import AuditEventType, StrategySeed

from ..dependencies.auth import AuthenticatedUser, get_current_user
from ..services.audit import AuditService
from ..services.workspace import WorkspaceService, get_workspace_service

router = APIRouter(tags=["strategies"])


@router.post("/strategies", response_model=StrategySeed)
async def create_strategy(
    user: AuthenticatedUser = Depends(get_current_user),
    workspace: WorkspaceService = Depends(get_workspace_service),
    audit: AuditService = Depends(AuditService),
) -> StrategySeed:
    seed, created = workspace.get_or_create_demo_workspace(user)
    if created:
        audit.record(
            actor_id=user.id,
            event_type=AuditEventType.WORKSPACE_CREATED,
            metadata=workspace.audit_metadata(seed),
        )
    return seed


@router.post("/strategies/{strategy_id}/versions", response_model=StrategySeed)
async def create_strategy_version(
    strategy_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    workspace: WorkspaceService = Depends(get_workspace_service),
) -> StrategySeed:
    seed, _ = workspace.get_or_create_demo_workspace(user)
    if seed.strategy_id != strategy_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    return seed
