# A-TMS backend (FastAPI). Build context = backend/.
# Deploy on a long-running host (Render/Railway/Fly) — NOT serverless: the
# sim/monitor run as background asyncio loops with in-memory state.
FROM python:3.12-slim

RUN pip install --no-cache-dir uv

WORKDIR /app

# Install deps first (cache layer) from the lockfile.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

# Render/Railway/Fly inject $PORT; default to 8000 locally.
ENV PORT=8000
EXPOSE 8000
CMD ["sh", "-c", "uv run uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
