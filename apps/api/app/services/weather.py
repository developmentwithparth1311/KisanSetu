"""Mandi weather integration with deterministic regional fallbacks."""

from __future__ import annotations

import os
from typing import Any

import httpx


MANDI_COORDINATES: dict[str, dict[str, Any]] = {
    "nashik": {"lat": 19.9975, "lon": 73.7898, "name": "Nashik APMC", "state": "Maharashtra"},
    "pune": {"lat": 18.5204, "lon": 73.8567, "name": "Pune Gultekdi", "state": "Maharashtra"},
    "indore": {"lat": 22.7196, "lon": 75.8577, "name": "Indore Mandi", "state": "Madhya Pradesh"},
    "azadpur": {"lat": 28.7041, "lon": 77.1025, "name": "Azadpur Mandi", "state": "Delhi"},
}

FALLBACK_WEATHER: dict[str, dict[str, Any]] = {
    "nashik": {"temp": 28, "humidity": 62, "condition": "Partly Cloudy", "rain": 25, "risk": "Low"},
    "pune": {"temp": 29, "humidity": 58, "condition": "Sunny", "rain": 15, "risk": "Low"},
    "indore": {"temp": 31, "humidity": 48, "condition": "Clear Sky", "rain": 10, "risk": "Low"},
    "azadpur": {"temp": 34, "humidity": 70, "condition": "Hazy Sun", "rain": 40, "risk": "Moderate"},
}


def _fallback(mandi_id: str, coords: dict[str, Any]) -> dict[str, Any]:
    current = FALLBACK_WEATHER.get(mandi_id, FALLBACK_WEATHER["nashik"])
    return {
        "mandiId": mandi_id,
        "mandiName": coords["name"],
        "temp": current["temp"],
        "feelsLike": current["temp"] + 2,
        "humidity": current["humidity"],
        "condition": current["condition"],
        "conditionIcon": "🌤️",
        "rainProbabilityNext48h": current["rain"],
        "spoilageRisk": current["risk"],
        "weatherAlert": f"Moderate heat in {coords['name']}: store in shade." if current["risk"] == "Moderate" else None,
        "isLive": False,
    }


async def fetch_mandi_weather(mandi_id: str) -> dict[str, Any]:
    coords = MANDI_COORDINATES.get(mandi_id, MANDI_COORDINATES["nashik"])
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key or api_key == "your_openweather_key":
        return _fallback(mandi_id, coords)

    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?lat={coords['lat']}&lon={coords['lon']}&appid={api_key}&units=metric"
    )
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0)) as client:
            response = await client.get(url)
        if not response.is_success:
            return _fallback(mandi_id, coords)
        data = response.json()
        main = data.get("main") or {}
        weather = (data.get("weather") or [{}])[0]
        temp = math_round(main.get("temp", 28))
        humidity = main.get("humidity") if main.get("humidity") is not None else 65
        condition = weather.get("main") or "Clear"
        is_rainy = "rain" in condition.lower() or "drizzle" in condition.lower()
        rain_probability = 85 if is_rainy else 60 if humidity > 75 else 20
        if is_rainy or humidity > 80:
            risk = "High"
            alert = f"High moisture alert in {coords['name']}: Rain and {humidity}% humidity increase open-mandi crop decay."
        elif temp > 35:
            risk = "Moderate"
            alert = f"High temperature ({temp}°C) in {coords['name']}: Ensure covered transit to prevent weight loss."
        else:
            risk = "Low"
            alert = None
        icon = weather.get("icon")
        return {
            "mandiId": mandi_id,
            "mandiName": coords["name"],
            "temp": temp,
            "feelsLike": math_round(main.get("feels_like"), temp),
            "humidity": humidity,
            "condition": condition,
            "conditionIcon": f"https://openweathermap.org/img/wn/{icon}@2x.png" if icon else "☀️",
            "rainProbabilityNext48h": rain_probability,
            "spoilageRisk": risk,
            "weatherAlert": alert,
            "isLive": True,
        }
    except (httpx.HTTPError, ValueError, TypeError, KeyError):
        return _fallback(mandi_id, coords)


def math_round(value: Any, fallback: int = 28) -> int:
    try:
        return int(float(value) + 0.5)
    except (TypeError, ValueError):
        return fallback
