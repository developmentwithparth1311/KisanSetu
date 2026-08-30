"""FastAPI port of the existing ``GET /api/weather`` handler."""

from fastapi import APIRouter, Query

from ..services.weather import fetch_mandi_weather


router = APIRouter(prefix="/api")


@router.get("/weather")
async def weather(mandi: str = Query(default="nashik")):
    return await fetch_mandi_weather(mandi)
