"""Fetch real inbound email content from Resend after the webhook fires.

Resend `email.received` webhooks include only metadata (from, subject, attachment
names) — NOT the body or file bytes. Production flow:

  1. Customer emails AI_INBOX_EMAIL (or replies to an AI-sent email)
  2. Resend POSTs to POST /assistant/inbound/webhook
  3. We call Resend Receiving API with the email_id from the webhook
  4. Download attachment bytes, then run document / image / comms agents

See: https://resend.com/docs/dashboard/receiving/get-email-content
"""

from __future__ import annotations

import base64
import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

_RESEND_BASE = "https://api.resend.com"


def _auth_headers() -> dict[str, str]:
    settings = get_settings()
    return {"Authorization": f"Bearer {settings.resend_api_key}"}


def fetch_received_email_body(email_id: str) -> tuple[str, str]:
    """Return (plain_text, html) for a received email."""
    settings = get_settings()
    if not settings.resend_api_key:
        return "", ""

    try:
        resp = httpx.get(
            f"{_RESEND_BASE}/emails/receiving/{email_id}",
            headers=_auth_headers(),
            timeout=30.0,
        )
    except httpx.HTTPError as exc:
        logger.warning("Resend get received email failed: %s", exc)
        return "", ""

    if resp.status_code >= 400:
        logger.warning("Resend get received email %s: %s", resp.status_code, resp.text)
        return "", ""

    data = resp.json()
    text = str(data.get("text") or "")
    html = str(data.get("html") or "")
    return text, html


def fetch_received_attachments(email_id: str) -> list[dict[str, Any]]:
    """List attachments and download their bytes for agent processing."""
    settings = get_settings()
    if not settings.resend_api_key:
        return []

    try:
        resp = httpx.get(
            f"{_RESEND_BASE}/emails/receiving/{email_id}/attachments",
            headers=_auth_headers(),
            timeout=30.0,
        )
    except httpx.HTTPError as exc:
        logger.warning("Resend list attachments failed: %s", exc)
        return []

    if resp.status_code >= 400:
        logger.warning("Resend list attachments %s: %s", resp.status_code, resp.text)
        return []

    payload = resp.json()
    items = payload.get("data") if isinstance(payload, dict) else payload
    if not isinstance(items, list):
        return []

    attachments: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        download_url = item.get("download_url")
        filename = str(item.get("filename") or "attachment")
        content_type = str(item.get("content_type") or "application/octet-stream")
        if not download_url:
            continue
        try:
            file_resp = httpx.get(str(download_url), timeout=60.0, follow_redirects=True)
        except httpx.HTTPError as exc:
            logger.warning("Download attachment %s failed: %s", filename, exc)
            continue
        if file_resp.status_code >= 400:
            logger.warning("Download attachment %s: %s", filename, file_resp.status_code)
            continue
        attachments.append(
            {
                "filename": filename,
                "content_type": content_type,
                "content": base64.b64encode(file_resp.content).decode("ascii"),
            }
        )
    return attachments


def enrich_inbound_from_resend(parsed: dict[str, Any]) -> dict[str, Any]:
    """Fill in body + attachment bytes from Resend when webhook only had metadata."""
    email_id = str(parsed.get("email_id") or "").strip()
    if not email_id:
        return parsed

    enriched = dict(parsed)
    text, html = fetch_received_email_body(email_id)
    if text.strip():
        enriched["body"] = text
    elif html.strip() and not str(enriched.get("body") or "").strip():
        enriched["body"] = html

    fetched = fetch_received_attachments(email_id)
    if fetched:
        enriched["attachments"] = fetched

    enriched["resend_email_id"] = email_id
    return enriched
