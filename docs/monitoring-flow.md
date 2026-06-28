# A-TMS — Autonomous Monitoring Flow (Plan)

## Context

This is the product's core: a scheduled loop that monitors every load,
predicts whether it will deliver on time (accounting for **distance**, **DOT
driver hours**, and **route obstructions**), and acts — rerouting, reassigning,
and **proactively emailing the customer** before they ever notice a problem.

Today everything is on-demand (`POST /agent/run`). This flow makes A-TMS run
**itself**.

### Decisions locked (from review)
1. **Deterministic monitor; Claude only writes emails.** All ETA/HOS/obstruction
   math is plain Python (free, runs every cycle). Claude (Sonnet 4.6) only drafts
   customer emails. **Test mode** swaps drafting for templates → **$0 Anthropic**.
2. **The loop auto-reassigns.** When a reroute or the driver's legal hours can't
   save the delivery, the loop finds a capable backup truck and reassigns it.
3. **Core DOT HOS rules:** 11-hour driving limit, 14-hour on-duty window, 30-min
   break after 8 hours driving. (No 60/70 cycle for now.)
4. **Seedable `incidents` table** for obstructions; the monitor checks if a
   load's route crosses one and reroutes. Contract matches the control-center
   shape so the route dev feeds real data later.
- Driving speed for ETA: **55 mph** (standardize; `compute_eta` currently uses 50).

---

## Status: ✅ IMPLEMENTED & VERIFIED (core loop)

Shipped and tested end-to-end against Supabase (one `monitor.tick()`):
- Detected LD-1042 going late (driver out of HOS + I-45 storm), **auto-reassigned
  to Truck 23**, sent the proactive customer email (templated, **$0 Anthropic** in
  test mode), logged `reassignment` + `delay_detected` + `email_sent` events, and
  **debounced** (second tick = no-op). Delivery emails fire on arrival.
- New: `app/clock.py` (UTC fix), `app/monitor/{hos,routing,dispatch,notify,service}.py`,
  `app/routers/monitor.py`, HOS fields + `incidents` table + load flags, sim HOS depletion.

**Run it:**
```
POST /monitor/tick           # one assessment pass (demo control)
POST /monitor/start | /stop  # background loop (every monitor_interval_seconds)
GET  /monitor/status
GET  /incidents · POST /incidents · POST /incidents/{id}/clear   # inject/clear obstructions
```
Test mode is `ai_test_mode=True` by default (no Claude). Set `DEMO_EMAIL_TO` to see
the email land. Reset the demo with `sql/seed_supabase.sql`.

**Not yet built (follow-ups):** the UI "Run/Start monitor" controls + incident
injection button, and the inbound-email agent (still noted below).

---

## Architecture

Two background loops, cleanly separated:

| Loop | Owns | Cadence |
|---|---|---|
| **Simulator** (exists, `app/sim.py`) | The *world*: truck positions, **HOS depletion**, deliveries | every ~3s |
| **Monitor** (new, `app/monitor/`) | The *AI ops*: assess each load, reroute, reassign, notify | every ~60s (configurable) |

The monitor **reads** what the sim writes (positions, HOS) and **owns**
`load.eta` + status transitions + customer notifications. Claude is touched only
inside the notification layer.

```
Monitor.tick()  (deterministic)
  for each active load:
    1. distance = haversine(truck.pos → dest)
    2. obstruction = check_route_obstructions(route, incidents)
         └─ if hit: alternate = find_alternate_route(...)  → adjusted distance + delay
    3. eta = hos_aware_eta(distance, truck.HOS, 55mph)   # inserts breaks / 10h reset
    4. load.eta = eta;  on_time = eta <= deliver_by
    5. if late:
         a. reroute already applied above
         b. still late OR driver out of hours →
              backup = find_backup_truck(load)   # available, near, capacity, HOS-feasible
              if backup: reassign_load(load, backup)   # auto-reassign (decision 2)
         c. notify_customer(load, "delay" | "recovered")   # email
       if delivered (by sim): notify_customer(load, "delivered")
```

---

## Components to build

### 1. Data model (`app/models.py` + `sql/seed_supabase.sql` + `app/seed.py`)
- **Truck — add HOS fields** (decremented by the sim as the truck drives):
  - `hos_drive_remaining: float` (of 11) · `hos_duty_remaining: float` (of 14) ·
    `hos_since_break: float` (driving hours since last 30-min break)
- **Load — add debounce flags** (so we email once, not every minute):
  - `delay_notified: bool` · `delivered_notified: bool`
- **New `incidents` table:** `id, kind (weather|accident|disaster), summary,
  center_lat, center_lng, radius_mi, severity (watch|warning|severe),
  eta_impact_minutes, active, created_at`.
- Seed: HOS values per truck (Truck 17 low on hours to demo the HOS path); one
  active incident on the Dallas→Houston lane (I-45 storm) so the reroute beat is real.

### 2. Config (`app/config.py`)
- `monitor_interval_seconds: float = 60.0`
- `ai_test_mode: bool = True` (default ON → no accidental Anthropic spend)
- `driving_speed_mph: float = 55.0`
- HOS constants (module-level): drive limit 11, duty 14, break-after 8, break 30 min, reset 10 h.

