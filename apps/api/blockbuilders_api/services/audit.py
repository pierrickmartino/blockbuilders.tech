"""Audit logging helpers to capture critical auth lifecycle events."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List

from blockbuilders_shared import AuditEventType, AuditLogEvent

from ..repositories.compliance import ComplianceRepository
from .datadog import DatadogLogClient
from .notifications import NotificationService

LOGGER = logging.getLogger(__name__)


@dataclass
class AuditService:
    """Audit collector that fans out to observability, compliance, and notification sinks."""

    datadog: DatadogLogClient | None = None
    compliance: ComplianceRepository | None = None
    notifications: NotificationService | None = None
    _events: List[AuditLogEvent] = field(default_factory=list)

    async def record(
        self,
        *,
        actor_id: str,
        event_type: AuditEventType,
        metadata: Dict[str, str] | None = None,
    ) -> AuditLogEvent:
        event = AuditLogEvent(
            id=f"evt_{len(self._events) + 1}",
            actor_id=actor_id,
            event_type=event_type,
            created_at=datetime.now(timezone.utc),
            metadata=metadata or {},
        )
        self._events.append(event)

        if self.datadog:
            await self.datadog.send_event(event)

        if self.compliance and event.event_type == AuditEventType.WORKSPACE_CREATED:
            try:
                self.compliance.record(event)
            except Exception as exc:  # pragma: no cover - defensive logging
                LOGGER.warning("Failed to persist compliance record: %s", exc)

        if self.notifications:
            try:
                self.notifications.publish(event)
            except Exception as exc:  # pragma: no cover - defensive logging
                LOGGER.warning("Failed to publish audit notification: %s", exc)

        return event

    def history(self) -> List[AuditLogEvent]:
        return list(self._events)
