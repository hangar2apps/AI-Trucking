from fastapi import APIRouter

from app.sim import simulator

router = APIRouter(prefix="/sim", tags=["sim"])


@router.post("/tick")
def tick() -> dict:
    """Advance the simulation one step (manual control for demos)."""
    return simulator.tick()


@router.post("/start")
async def start() -> dict:
    """Start the background loop (auto-ticks every sim_interval_seconds)."""
    simulator.start()
    return simulator.status()


@router.post("/stop")
async def stop() -> dict:
    await simulator.stop()
    return simulator.status()


@router.get("/status")
def status() -> dict:
    return simulator.status()
