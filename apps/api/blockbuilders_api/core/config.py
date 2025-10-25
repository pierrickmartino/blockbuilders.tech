"""Application configuration powered by environment variables."""

from pathlib import Path

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)

    supabase_url: AnyHttpUrl = Field(default="https://localhost", alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(default="local-service-key", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(default="local-secret", alias="SUPABASE_JWT_SECRET")
    supabase_api_audience: str = Field(default="authenticated", alias="SUPABASE_API_AUDIENCE")
    datadog_log_endpoint: AnyHttpUrl | None = Field(default="http://127.0.0.1:8282/logs", alias="DATADOG_LOG_ENDPOINT")
    datadog_api_key: str | None = Field(default=None, alias="DATADOG_API_KEY")
    compliance_export_path: Path = Field(default=Path("docs/ops/audit-log-sample.csv"), alias="COMPLIANCE_EXPORT_PATH")
    notification_channel: str | None = Field(default=None, alias="NOTIFICATION_CHANNEL")


settings = Settings()  # type: ignore[call-arg]
