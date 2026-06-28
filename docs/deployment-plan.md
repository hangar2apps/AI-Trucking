# A-TMS — Deployment Plan (public demo)

Goal: a URL others can open, watch the autonomous reroute, and reset the demo
themselves. Cheap, low-maintenance, no Anthropic/Resend spend.

## Architecture

| Piece | Host | Why |
|-------|------|-----|
| Frontend (Next.js) | **Vercel** | native Next.js, free, your usual stack |
| Backend (FastAPI) | **Render** (or Railway / Fly) | needs a long-running process for the sim/monitor asyncio loops + in-memory state — **cannot** be Vercel serverless |
| Database | **Supabase** (existing) | already the source of truth |

Frontend → calls backend via `NEXT_PUBLIC_API_URL`. Backend → Supabase via
`DATABASE_URL`. CORS already allows all origins.

## 1. Backend → Render

Add a `Dockerfile` (cleanest, since the repo uses `uv`):

```dockerfile
FROM python:3.12-slim
RUN pip install uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY . .
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Render service settings:
- Root directory: `backend`
- Instance: **1** (state + loops are global — do NOT scale to multiple instances)
- Env vars:
  - `DATABASE_URL` = Supabase **pooler** connstring, e.g.
    `postgresql+psycopg://postgres.<ref>:<pwd>@aws-0-<region>.pooler.supabase.com:5432/postgres`
    (use the pooler host, not `db.<ref>.supabase.co` — many hosts can't reach the direct IPv6 endpoint)
  - `AI_TEST_MODE` = `true` → **zero Anthropic spend** (deterministic reasoning + templated emails)
  - **Leave `RESEND_API_KEY` unset** → no emails sent by random visitors (also sidesteps the email-volume item)
- Cold start caveat: Render free tier sleeps after ~15 min idle (~30–60s wake). Railway/Fly stay warm if you want snappier (small cost).

## 2. Frontend → Vercel

- Root directory: `frontend`
- Env vars:
  - `NEXT_PUBLIC_API_URL` = the Render backend URL
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_DEMO_OPERATIONS_EMAILS` = the demo login email(s)

## 3. Auth for visitors

`/app/*` is gated by Supabase login + an operations email allowlist. Simplest for
a public demo: **one shared demo account.**
- Create `demo@hangar2apps.com` (Supabase Auth) with a password.
- Add that email to `NEXT_PUBLIC_DEMO_OPERATIONS_EMAILS`.
- Share the URL + creds. (Landing page stays public; only the app needs login.)

## 4. Reseed button (the ask)

The seed is `now()`-relative and visitors mutate shared state (motion delivers
loads, Run AI reroutes), so a one-click reset is needed.

**Backend:** `POST /demo/reset`
- Clears demo rows (events → loads → incidents → trucks → customers, FK order)
  and re-runs `seed()` with fresh timestamps. (Keeps schema/types — lighter than
  re-running `seed_supabase.sql`.)
- Optional light guard: require a `X-Demo-Token` header matching an env var so
  bots can't hammer it. For a hackathon, open is acceptable.

**Frontend:** a **"Reset demo"** button in the map control bar (next to Run AI).
On click → `POST /demo/reset`, clear the local `reroutedLoads` state, refetch.
Returns the map to the clean "straight red line through the storm" state.

## 5. Demo hygiene / known limits

- **Shared state:** all visitors share one Supabase DB — concurrent users interfere.
  The reset button recovers it. (Per-session isolation is out of scope.)
- **Loops off by default:** don't auto-start sim/monitor on the server; rely on the
  manual Start motion / Run AI buttons so the map doesn't drain for everyone.
- **Optional:** a cron (Render cron / Supabase scheduled fn) hitting `/demo/reset`
  hourly keeps it fresh without anyone clicking.

## Build/Deploy checklist

- [ ] Add `backend/Dockerfile`
- [ ] Add `POST /demo/reset` + force-reseed helper
- [ ] Add "Reset demo" button in `LiveMap`
- [ ] Render: deploy backend, set env, confirm `/health` + `/trucks`
- [ ] Create Supabase demo user, add to allowlist
- [ ] Vercel: deploy frontend, set env, point `NEXT_PUBLIC_API_URL` at Render
- [ ] Smoke test: login → map → Run AI → reroute → Reset demo
