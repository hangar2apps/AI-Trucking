# A-TMS — How to Demo

A ~2-minute runbook for the autonomous-operations demo.

## Setup (once)

```bash
# Terminal 1 — backend
cd backend && uv run uvicorn app.main:app --reload      # http://localhost:8000

# Terminal 2 — frontend
cd frontend && npm run dev                              # http://localhost:3000
```

In `backend/.env`, set `DEMO_EMAIL_TO=hangar2apps@gmail.com` so the AI's customer
email actually lands in an inbox you can show on screen.

**Reset to a clean demo state** (do this before every run): paste
`backend/sql/seed_supabase.sql` into the Supabase SQL editor and run it. This
stages LD-1042 (Dallas→Houston) on Truck 17, who is **out of legal driving hours**
with a **storm on I-45**, and Truck 23 sitting fresh nearby.

## The story (what to say)

> "This is one AI running a trucking company. It's watching every load. Load
> 1042 is about to miss its delivery window — the driver is out of legal hours
> and there's a storm on the route. Watch: the AI notices before the customer
> does, reroutes, hands the load to a backup truck, and emails the customer a new
> ETA — autonomously."

## The run

1. **Show the dashboard** — `http://localhost:3000` → **Log in** → Dashboard.
   Point out LD-1042 **at risk** on the Loads screen, Truck 23 available.
2. **Trigger the AI** (the hero moment). Either:
   - Swagger: `http://localhost:8000/docs` → `POST /monitor/tick` → Execute, **or**
   - Terminal: `curl -X POST http://localhost:8000/monitor/tick | jq`
3. **Show what it did** (all live):
   - The **email** lands in `hangar2apps@gmail.com` — proactive new ETA.
   - **Dashboard → AI activity** shows `delay_detected` → `reassignment` → `email_sent`.
   - **Loads screen**: LD-1042 is now on **Truck 23**, no longer at risk.
   - Or via API: `curl "http://localhost:8000/events?since_id=0" | jq`
4. **(Optional) Live motion** — go to the **Map** screen, click **Start motion**
   (or `POST /sim/start`). Truck 23 drives to Houston and delivers → a **delivery
   email** fires.

## Notes
- Default **test mode** (`ai_test_mode=True`) → templated emails, **no Anthropic
  cost** — safe to rehearse repeatedly. Flip to `false` for real Claude-drafted
  emails.
- Each run emails once (debounced). Re-run the seed SQL to reset between takes.
- To run the loop hands-free instead of clicking: `POST /monitor/start` (assesses
  every `monitor_interval_seconds`, default 60s).
- Inject a fresh obstruction live: `POST /incidents` (see `docs/monitoring-flow.md`).
