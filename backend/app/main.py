from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.routers import agent, events, fleet, loads, sim, survey, tools
from app.seed import seed
from app.sim import simulator


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    # Supabase/Postgres is the source of truth: schema + seed come from
    # backend/sql/seed_supabase.sql. Only auto-create and seed for a local
    # SQLite throwaway DB so `uv run uvicorn ...` still boots with zero setup.
    if settings.database_url.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            seed(db)
    yield
    await simulator.stop()


app = FastAPI(
    title="A-TMS — AI Transportation Management System",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(loads.router)
app.include_router(fleet.router)
app.include_router(agent.router)
app.include_router(events.router)
app.include_router(sim.router)
app.include_router(tools.router)
app.include_router(survey.router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    s = get_settings()
    return {
        "status": "ok",
        "company": s.company_name,
        "anthropic_key_set": bool(s.anthropic_api_key),
        "email_model": s.email_model,
        "reasoning_model": s.reasoning_model,
        "sim_running": simulator.running,
    }
