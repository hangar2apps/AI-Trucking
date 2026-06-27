# A-TMS — Build Plan

**A-TMS (AI Transportation Management System)** — a Claude-powered product that
autonomously runs a trucking company. In-world carrier: **Aurora Freight**.

This is the build plan and cross-team contract. The pitch, demo narrative, and
team mapping live in the root [`README.md`](../README.md).

Status legend: ✅ done · 🟡 in progress · ⬜ not started

---

## Strategy

Build inside-out from the AI brain. De-risk the agent first (read a load →
draft an email — done), then grow tools outward until the brain can run the
whole "late truck → email → reassign" sequence autonomously. Everything else
(3D map, route engine, dashboards) is supporting cast that plugs into the
agent's tool contract.

---

## Phases

### Phase 0 — Backend foundation ✅
- ✅ Data model: `Customer`, `Truck`, `Load` (`backend/app/models.py`)
- ✅ DB layer, SQLite default / Postgres-ready via `DATABASE_URL`
- ✅ Seed scenario: **LD-1042** Dallas→Houston ~1h45 late on Truck 17, with
  **Truck 23** available near the lane (the climax setup)
- ✅ REST: `/loads`, `/loads/{id}`, `/trucks`, `/customers`, `/health`
- ✅ A-TMS branding

### Phase 1 — Thinnest AI vertical ✅
- ✅ `draft_status_email(load)` — Sonnet 4.6, structured output → validated
  `EmailDraft` (`backend/app/agent/email_agent.py`)
- ✅ `POST /loads/{id}/draft-email`
- ✅ **Live-tested end to end** — `POST /loads/1/draft-email` verified against
  Supabase + the real key: reads LD-1042, returns a grounded delay email.

### Phase 1.5 — Supabase as source of truth ✅
- ✅ `sql/seed_supabase.sql` run in Supabase (3 customers / 4 trucks / 3 loads)
- ✅ `DATABASE_URL` on the **Session pooler** string (`postgresql+psycopg://`)
- ✅ App `create_all`/`seed` gated to local SQLite only; Postgres is authoritative

### Phase 2 — The agent brain (Opus 4.8 + tools) ✅ (first cut)
The operations brain: Claude with tool use, reasoning over fleet state. See the
**Tool contract** below — this is what the route and 3D devs build against.
- ✅ Manual agentic loop on Opus 4.8, adaptive thinking, `dry_run` gating,
  transcript capture (`backend/app/agent/brain.py`)
- ✅ Read tools: `get_loads`, `get_trucks`, `compute_eta`
- ✅ Side-effecting tools (gated by `dry_run`): `reassign_load`,
  `send_customer_email` (records intent; real send is Phase 3)
- 🟡 `check_weather_route`, `get_driver_hours` — **stubs** present; swap for the
  route dev's engine / a real HOS source (contract is locked)
- ✅ `POST /agent/run` — situation in, final message + step transcript out
- ✅ Verified: dry-run sweep autonomously found LD-1042, vetted Truck 23
  (ETA/capacity/HOS/route), planned the reassign + customer email

### Phase 3 — The hero action ✅
The autonomous sequence that is the demo climax.
- ✅ Brain runs the full sequence via `POST /agent/run` (`dry_run=false`):
  detects the slip → reassigns to a vetted truck → emails the customer.
  **Verified live**: committed LD-1042 → Truck 23 in Supabase + sent the email.
- ✅ `send_customer_email` wired to **Resend** (real delivery; `DEMO_EMAIL_TO`
  routes demo mail to one real inbox since seed addresses are fake).
- ✅ **Events feed** (`events` table + `GET /events`): the agent logs a
  `reassignment` event (with from/to truck ids + destination) and an
  `email_sent` event. The map polls this to animate the reroute.
- Demo reset: re-run `sql/seed_supabase.sql` (drops + reseeds) to replay live.

### Phase 4 — Simulation & inbound 🟡
- ✅ Simulation loop (`app/sim.py`): en_route trucks advance toward their
  destination each tick and deliver on arrival (logs a `delivered` event); a
  truck on a `delayed` load stays stalled in the incident. Drive via
  `POST /sim/tick` or the background loop (`POST /sim/start` / `/stop`,
  `GET /sim/status`). Verified: stalled Truck 17 → reassign → Truck 23 races
  to Houston and delivers; LD-1043 delivers to Austin en route.
