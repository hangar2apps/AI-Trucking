# Backend API contract (Autonomous Freight)

This document mirrors the integration section in [README.md](../README.md) with copy-paste schemas for Bryan, Pavan, and Claude.

## Base URL

```
Development:  http://localhost:8000
Production:   TBD (e.g. https://api.2iwin.com)
```

## Endpoints

### `GET /api/trucks`

```json
[
  {
    "id": "L-9402",
    "progress": 0.42,
    "tone": "rose",
    "status": "Delay risk",
    "position": [-92.82, 37.58],
    "route_key": "rescue",
    "driver": "Marcus Vance",
    "eta": "3:45 PM CT",
    "hos_hours_remaining": 2.4,
    "fuel_pct": 61
  }
]
```

### `GET /api/routes/{key}`

`key` ∈ `feeder` | `original` | `rescue` | `finalLeg`

```json
{
  "key": "rescue",
  "coordinates": [[-97.5164, 35.4676], [-93.2923, 37.2089]],
  "status": "active"
}
```

### `GET /api/incidents`

```json
[
  {
    "id": "wx-springfield-001",
    "type": "weather",
    "center": [-93.29, 37.21],
    "radius_m": 85000,
    "severity": "severe",
    "label": "I-44 storm band",
    "subtitle": "Severe cell crossing route",
    "affected_route_keys": ["original", "rescue"],
    "eta_impact_minutes": 47
  }
]
```

### `GET /api/agent/state`

Matches one `phasePlan` entry in `app.js`.

```json
{
  "phase_key": "handoff",
  "title": "Truck B selected",
  "copy": "The agent finds L-9448 near St. Louis...",
  "agent_state": "Reassigning",
  "risk": "Handoff ready",
  "efficiency_pct": "91%",
  "sla_rescued": 1,
  "tools": [
    ["get_driver_hours", "4.2h open", "complete"],
    ["reassign_load", "L-9448", "complete"],
    ["compute_eta", "SLA saved", "complete"]
  ],
  "email": {
    "status": "Sent",
    "subject": "Updated ETA for load L-9402",
    "body": "We detected weather on the Oklahoma City to Chicago lane..."
  },
  "loads_key": "handoff"
}
```

### `POST /api/demo/hero-moment`

Starts the scripted simulation timeline. Returns `202 Accepted`.

### WebSocket `WS /ws/simulation`

**tick** (every 1–2s):

```json
{
  "type": "tick",
  "ts": "2026-06-27T12:02:08-05:00",
  "trucks": [],
  "routes": {
    "rescue": { "draw_progress": 0.55 },
    "finalLeg": { "draw_progress": 0.0 }
  }
}
```

**phase** (on agent milestone):

```json
{
  "type": "phase",
  "key": "email",
  "agent_state": { }
}
```

## Agent tools (Bryan)

| Tool | Input | Output |
|------|-------|--------|
| `get_loads` | — | Active load list |
| `get_trucks` | `near?: [lng,lat], radius_km?` | Truck list with HOS |
| `get_driver_hours` | `driver_id` | Hours remaining |
| `reassign_load` | `load_id`, `truck_id` | Assignment record |
| `send_customer_email` | `load_id`, `template?` | Resend message id |
| `check_weather_route` | `route_key` | Pavan incident payload |
| `compute_eta` | `truck_id`, `route_key` | ISO timestamp + delay_min |

## Map adapter (Zion)

Replace in `app.js`:

1. `truckSnapshot()` → read from `state.apiTrucks[id]` when `state.liveMode`
2. `setPhase()` → call on WebSocket `phase` messages
3. `loadRoadRoutes()` → `GET /api/routes/*`
4. `updateMap()` weather circle → `GET /api/incidents`

Coordinate order everywhere: **`[longitude, latitude]`** (GeoJSON).
