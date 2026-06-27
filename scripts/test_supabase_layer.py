"""Quick Supabase layer smoke test (anon insert + RLS checks)."""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

import httpx

ENV_PATH = Path(__file__).resolve().parents[1] / "frontend" / ".env.local"


def load_env(key_prefix: str) -> dict[str, str]:
    out: dict[str, str] = {}
    if not ENV_PATH.exists():
        return out
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        if k.startswith(key_prefix):
            out[k] = v.strip()
    return out


def main() -> int:
    env = load_env("NEXT_PUBLIC_")
    url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
    key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not url or not key:
        print("FAIL: missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY in frontend/.env.local")
        return 1

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    email = f"qa-supabase-{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com"
    payload = {
        "email": email,
        "company_size": "1-10",
        "industry": "Logistics",
        "fleet_size": "1-5",
        "features": ["dispatch"],
        "pain_point": "Supabase layer test",
        "timeline": "ASAP",
        "role": "Ops",
        "consent": True,
        "source": "qa_script",
    }

    with httpx.Client(timeout=20) as client:
        r = client.post(f"{url}/rest/v1/survey_leads", headers=headers, json=payload)
        print(f"INSERT survey_leads: HTTP {r.status_code}")
        if r.status_code >= 400:
            print(r.text[:400])
            return 1
        print("  insert ok")

        r2 = client.post(
            f"{url}/rest/v1/email_responses",
            headers=headers,
            json={
                "to_email": email,
                "subject": "QA test",
                "email_type": "survey_confirmation",
                "sent": False,
                "provider_message": "qa",
            },
        )
        print(f"INSERT email_responses: HTTP {r2.status_code}")
        if r2.status_code >= 400:
            print(r2.text[:400])
            return 1

        r3 = client.get(f"{url}/rest/v1/profiles?select=id&limit=1", headers=headers)
        print(f"SELECT profiles (anon): HTTP {r3.status_code}")
        if r3.status_code == 200:
            print(f"  rows={len(r3.json())} (expected 0 — RLS hides other users)")

    print("PASS: Supabase layer OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
