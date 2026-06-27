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
    # Inbound address — set Reply-To on AI emails so replies land here (Resend inbound).
    ai_inbox_email: str = "onboarding@resend.dev"
    # Inbound mail is always auto-replied by AI; no human review step.
    inbound_auto_reply_enabled: bool = True
    # Block manual "click to send" email endpoints (loads / inquiry send).
    allow_manual_email: bool = False

    frontend_url: str = "http://localhost:3000"
    company_name: str = "Aurora Freight"
    product_name: str = "app"

    # Simulation: trucks advance toward their destination each tick.
    sim_interval_seconds: float = 3.0
    sim_speed_mph: float = 55.0
    sim_minutes_per_tick: float = 6.0

    reasoning_model: str = "claude-opus-4-8"
    email_model: str = "claude-sonnet-4-6"

    # Multi-capability agent: invoices above this auto-send limit are queued for
    # human approval instead of being emailed autonomously.
    invoice_approval_threshold: float = 5000.0
    # Internal recipients for damage / claims alerts (comma-separated ok).
    dispatcher_email: str = "dispatch@aurorafreight.example"
    claims_email: str = "claims@aurorafreight.example"


def get_settings() -> Settings:
    return Settings()
