"""Quota enforcement helper service."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone

from fastapi import HTTPException, status

from blockbuilders_shared import PlanUsage, PlanUsageMetric

from ..repositories import PlanUsageRepository


class QuotaExceededError(Exception):
    """Raised when a user exceeds the available quota for a given metric."""

    def __init__(self, *, metric: PlanUsageMetric, limit: int) -> None:
        self.metric = metric
        self.limit = limit
        super().__init__(f"Quota exceeded for metric {metric.value}; limit {limit}")


@dataclass
class PlanUsageService:
    """Service coordinating quota checks and updates."""

    repo: PlanUsageRepository = field(default_factory=PlanUsageRepository)

    async def get_usage(self, *, user_id: str, metric: PlanUsageMetric) -> PlanUsage:
        return await self.repo.get_active_window(user_id=user_id, metric=metric)

    async def assert_within_quota(
        self,
        *,
        user_id: str,
        metric: PlanUsageMetric,
        amount: int = 1,
    ) -> PlanUsage:
        usage = await self.repo.get_active_window(user_id=user_id, metric=metric)
        if usage.used + amount > usage.limit:
            raise QuotaExceededError(metric=metric, limit=usage.limit)

        return await self.repo.increment(
            user_id=user_id,
            metric=metric,
            amount=amount,
            at=datetime.now(timezone.utc),
        )


_plan_usage_service = PlanUsageService()


def get_plan_usage_service() -> PlanUsageService:
    return _plan_usage_service


def quota_http_exception(exc: QuotaExceededError) -> HTTPException:
    detail = {
        "error": "quota_exceeded",
        "metric": exc.metric.value,
        "limit": exc.limit,
        "message": f"Quota exceeded for {exc.metric.value}. Upgrade required to continue.",
    }
    return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)
