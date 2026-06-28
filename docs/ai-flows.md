# A-TMS — AI Automation Flows

The product is **one AI playing three roles** — operations manager, dispatcher,
and customer-service rep. This doc is the canonical catalog of every automation
flow: what it does, its status, how it's triggered, and where it lives in code.

Status legend: ✅ built · 🟡 partial · ⬜ not built

> **The core recovery flow is built and verified. The gap is everything *around*
> it** — autonomous triggering, the customer-service inbound side, and surfacing
> the AI's reasoning in the UI. See [Build order](#build-order).

---

## Personas → flows

| Persona | Flows | State |
|---|---|---|
| **Operations manager** | Monitor fleet, detect at-risk loads, decide actions | ✅ on trigger / ⬜ autonomous |
| **Dispatcher** | Assign + reassign loads to trucks | ✅ reassign / 🟡 assign |
| **CS rep** | Proactive delay emails, answer inbound "where's my load?" | ✅ outbound / ⬜ inbound |

---

## Model & infrastructure

- **Reasoning brain:** Claude **Opus 4.8**, manual agentic loop with adaptive
  thinking (`backend/app/agent/brain.py` → `run_agent`).
- **Customer emails:** Claude **Sonnet 4.6**, structured output → validated
  `EmailDraft` (`backend/app/agent/email_agent.py`).
- **Entry point:** `POST /agent/run` — a `situation` string in, a transcript of
  `steps` (thinking + tool calls) out (`backend/app/routers/agent.py`).
- **Side-effect gating:** every run takes `dry_run` (default **true** = plan
  without committing; `false` = execute for real).
- **Action feed:** the brain's tools write `events` rows the UI polls
  (`reassignment`, `email_sent`, `delivered`) — `backend/app/models.py` (`Event`),
  `GET /events?since_id=`.
- **Email delivery:** Resend. Customer-email sends honor `DEMO_EMAIL_TO` (routes
  to one real inbox since seed addresses are fake).

---

## Flow catalog

### 1. Recovery flow — late load → notify → reassign ✅ BUILT
The demo climax. Runs autonomously *inside* a single `/agent/run` call.

| Step | What | Status |
|---|---|---|
| B1 | Detect the slip — which load, how late, why | ✅ |
| B2 | Draft + **send** proactive customer ETA email (Sonnet 4.6 + Resend) | ✅ |
| B3 | Find a capable backup truck (available, near, capacity, HOS) | ✅ |
| B4 | Reassign / hand off the load | ✅ |
| B5 | Emit `reassignment` + `email_sent` events | ✅ |

- **Trigger today:** manual `POST /agent/run` (`dry_run=false`).
- **Verified:** committed LD-1042 → Truck 23 in Supabase + sent the email.
- **Code:** `brain.py`, `tools.py` (`reassign_load`, `send_customer_email`).

### 2. Triggering / orchestration — how flows start ⬜ (biggest gap)
| Flow | Status | Needs |
|---|---|---|
| Manual trigger from the UI | ⬜ | A "Run AI" button calling `/agent/run`; backend ready |
| **Autonomous monitoring loop** | ⬜ | A scheduler or sim hook that detects an at-risk load and fires the agent on its own — **the heart of "fully AI-run"** |
| Incident injection | ⬜ | A control to inject a weather event / stall a truck to kick off the demo live |

### 3. Customer-service flows (the CS rep)
| Flow | Status | Needs |
|---|---|---|
| Proactive delay email | ✅ | (part of the recovery flow) |
| Inbound "where's my load?" auto-reply | ⬜ | An inbound email source (webhook/poll) → identify load/customer → draft (Sonnet) → send. A whole second persona. |
| Milestone updates (picked up / delivered) | 🟡 | `delivered` event exists (sim) but no email fires on milestones |

### 4. Dispatch flows (the dispatcher)
| Flow | Status | Needs |
|---|---|---|
| Reassign a load | ✅ | `reassign_load` tool |
| Assign a *pending* load to the best truck | 🟡 | Tools exist (get_trucks + reassign) but no explicit "assign new load" flow; LD-1044 sits unassigned |
| Load intake / booking | ⬜ | No intake source (a new load arriving → AI assigns) |

### 5. Monitoring & detection (the operations manager)
| Flow | Status | Needs |
|---|---|---|
| At-risk fleet sweep | ✅ | The brain does it when triggered (not on its own — see §2) |
| Weather-aware routing | ⬜ | `check_weather_route` is a **stub**; route dev's engine fills it |
| Driver hours (HOS) check | 🟡 | `get_driver_hours` is a **stub** returning a placeholder |

### 6. Explainability / surfacing ⬜
| Flow | Status | Needs |
|---|---|---|
| Reasoning transcript | ✅ | `/agent/run` returns the full step trace |
| `agent_run` event + UI timeline + live email card | ⬜ | None of the trace reaches the screen yet; judges need to *see* the AI think and act |

---

## Supporting tools (what the brain can call)

Defined in `backend/app/agent/tools.py` (`TOOL_SCHEMAS` + `execute_tool`).

| Tool | Kind | Status |
|---|---|---|
| `get_loads`, `get_trucks`, `compute_eta` | read | ✅ real |
| `reassign_load`, `send_customer_email` | side-effect (dry_run-gated) | ✅ real |
| `check_weather_route` | read | 🟡 stub — route engine |
| `get_driver_hours` | read | 🟡 stub — HOS source |

---

## Current trigger model & the gap

**Everything is manual today.** A flow only runs when something calls
`POST /agent/run`. Nothing fires the agent on its own, so the system is an
AI *tool*, not yet an AI-run *company*. Closing this is §2's "autonomous
monitoring loop" — the single highest-leverage piece.

Trigger approaches to weigh (decision pending):
- **Background loop** — a periodic sweep (every N seconds) that finds at-risk
  loads and fires the agent. Simple; always-on.
- **Sim-driven** — the simulation already detects when a load is delayed; have
  it emit an "at-risk" signal that fires the agent once per load.
- **Event/threshold** — fire when a load first crosses `eta > deliver_by`.

Open questions for that conversation: autonomy posture (auto-act vs.
human-approve — informed by survey Q14), debounce (fire once per load, not every
tick), and how the demo is kicked off (incident injection vs. seeded state).

---

## Build order

1. **Autonomous trigger** (§2) — the AI fires itself when a load goes late.
2. **Surface the agent in the UI** (§6) — `agent_run` event + reasoning/email panel.
3. **Incident injection** (§2) — kick the demo off on cue.
4. **Inbound CS auto-reply** (§3) — the second persona; highest "wow" if time allows.
5. Pending-load assignment (§4) + milestone emails (§3) — depth if time allows.

---

## Code map

| Path | Responsibility |
|---|---|
| `backend/app/agent/brain.py` | Opus 4.8 agentic loop (`run_agent`) |
| `backend/app/agent/tools.py` | Tool schemas + implementations + event logging |
| `backend/app/agent/email_agent.py` | Sonnet 4.6 customer-email drafting |
| `backend/app/routers/agent.py` | `POST /agent/run` |
| `backend/app/routers/events.py` | `GET /events` action feed |
| `backend/app/sim.py` | Truck-motion simulation (`/sim/*`) |
| `backend/app/services/email_send.py` | Resend delivery (survey + loads route) |
