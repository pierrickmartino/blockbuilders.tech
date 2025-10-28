"""Application configuration powered by environment variables."""

import json
from pathlib import Path
from typing import Any

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, DotEnvSettingsSource, SettingsConfigDict


def _resolve_env_file() -> Path:
    """Locate the project .env file regardless of current working directory."""

    for directory in Path(__file__).resolve().parents:
        candidate = directory / ".env"
        if candidate.exists():
            return candidate
    return Path(".env")


class FlexibleDotEnvSettingsSource(DotEnvSettingsSource):
    """Dotenv loader that tolerates non-JSON values for complex fields."""

    def decode_complex_value(self, field_name: str, field: Any, value: str) -> Any:
        try:
            return super().decode_complex_value(field_name, field, value)
        except json.JSONDecodeError:
            return value


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_resolve_env_file(),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    supabase_url: AnyHttpUrl = Field(default="https://localhost", alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(default="local-service-key", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(default="local-secret", alias="SUPABASE_JWT_SECRET")
    supabase_api_audience: str = Field(default="authenticated", alias="SUPABASE_API_AUDIENCE")
    supabase_http_timeout_seconds: float = Field(default=1.0, alias="SUPABASE_HTTP_TIMEOUT_SECONDS")
    supabase_metadata_cache_path: Path | None = Field(
        default=Path(".ai/supabase-metadata-cache.json"),
        alias="SUPABASE_METADATA_CACHE_PATH",
    )
    datadog_log_endpoint: AnyHttpUrl | None = Field(default="http://127.0.0.1:8282/logs", alias="DATADOG_LOG_ENDPOINT")
    datadog_api_key: str | None = Field(default=None, alias="DATADOG_API_KEY")
    compliance_export_path: Path = Field(default=Path("docs/ops/audit-log-sample.csv"), alias="COMPLIANCE_EXPORT_PATH")
    notification_channel: str | None = Field(default=None, alias="NOTIFICATION_CHANNEL")
    cors_allow_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://127.0.0.1:3000"],
        alias="CORS_ALLOW_ORIGINS",
    )

    @field_validator("cors_allow_origins", mode="before")
    @classmethod
    def _parse_cors_allow_origins(cls, value: Any) -> list[str] | Any:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls,
        init_settings,
        env_settings,
        dotenv_settings,
        file_secret_settings,
    ):
        """Ensure dotenv loader tolerates comma-separated lists."""

        config = settings_cls.model_config
        custom_dotenv = FlexibleDotEnvSettingsSource(
            settings_cls,
            env_file=config.get("env_file"),
            env_file_encoding=config.get("env_file_encoding"),
            case_sensitive=config.get("case_sensitive"),
            env_prefix=config.get("env_prefix"),
            env_nested_delimiter=config.get("env_nested_delimiter"),
            env_nested_max_split=config.get("env_nested_max_split"),
            env_ignore_empty=config.get("env_ignore_empty"),
            env_parse_none_str=config.get("env_parse_none_str"),
            env_parse_enums=config.get("env_parse_enums"),
        )
        return init_settings, env_settings, custom_dotenv, file_secret_settings


settings = Settings()  # type: ignore[call-arg]