- ⬜ Inbound email → agent reads → auto-replies with status
- ⬜ Incident injection (weather/closure) — pairs with the route engine

### Phase 5 — Frontend & integrations ⬜ (parallel, other devs)
- ⬜ React dashboards: owner / CS / fleet
- ⬜ 3D live tracking map (Mapbox) — consumes `/trucks` + reassignment events
- ⬜ Weather/route engine exposed as the `check_weather_route` tool

---

## Tool contract (the cross-team interface)

These are the Claude tool definitions the agent calls. Read tools are
parallel-safe; side-effecting tools are gated (the agent proposes, the harness
may require confirmation). **Route dev owns `check_weather_route`; everyone
else builds against these shapes.**

| Tool | Kind | Input | Output |
|---|---|---|---|
| `get_loads` | read | `status?`, `late_only?` | list of loads (ref, lane, eta, deliver_by, status, truck) |
| `get_trucks` | read | `status?`, `near?{lat,lng,radius_mi}` | list of trucks (name, driver, status, lat/lng, capacity) |
| `get_driver_hours` | read | `truck_id` | remaining hours-of-service for the driver |
| `compute_eta` | read | `truck_id`, `dest_lat`, `dest_lng` | eta timestamp |
| `check_weather_route` | read | `origin{lat,lng}`, `dest{lat,lng}` | route conditions, delays, incidents *(route dev's engine)* |
| `reassign_load` | **side-effect** | `load_id`, `new_truck_id` | updated load; frees old truck, assigns new |
| `send_customer_email` | **side-effect** | `load_id`, `subject`, `body` | send result *(Resend)* |

The existing `draft_status_email` becomes the body of `send_customer_email`
(draft → send), so Phase 1 work carries straight into the agent.

---

## Integration: the reroute event (backend → map)

✅ **Built** — `GET /events`. The map renders in **2D** (Mapbox); this is
render-agnostic, so nothing here changes for 2D vs 3D.

**Polling contract for the map / CS dashboard:**
- `GET /events?since_id=<last seen id>` → new events, ascending. Append them.
- On a `reassignment` event, animate the reroute: `data` carries
  `from_truck_id`, `to_truck_id`, `to_truck`, and `destination {lat,lng}`.
  Look up live positions from `GET /trucks`.
- On an `email_sent` event, pop the customer-notification card.

Truck positions still come from `GET /trucks` (poll every ~2s). The events feed
is the "something just happened" signal layered on top.

---

## Demo-day checklist (climax → code)

The ~60s hero moment and what produces each beat:

| Beat | Produced by | Status |
|---|---|---|
| 1. Trucks moving live on the map (2D) | ✅ sim loop + `/trucks`; map dev renders | backend ✅ |
| 2. Weather/incident hits a route | route engine + `check_weather_route` | ⬜ |
| 3. AI detects late truck → emails customer | ✅ Phase 3 hero action + Resend | backend ✅ |
| 4. AI finds Truck 23, executes handoff | ✅ `reassign_load` | backend ✅ |
| 5. Map animates reroute; email on screen | ✅ `/events` feed → map + CS dashboard | backend ✅ |

Seed data already stages beats 3–4 (LD-1042 late, Truck 23 ready).

---

## Stack reference

- Backend: FastAPI + SQLAlchemy, Postgres (Supabase) / SQLite for local
- AI: **Opus 4.8** reasoning, **Sonnet 4.6** emails (configurable in `.env`)
- Email: Resend · Map: Mapbox · Frontend: React + Tailwind

## Immediate next steps
1. ✅ Brain confirmed live (email vertical works against Supabase).
2. Build the Phase 2 agent loop (Opus 4.8) with the read tools + `reassign_load`.
3. Lock the tool contract above with the route & 3D devs so they build in parallel.
4. Wire `send_customer_email` to Resend (`RESEND_API_KEY` already in `.env`).
