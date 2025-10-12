"""Application configuration powered by environment variables."""

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True)

    supabase_url: AnyHttpUrl = Field(default="https://localhost", alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(default="local-service-key", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(default="local-secret", alias="SUPABASE_JWT_SECRET")
    supabase_api_audience: str = Field(default="authenticated", alias="SUPABASE_API_AUDIENCE")


settings = Settings()  # type: ignore[call-arg]
