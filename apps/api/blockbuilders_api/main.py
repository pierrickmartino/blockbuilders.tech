"""FastAPI application entrypoint."""

from fastapi import FastAPI

from .core.config import settings
from .repositories.compliance import ComplianceRepository
from .routers import auth, plan_usage, strategies
from .services.audit import AuditService
from .services.datadog import DatadogLogClient
from .services.notifications import NotificationService


def create_app() -> FastAPI:
    """Configure FastAPI application with routers and services."""
    app = FastAPI(title="BlockBuilders API", version="0.1.0")

    datadog_client = DatadogLogClient(
        endpoint=str(settings.datadog_log_endpoint) if settings.datadog_log_endpoint else None,
        api_key=settings.datadog_api_key,
    )
    compliance_repo = ComplianceRepository(export_path=settings.compliance_export_path)
    notification_service = NotificationService(channel=settings.notification_channel or "audit-alerts")

    audit_service = AuditService(
        datadog=datadog_client,
        compliance=compliance_repo,
        notifications=notification_service,
    )
    app.dependency_overrides[AuditService] = lambda: audit_service

    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(plan_usage.router, prefix="/api/v1")
    app.include_router(strategies.router, prefix="/api/v1")

    @app.get("/healthz", tags=["health"])
    def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
