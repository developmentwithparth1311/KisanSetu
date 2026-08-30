from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import app.db as db_module
from app.config import Settings
from app.main import app
from app.seed import seed_database
from app.services.weather import fetch_mandi_weather


def test_prices_preserves_frontend_contract(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "seeded.db"
    seed_database(database_path)
    monkeypatch.setattr(db_module, "settings", Settings(db_path=database_path))
    monkeypatch.delenv("OPENWEATHER_API_KEY", raising=False)
    monkeypatch.delenv("DATA_GOV_IN_API_KEY", raising=False)
    monkeypatch.delenv("AGMARKNET_API_KEY", raising=False)

    with TestClient(app) as client:
        response = client.get("/api/prices?crop=onion&mandi=nashik&days=30")

    assert response.status_code == 200
    payload = response.json()
    assert {"crops", "mandis", "selectedCrop", "selectedMandi", "priceHistory", "allHistoryCount", "latestPricePoint", "mandiComparisons", "advisory", "weather", "isLiveAgmarknet"}.issubset(payload)
    assert len(payload["priceHistory"]) == 30
    assert payload["allHistoryCount"] == 91
    assert {"id", "name", "grades"}.issubset(payload["selectedCrop"])
    assert {"date", "min_price", "max_price", "modal_price", "arrival_volume"}.issubset(payload["latestPricePoint"])
    assert {"mandiId", "mandiName", "currentModalPrice", "arrivalVolume", "isCurrent"}.issubset(payload["mandiComparisons"][0])
    assert {"decision", "badgeTitle", "currentPrice", "avg30Day", "pctTrend7Day", "arrivalImpact"}.issubset(payload["advisory"])
    assert payload["weather"]["isLive"] is False
    assert payload["isLiveAgmarknet"] is False


def test_prices_returns_404_for_unknown_crop(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "seeded.db"
    seed_database(database_path)
    monkeypatch.setattr(db_module, "settings", Settings(db_path=database_path))

    with TestClient(app) as client:
        response = client.get("/api/prices?crop=unknown&mandi=nashik")

    assert response.status_code == 404
    assert response.json() == {"error": "Crop or Mandi not found"}


def test_weather_route_preserves_deterministic_fallback(monkeypatch) -> None:
    monkeypatch.delenv("OPENWEATHER_API_KEY", raising=False)

    with TestClient(app) as client:
        response = client.get("/api/weather?mandi=azadpur")

    assert response.status_code == 200
    assert response.json() == {
        "mandiId": "azadpur",
        "mandiName": "Azadpur Mandi",
        "temp": 34,
        "feelsLike": 36,
        "humidity": 70,
        "condition": "Hazy Sun",
        "conditionIcon": "🌤️",
        "rainProbabilityNext48h": 40,
        "spoilageRisk": "Moderate",
        "weatherAlert": "Moderate heat in Azadpur Mandi: store in shade.",
        "isLive": False,
    }


@pytest.mark.asyncio
async def test_weather_unknown_mandi_uses_nashik_fallback(monkeypatch) -> None:
    monkeypatch.delenv("OPENWEATHER_API_KEY", raising=False)
    result = await fetch_mandi_weather("not-a-mandi")
    assert result["mandiId"] == "not-a-mandi"
    assert result["mandiName"] == "Nashik APMC"
    assert result["temp"] == 28
