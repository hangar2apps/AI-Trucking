"""Send transactional emails via Resend."""

from __future__ import annotations

import httpx

from app.config import get_settings


def send_survey_welcome_email(*, to_email: str) -> tuple[bool, str]:
    """Send a thank-you email after survey completion. Returns (sent, message)."""
    settings = get_settings()

    if not settings.resend_api_key:
        return False, "RESEND_API_KEY not configured — lead saved without email."

    product = settings.product_name
    demo_url = f"{settings.frontend_url.rstrip('/')}/demo"
    dashboard_url = f"{settings.frontend_url.rstrip('/')}/app"

    subject = f"Thanks for your interest in {product}"
    html = f"""
    <p>Hi there,</p>
    <p>Thanks for completing our survey. We're excited to show you how {product} helps fleets run smarter.</p>
    <p><strong>Next steps:</strong></p>
    <ul>
      <li><a href="{demo_url}">Take the interactive demo tour</a></li>
      <li><a href="{dashboard_url}">Explore the live dashboard</a></li>
    </ul>
    <p>We'll follow up soon with more details tailored to your fleet.</p>
    <p>— The {product} team</p>
    """

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.from_email,
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
            timeout=15.0,
        )
        if response.status_code in (200, 201):
            return True, f"Welcome email sent to {to_email}."
        return False, f"Resend error: {response.status_code} {response.text}"
    except httpx.HTTPError as exc:
        return False, f"Failed to send email: {exc}"
