from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    """App configuration, loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=_BACKEND_DIR / ".env", extra="ignore")

    anthropic_api_key: str = ""
    database_url: str = "sqlite:///./ai_trucking.db"

    # Email delivery (Resend). resend_from must be a verified sender; the
    # onboarding@resend.dev default only delivers to your Resend account email.
    resend_api_key: str = ""
    resend_from: str = "A-TMS (Aurora Freight) <onboarding@resend.dev>"
    from_email: str = "onboarding@resend.dev"
    # Seed customer addresses are fake. Set this to route all outbound mail to
    # one real inbox during demos; leave empty to use the customer's address.
    demo_email_to: str = ""

    frontend_url: str = "http://localhost:3000"
    company_name: str = "Aurora Freight"
    product_name: str = "app"

    # Simulation: trucks advance toward their destination each tick.
    sim_interval_seconds: float = 3.0
    sim_speed_mph: float = 55.0
    sim_minutes_per_tick: float = 6.0

    reasoning_model: str = "claude-opus-4-8"
    email_model: str = "claude-sonnet-4-6"


def get_settings() -> Settings:
    return Settings()
