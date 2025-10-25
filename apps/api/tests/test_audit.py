from __future__ import annotations

import json

import pytest

from blockbuilders_shared import AuditEventType

from blockbuilders_api.repositories.compliance import ComplianceRepository
from blockbuilders_api.services.audit import AuditService
from blockbuilders_api.services.datadog import DatadogLogClient
from blockbuilders_api.services.notifications import NotificationService
from tests.utils.datadog_sink import DatadogSink


@pytest.mark.asyncio
async def test_audit_service_streams_to_observability(tmp_path):
    sink = DatadogSink()
    transport = sink.as_transport()

    datadog = DatadogLogClient(endpoint="http://127.0.0.1:8282/logs", api_key="dd_test", transport=transport)
    compliance_path = tmp_path / "audit.csv"
    compliance = ComplianceRepository(export_path=compliance_path)
    notifications = NotificationService(channel="audit-alerts")

    service = AuditService(datadog=datadog, compliance=compliance, notifications=notifications)

    await service.record(
        actor_id="user-123",
        event_type=AuditEventType.WORKSPACE_CREATED,
        metadata={"strategyId": "demo-strategy", "versionId": "demo-v1"},
    )

    payload = sink.last_payload()
    assert payload is not None
    assert payload["service"] == "workspace-seeding"
    assert "actor_id:user-123" in payload["ddtags"]
    assert sink.records[-1]["headers"].get("dd-api-key") == "dd_test"

    assert compliance_path.exists() is True
    contents = compliance_path.read_text().splitlines()
    assert "WORKSPACE_CREATED" in contents[1]
    assert "demo-strategy" in contents[1]

    history = notifications.history()
    assert len(history) == 1
    assert history[0]["eventType"] == "WORKSPACE_CREATED"


@pytest.mark.asyncio
async def test_auth_events_persist_to_compliance(tmp_path):
    compliance_path = tmp_path / "audit.csv"
    compliance = ComplianceRepository(export_path=compliance_path)
    service = AuditService(compliance=compliance)

    login_event = await service.record(actor_id="user-456", event_type=AuditEventType.AUTH_LOGIN)
    consent_event = await service.record(
        actor_id="user-456",
        event_type=AuditEventType.CONSENT_ACKNOWLEDGED,
        metadata={"ipAddress": "127.0.0.1"},
    )

    assert login_event.id != consent_event.id

    records = compliance.all()
    assert [record["event_type"] for record in records] == ["AUTH_LOGIN", "CONSENT_ACKNOWLEDGED"]

    consent_metadata = json.loads(records[1]["metadata"] or "{}")
    assert consent_metadata == {"ipAddress": "127.0.0.1"}

    contents = compliance_path.read_text().splitlines()
    assert "AUTH_LOGIN" in contents[1]
    assert "CONSENT_ACKNOWLEDGED" in contents[2]
