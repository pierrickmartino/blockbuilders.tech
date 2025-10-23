"""Audit logging helpers to capture critical auth lifecycle events."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, List

from blockbuilders_shared import AuditEventType, AuditLogEvent


@dataclass
class AuditService:
    """Simple in-memory audit collector; replace with persistence later."""

    _events: List[AuditLogEvent] | None = None

    def __post_init__(self) -> None:
        if self._events is None:
            self._events = []

    def record(
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
        return event

    def history(self) -> List[AuditLogEvent]:
        return list(self._events)
