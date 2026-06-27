  The pitch, sharpened

  ▎ "Meet the dispatcher, the customer service rep, and the operations manager of this trucking company. It's one AI. It answers customer emails,
  ▎ assigns loads to trucks, and when a truck's going to be late, it notices before the customer does, tells them, and reroutes a second truck
  ▎ to save the delivery — autonomously."

  The demo climax (this is what wins)

  Everything builds to one scripted-but-real "hero moment" that uses all three devs' work at once:

  1. Trucks moving live on the 3D map (your 3D dev's centerpiece).
  2. A weather event / incident hits a route (your route-opt dev's engine flags it).
  3. The AI brain (Claude) detects Truck A will miss its delivery window → emails the customer proactively with a new ETA (Resend) → finds Truck
  B nearby with hours-of-service capacity → proposes/executes a load handoff.
  4. The 3D map animates the reroute. The email lands on screen. Judges' jaws drop.

  That single sequence demonstrates autonomy, the 3D, the optimization, and the business value in ~60 seconds. Everything else is supporting
  cast.

  ------------------------------------------------------------------------------

  Architecture (AI brain at the center)

  Postgres ── FastAPI backend
                ├── REST API for dashboards
                ├── AI AGENT (Claude + tool use) ← the operations brain
                │     tools: get_loads, get_trucks, get_driver_hours,
                │            reassign_load, send_customer_email,
                │            check_weather_route (route dev), compute_eta
                ├── Inbound email → AI reads → auto-replies with status
                └── Simulation loop: trucks move, inject weather/incidents
     ↓                         ↓                          ↓
  React dashboards        3D tracking map         Route/weather engine
  (owner / CS / fleet)    (Dev: 3D)               (Dev: route-opt)


  ------------------------------------------------------------------------------
  

  Team mapping

  ┌────────────────┬─────────────────────────────────────────────────────────────────┐
  │     Person     │                              Owns                               │
  ├────────────────┼─────────────────────────────────────────────────────────────────┤
  │ You            │ Backend + the AI agent (tools, prompts, the brain)              │
  ├────────────────┼─────────────────────────────────────────────────────────────────┤
  │ 3D dev         │ 3D live tracking map                                            │
  ├────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Route-opt dev  │ Weather/route engine, exposed as a tool the AI calls            │
  ├────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Me (ship mode) │ React dashboards, API wiring, glue, backend help                │
  ├────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Marketing ×2   │ Pitch + story + demo script + believable seed data + email copy │
  └────────────────┴─────────────────────────────────────────────────────────────────┘

## Frontend (marketing + survey + dashboard)

Branch: `feature/marketing-frontend`

The `frontend/` app is a Samsara-inspired marketing site with:

- **10-step survey** at `/survey/1` … `/survey/10` (feature picker, email, testimonials)
- **Interactive demo tour** at `/demo` (10-step onboarding)
- **Live dashboard** at `/app` wired to the FastAPI backend (fleet map, loads, proximity, trip media)
- **Survey emails** via Resend when `RESEND_API_KEY` is set on the backend
- **Mock fallback** if backend is offline (amber banner shown)

### End-to-end test flow

1. Complete survey at `/survey/1` with your real email
2. Check inbox for welcome email (requires `RESEND_API_KEY` in backend `.env`)
3. Take interactive demo at `/demo`
4. Open live dashboard at `/app`
5. View **LD-1042** under Loads → **Draft AI Email** or **Run demo climax**
6. Trip media at `/app/trip-media` (sample dashcam video)

### Run locally

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # add ANTHROPIC_API_KEY + RESEND_API_KEY
uv sync
uv run uvicorn app.main:app --reload

# Terminal 2 — frontend
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

Set `NEXT_PUBLIC_PRODUCT_NAME=app` in `frontend/.env.local` (rename when brand is ready).
