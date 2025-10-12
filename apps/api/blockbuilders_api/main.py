"""FastAPI application entrypoint."""

from fastapi import FastAPI

from .routers import auth, strategies
from .services.audit import AuditService


def create_app() -> FastAPI:
    """Configure FastAPI application with routers and services."""
    app = FastAPI(title="BlockBuilders API", version="0.1.0")

    audit_service = AuditService()
    app.dependency_overrides[AuditService] = lambda: audit_service

    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(strategies.router, prefix="/api/v1")

    @app.get("/healthz", tags=["health"])
    def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
