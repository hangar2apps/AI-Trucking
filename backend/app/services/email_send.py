"""Send transactional emails via Resend."""

from __future__ import annotations

import html
import httpx

from app.config import get_settings
from app.schemas import SurveySubmit

# Human-readable labels for survey answer values
_INDUSTRY = {
    "transportation": "Transportation & Logistics",
    "construction": "Construction",
    "food": "Food & Beverage",
    "other": "Other",
}
_TIMELINE = {
    "now": "This month",
    "1-3": "1–3 months",
    "6+": "6+ months",
}
_ROLE = {
    "owner": "Owner / Executive",
    "ops": "Operations",
    "fleet": "Fleet Manager",
    "driver": "Driver",
}
_FEATURE = {
    "gps": "GPS",
    "eld": "ELD",
    "dash-cams": "Dash Cams",
    "maintenance": "Maintenance",
    "routing": "Routing",
    "other": "Other",
}


def _send_via_resend(*, to_email: str, subject: str, html_body: str) -> tuple[bool, str]:
    settings = get_settings()
    recipient = settings.demo_email_to.strip() or to_email

    if not settings.resend_api_key:
        return False, "RESEND_API_KEY not configured — saved without email."

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.resend_from,
                "to": [recipient],
                "subject": subject,
                "html": html_body,
            },
            timeout=15.0,
        )
        if response.status_code in (200, 201):
            msg = f"Email sent to {recipient}."
            if settings.demo_email_to.strip() and recipient != to_email:
                msg += f" (demo override; intended recipient {to_email})"
            return True, msg
        return False, f"Resend error: {response.status_code} {response.text}"
    except httpx.HTTPError as exc:
        return False, f"Failed to send email: {exc}"


def _text_to_html(text: str) -> str:
    escaped = html.escape(text)
    return f"<div style='font-family:sans-serif;line-height:1.6'>{escaped.replace(chr(10), '<br>')}</div>"


def _survey_rows(payload: SurveySubmit) -> list[tuple[str, str]]:
    features = ", ".join(_FEATURE.get(f, f) for f in payload.features) or "None selected"
    return [
        ("Company size", payload.company_size),
        ("Industry", _INDUSTRY.get(payload.industry, payload.industry)),
        ("Fleet size", payload.fleet_size),
        ("Features interested in", features),
        ("Biggest challenge", payload.pain_point),
        ("Current tools", payload.current_tools or "Not provided"),
        ("Timeline to adopt", _TIMELINE.get(payload.timeline, payload.timeline)),
        ("Your role", _ROLE.get(payload.role, payload.role)),
        ("Email", payload.email),
        ("Phone", payload.phone or "Not provided"),
    ]


def build_survey_response_html(payload: SurveySubmit) -> str:
    settings = get_settings()
    product = html.escape(settings.product_name)
    demo_url = html.escape(f"{settings.frontend_url.rstrip('/')}/demo")
    dashboard_url = html.escape(f"{settings.frontend_url.rstrip('/')}/app")

    rows_html = "".join(
        f"<tr><td style='padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#1A2B4A;width:40%'>{html.escape(q)}</td>"
        f"<td style='padding:8px 12px;border-bottom:1px solid #eee;color:#4B5563'>{html.escape(a)}</td></tr>"
        for q, a in _survey_rows(payload)
    )

    return f"""
    <div style="font-family:sans-serif;max-width:560px;color:#1A2B4A">
      <p>Hi there,</p>
      <p>Thanks for completing the {product} survey. Here is a copy of your responses:</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;border:1px solid #E5E7EB;border-radius:8px">
        {rows_html}
      </table>
      <p><strong>Explore next:</strong></p>
      <ul>
        <li><a href="{demo_url}">Take the interactive demo tour</a></li>
        <li><a href="{dashboard_url}">Open the live dashboard</a></li>
      </ul>
      <p>We'll follow up soon with more details tailored to your fleet.</p>
      <p>— The {product} team</p>
    </div>
    """


def send_survey_response_email(*, payload: SurveySubmit) -> tuple[bool, str]:
    """Email the survey Q&A summary to the address they submitted."""
    settings = get_settings()
    subject = f"Your {settings.product_name} survey responses"
    html_body = build_survey_response_html(payload)
    return _send_via_resend(to_email=payload.email.strip(), subject=subject, html_body=html_body)


def send_customer_email(*, to_email: str, subject: str, body: str) -> tuple[bool, str]:
    """Send a plain-text customer email (typically AI-drafted) via Resend."""
    html_body = _text_to_html(body)
    return _send_via_resend(to_email=to_email, subject=subject, html_body=html_body)


# Backwards-compatible alias
def send_survey_welcome_email(*, to_email: str) -> tuple[bool, str]:
    """Deprecated: use send_survey_response_email with full payload."""
    settings = get_settings()
    if not settings.resend_api_key:
        return False, "RESEND_API_KEY not configured — lead saved without email."
    product = settings.product_name
    demo_url = f"{settings.frontend_url.rstrip('/')}/demo"
    dashboard_url = f"{settings.frontend_url.rstrip('/')}/app"
    subject = f"Thanks for your interest in {product}"
    html_body = f"""
    <p>Hi there,</p>
    <p>Thanks for completing our survey.</p>
    <ul>
      <li><a href="{demo_url}">Take the interactive demo tour</a></li>
      <li><a href="{dashboard_url}">Explore the live dashboard</a></li>
    </ul>
    """
    return _send_via_resend(to_email=to_email, subject=subject, html_body=html_body)
