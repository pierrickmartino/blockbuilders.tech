"""Strategy bootstrap endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from blockbuilders_shared import AuditEventType, PlanUsageMetric, StrategySeed

from ..dependencies.auth import AuthenticatedUser, require_consent
from ..services.audit import AuditService
from ..services.plan_usage import (
    PlanUsageService,
    QuotaExceededError,
    get_plan_usage_service,
    quota_http_exception,
)
from ..services.workspace import WorkspaceService, get_workspace_service

router = APIRouter(tags=["strategies"])


@router.post("/strategies", response_model=StrategySeed)
async def create_strategy(
    user: AuthenticatedUser = Depends(require_consent),
    workspace: WorkspaceService = Depends(get_workspace_service),
    audit: AuditService = Depends(AuditService),
    plan_usage: PlanUsageService = Depends(get_plan_usage_service),
) -> StrategySeed:
    try:
        await plan_usage.assert_within_quota(user_id=user.id, metric=PlanUsageMetric.BACKTESTS)
    except QuotaExceededError as exc:
        raise quota_http_exception(exc) from exc

    seed, created = workspace.get_or_create_demo_workspace(user)
    if created:
        await audit.record(
            actor_id=user.id,
            event_type=AuditEventType.WORKSPACE_CREATED,
            metadata=workspace.audit_metadata(seed),
        )
    return seed


@router.post("/strategies/{strategy_id}/versions", response_model=StrategySeed)
async def create_strategy_version(
    strategy_id: str,
    user: AuthenticatedUser = Depends(require_consent),
    workspace: WorkspaceService = Depends(get_workspace_service),
) -> StrategySeed:
    seed, _ = workspace.get_or_create_demo_workspace(user)
    if seed.strategy_id != strategy_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Strategy not found")
    return seed