### 3. HOS engine (`app/monitor/hos.py`)
- `hos_aware_eta(distance_mi, drive_rem, duty_rem, since_break, speed) -> (hours, needs_reset, breaks)`:
  walks the drive time, inserting a 30-min break at 8 cumulative driving hours and
  a 10-hour reset when the 11-hour driving limit or 14-hour window is exhausted.
- `can_make_it(distance, hos, deliver_by) -> bool`.

### 4. Routing / obstructions (`app/monitor/routing.py`)
- `check_route_obstructions(origin, dest, incidents) -> {hit: bool, incidents: [...], eta_impact_min}`
  — samples points along the straight-line route, flags incidents whose center is
  within `radius_mi` (reuse `_haversine_mi`).
- `find_alternate_route(origin, dest, blocked) -> {distance_mi, eta_impact_min, summary}`
  — demo model: a detour that avoids the incident (distance × detour factor, reduced
  delay). Returns the control-center contract shape (`[lng,lat]`-ready) for the route dev.

### 5. Backup-truck finder (`app/monitor/dispatch.py`)
- `find_backup_truck(db, load) -> Truck | None` — available trucks, capacity ≥ weight,
  HOS-feasible to beat `deliver_by`, nearest to the load. Reuses `get_trucks` logic.

### 6. Notification layer (`app/monitor/notify.py`)
- `notify_customer(db, load, kind, context, test_mode)` — `kind ∈ {delay, recovered, delivered}`.
  - **test_mode:** build a templated subject/body (no Claude).
  - **production:** `draft_status_email(load)` (Sonnet 4.6) for delay/recovered; a delivery
    template (or Sonnet) for delivered.
  - Sends via the existing `_send_customer_email` path (Resend + `demo_email_to` + event log).
  - Debounced via the Load flags; logs a `delay_detected` / `email_sent` event.

### 7. Monitor service (`app/monitor/service.py`)
- A `Monitor` class mirroring `Simulator` (background `asyncio` loop, `threading.Lock`,
  `start/stop/status/tick`). `tick()` runs one assessment pass (the algorithm above).

### 8. Sim changes (`app/sim.py`)
- **Decrement HOS** each tick as trucks drive (apply 30-min break / 10-h reset).
- **Stop writing `load.eta`** (the monitor owns ETA now); keep position + delivery.

### 9. Endpoints (`app/routers/monitor.py`, wired in `app/main.py`)
- `POST /monitor/tick` · `POST /monitor/start` · `POST /monitor/stop` · `GET /monitor/status`
- `GET /incidents` · `POST /incidents` (inject) · `POST /incidents/{id}/clear` — **incident injection** for the demo.
- Surface `ai_test_mode` in `/health`.

### 10. Inbound email agent — NOTED, not built yet
A separate agent must **monitor an inbox and answer load-tracking emails**
("where's my load?"). Open question: inbound mechanism — **Gmail API polling**
(`hangar2apps@gmail.com`) vs. an email-service inbound webhook. Scaffold
`app/monitor/inbound.py` with the contract + a TODO; design in a follow-up.

---

## Test mode (no Anthropic credits)
- `ai_test_mode=True` (default): monitor runs full logic for free; notifications use
  templated emails. Real Resend delivery still works (to `demo_email_to`) so you can
  see them — just no Claude drafting. Flip to `False` for real Sonnet-drafted emails.

## Build order
1. **Foundation** — config + model fields + `incidents` table + seed + apply to Supabase.
2. **Engines** — `hos.py`, `routing.py`, `dispatch.py` (pure functions, unit-checkable).
3. **Notify** — `notify.py` with templated + Sonnet paths.
4. **Monitor service + endpoints**; sim HOS depletion + ETA handoff.
5. **Verify** end-to-end (below), tune the seed so the demo beats fire.
6. Inbound-email agent (follow-up) + delivery-notification polish.

## Verification
- Unit-check the pure engines: `hos_aware_eta` (inserts break/reset correctly),
  `check_route_obstructions` (incident hit/miss), `find_backup_truck`.
- `POST /monitor/tick` once against seeded Supabase → LD-1042 flagged late
  (HOS + I-45 incident), rerouted, backup reassigned, **one** delay email sent
  (templated in test mode), `delay_detected` + `email_sent` + `reassignment` events
  logged. Re-tick → no duplicate email (debounce).
- Start sim + monitor together → watch HOS deplete, ETA update, and a delivery
  email fire on arrival. Reset via `sql/seed_supabase.sql`.
- Flip `ai_test_mode=False` once → confirm a real Sonnet-drafted email; then back to True.

## Reuse (don't rebuild)
`_haversine_mi`, `_compute_eta`, `reassign_load`, `_send_customer_email`,
`_log_event` (all `app/agent/tools.py`); `draft_status_email` (`app/agent/email_agent.py`);
the `Simulator` background-loop pattern (`app/sim.py`); the events feed (`/events`).
