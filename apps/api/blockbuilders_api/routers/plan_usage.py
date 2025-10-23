"""Plan usage quota endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel, Field

from blockbuilders_shared import PlanUsage, PlanUsageMetric

from ..dependencies.auth import AuthenticatedUser, get_current_user
from ..services.plan_usage import (
    PlanUsageService,
    QuotaExceededError,
    get_plan_usage_service,
    quota_http_exception,
)

router = APIRouter(tags=["plan-usage"])


class PlanUsageAssertRequest(BaseModel):
    metric: PlanUsageMetric
    amount: int = Field(default=1, gt=0)


@router.get("/plan-usage/{metric}", response_model=PlanUsage)
async def read_plan_usage(
    metric: PlanUsageMetric,
    user: AuthenticatedUser = Depends(get_current_user),
    service: PlanUsageService = Depends(get_plan_usage_service),
) -> PlanUsage:
    return await service.get_usage(user_id=user.id, metric=metric)


@router.post("/plan-usage/assert", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def assert_plan_usage(
    payload: PlanUsageAssertRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    service: PlanUsageService = Depends(get_plan_usage_service),
) -> Response:
    try:
        await service.assert_within_quota(user_id=user.id, metric=payload.metric, amount=payload.amount)
    except QuotaExceededError as exc:
        raise quota_http_exception(exc) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)
