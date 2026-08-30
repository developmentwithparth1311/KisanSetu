"""FastAPI entry point for the incremental KisanSetu backend migration."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from .config import settings
from .db import initialize_schema
from .routers.prices import router as prices_router
from .routers.weather import router as weather_router
from .routers.lots import router as lots_router
from .routers.negotiation import router as negotiation_router
from .routers.voice import router as voice_router
from .routers.pools import router as pools_router
from .routers.matches import router as matches_router
from .schemas import HealthResponse


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Verify SQLite is reachable when the service starts."""

    initialize_schema()
    yield


app = FastAPI(
    title="KisanSetu Python API",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(prices_router)
app.include_router(weather_router)
app.include_router(lots_router)
app.include_router(negotiation_router)
app.include_router(voice_router)
app.include_router(pools_router)
app.include_router(matches_router)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(ok=True, service="kisansetu-python-api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)
