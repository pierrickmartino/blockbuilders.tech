"""Notification fan-out for audit events."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List

from blockbuilders_shared import AuditLogEvent


@dataclass
class NotificationService:
    """Collects audit notifications that would normally be dispatched to admins."""

    channel: str = "audit-alerts"
    _messages: List[Dict[str, str]] = field(default_factory=list)

    def publish(self, event: AuditLogEvent) -> Dict[str, str]:
        message = {
            "channel": self.channel,
            "eventId": event.id,
            "eventType": event.event_type.value,
            "actorId": event.actor_id,
        }
        self._messages.append(message)
        return message

    def history(self) -> List[Dict[str, str]]:
        return list(self._messages)
