from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db import Base, SessionLocal, engine
from app.routers import fleet, loads, survey
from app.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(
    title="A-TMS — AI Transportation Management System",
    version="0.1.0",
    lifespan=lifespan,
)

# Open CORS for the local React dashboards during the hackathon.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(loads.router)
app.include_router(fleet.router)
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
    }
