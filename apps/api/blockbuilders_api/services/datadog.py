"""Datadog log forwarding client used by the audit service."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import httpx

from blockbuilders_shared import AuditEventType, AuditLogEvent

LOGGER = logging.getLogger(__name__)

SERVICE_BY_EVENT: Dict[AuditEventType, str] = {
    AuditEventType.AUTH_LOGIN: "auth-gateway",
    AuditEventType.AUTH_LOGOUT: "auth-gateway",
    AuditEventType.CONSENT_ACKNOWLEDGED: "auth-gateway",
    AuditEventType.WORKSPACE_CREATED: "workspace-seeding",
}


def _service_for(event: AuditLogEvent) -> str:
    return SERVICE_BY_EVENT.get(event.event_type, "auth-gateway")


@dataclass
class DatadogLogClient:
    """Minimal Datadog logs API client."""

    endpoint: str | None
    api_key: str | None = None
    transport: httpx.AsyncBaseTransport | None = None
    _retry_after: datetime | None = field(default=None, init=False, repr=False)
    _warned: bool = field(default=False, init=False, repr=False)

    async def send_event(self, event: AuditLogEvent) -> None:
        """Send the audit log event to Datadog if an endpoint is configured."""

        if not self.endpoint:
            return

        now = datetime.now(timezone.utc)
        if self._retry_after and now < self._retry_after:
            return

        payload = self._build_payload(event)
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["DD-API-KEY"] = self.api_key

        try:
            async with httpx.AsyncClient(timeout=5.0, transport=self.transport) as client:
                await client.post(self.endpoint, headers=headers, json=payload)
        except httpx.HTTPError as exc:
            retry_delay = timedelta(seconds=60)
            self._retry_after = now + retry_delay
            if not self._warned:
                LOGGER.warning(
                    "Failed to forward audit event to Datadog: %s. "
                    "Datadog forwarding will retry in %s seconds. "
                    "Run `python scripts/mock_datadog_agent.py --port 8282` to capture events locally.",
                    exc,
                    int(retry_delay.total_seconds()),
                )
                self._warned = True
            else:
                LOGGER.debug("Datadog forwarding still unavailable: %s", exc)
        else:
            self._retry_after = None
            self._warned = False

    def _build_payload(self, event: AuditLogEvent) -> Dict[str, Any]:
        metadata = event.metadata or {}
        tags = [
            f"event_type:{event.event_type.value.lower()}",
            f"actor_id:{event.actor_id}",
        ]
        if metadata.get("strategyId"):
            tags.append(f"strategy_id:{metadata['strategyId']}")

        return {
            "service": _service_for(event),
            "ddsource": "fastapi",
            "status": "info",
            "message": f"{event.event_type.value} recorded for {event.actor_id}",
            "ddtags": ",".join(tags),
            "event": event.model_dump(by_alias=True, mode="json"),
        }
