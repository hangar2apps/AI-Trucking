# A-TMS — Backend

**A-TMS (AI Transportation Management System)** is the Claude-powered product
that autonomously runs a trucking company. The in-world carrier it operates is
**Aurora Freight** (the name customers see on their emails).

FastAPI + SQLAlchemy + Claude. The data model for a fully AI-run carrier, plus
the first AI vertical: **read a load → draft a customer status email**.

## Stack

- **FastAPI** API, **SQLAlchemy 2.0** ORM
- **Database**: defaults to SQLite (zero setup) — set `DATABASE_URL` to a
  `postgresql+psycopg://...` URL for the production Postgres target.
- **Claude**: Opus 4.8 for reasoning (`REASONING_MODEL`), Sonnet 4.6 for emails
  (`EMAIL_MODEL`). The email agent uses **structured outputs**, so drafts come
  back as a validated `EmailDraft` (subject / body / internal summary).

## Run it

```bash
cd backend
cp .env.example .env          # add your ANTHROPIC_API_KEY
uv sync
uv run uvicorn app.main:app --reload
```

Tables are created and demo data is seeded on startup. Docs at
`http://localhost:8000/docs`.

## Data model

- **Customer** — shipper contact (name, company, email).
- **Truck** — `name`, `driver_name`, `status` (available / en_route /
  maintenance / offline), live `current_lat`/`current_lng`, capacity.
- **Load** — a shipment: reference, customer, optional assigned truck, origin &
  destination (name + lat/lng), `pickup_at` / `deliver_by` / `eta`, `status`
  (pending / assigned / in_transit / delayed / delivered / cancelled).

The seed builds the demo scenario: **LD-1042** (Dallas → Houston) is running
~1h45 late on Truck 17, with **Truck 23** sitting *available* near the lane —
the setup for the climax (AI emails the customer + reassigns the backup, map
animates the reroute).

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET  | `/health` | Status + which models/key are configured |
| GET  | `/loads` | List loads |
| GET  | `/loads/{id}` | Load detail (with customer + truck) |
| POST | `/loads/{id}/draft-email` | **AI**: draft a status email for the load |
| GET  | `/trucks` | List fleet |
| GET  | `/customers` | List customers |

### Try the AI vertical

```bash
# via the API
curl -X POST localhost:8000/loads/1/draft-email | jq

# or standalone, prints the email to your terminal
uv run python scripts/smoke_email.py LD-1042
```

## Where this grows next

The email agent (`app/agent/email_agent.py`) is the de-risked core. From here:
1. Give the agent **tools** (look up loads, find available trucks, reassign,
   send email) and let Opus 4.8 reason over fleet state.
2. A "detect late truck → email customer → reassign backup" action that drives
   the demo climax and emits the reroute the 3D map animates.
