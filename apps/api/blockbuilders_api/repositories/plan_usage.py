"""In-memory repository for quota tracking during early development."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Dict, Tuple
from uuid import uuid4

from blockbuilders_shared import PlanUsage, PlanUsageMetric

# 24 hour rolling window for freemium quota tracking.
WINDOW_DURATION = timedelta(days=1)


@dataclass
class _UsageState:
    usage_id: str
    user_id: str
    metric: PlanUsageMetric
    window_start: datetime
    window_end: datetime
    used: int
    limit: int
    updated_at: datetime

    @classmethod
    def new(cls, *, user_id: str, metric: PlanUsageMetric, limit: int, now: datetime) -> "_UsageState":
        window_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        window_end = window_start + WINDOW_DURATION
        return cls(
            usage_id=str(uuid4()),
            user_id=user_id,
            metric=metric,
            window_start=window_start,
            window_end=window_end,
            used=0,
            limit=limit,
            updated_at=now,
        )

    def refresh_window(self, *, now: datetime, limit: int) -> None:
        if now < self.window_end:
            return
        self.window_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        self.window_end = self.window_start + WINDOW_DURATION
        self.used = 0
        self.limit = limit
        self.updated_at = now

    def to_model(self) -> PlanUsage:
        return PlanUsage.model_validate(
            {
                "id": self.usage_id,
                "userId": self.user_id,
                "metric": self.metric.value,
                "windowStart": self.window_start.isoformat(),
                "windowEnd": self.window_end.isoformat(),
                "used": self.used,
                "limit": self.limit,
                "updatedAt": self.updated_at.isoformat(),
            }
        )


class PlanUsageRepository:
    """Repository responsible for retrieving and updating plan usage counters."""

    def __init__(self, *, limits: Dict[PlanUsageMetric, int] | None = None) -> None:
        self._limits = limits or {
            PlanUsageMetric.BACKTESTS: 20,
            PlanUsageMetric.PAPER_TRADES: 5,
            PlanUsageMetric.TEMPLATE_PUBLISHES: 3,
        }
        self._store: Dict[Tuple[str, PlanUsageMetric], _UsageState] = {}

    def _limit_for(self, metric: PlanUsageMetric) -> int:
        return self._limits.get(metric, 0)

    async def get_active_window(self, *, user_id: str, metric: PlanUsageMetric) -> PlanUsage:
        now = datetime.now(timezone.utc)
        key = (user_id, metric)
        limit = self._limit_for(metric)

        state = self._store.get(key)
        if state is None:
            state = _UsageState.new(user_id=user_id, metric=metric, limit=limit, now=now)
            self._store[key] = state
        else:
            state.refresh_window(now=now, limit=limit)

        return state.to_model()

    async def increment(self, *, user_id: str, metric: PlanUsageMetric, amount: int = 1, at: datetime | None = None) -> PlanUsage:
        now = at or datetime.now(timezone.utc)
        key = (user_id, metric)
        limit = self._limit_for(metric)

        state = self._store.get(key)
        if state is None:
            state = _UsageState.new(user_id=user_id, metric=metric, limit=limit, now=now)
            self._store[key] = state
        else:
            state.refresh_window(now=now, limit=limit)

        state.used += amount
        state.updated_at = now
        return state.to_model()

    async def set_limit(self, *, metric: PlanUsageMetric, limit: int) -> None:
        self._limits[metric] = limit
