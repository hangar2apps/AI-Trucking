from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App configuration, loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    database_url: str = "sqlite:///./ai_trucking.db"

    company_name: str = "Aurora Freight"
    product_name: str = "app"

    resend_api_key: str = ""
    from_email: str = "onboarding@resend.dev"
    frontend_url: str = "http://localhost:3000"

    # Opus 4.8 for the reasoning brain, Sonnet 4.6 for customer emails.
    reasoning_model: str = "claude-opus-4-8"
    email_model: str = "claude-sonnet-4-6"


@lru_cache
def get_settings() -> Settings:
    return Settings()
