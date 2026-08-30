from pathlib import Path

from fastapi.testclient import TestClient

import app.db as db_module
from app.config import Settings
from app.main import app
from app.seed import seed_database


def _client_for(database_path: Path, monkeypatch) -> TestClient:
    seed_database(database_path)
    monkeypatch.setattr(db_module, "settings", Settings(db_path=database_path))
    return TestClient(app)


def test_get_lots_preserves_existing_contract(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "lots.db", monkeypatch) as client:
        response = client.get("/api/lots")

    assert response.status_code == 200
    payload = response.json()
    assert {"lots", "buyers"} == set(payload)
    assert len(payload["lots"]) == 6
    assert len(payload["buyers"]) == 5
    tomato_lot = next(lot for lot in payload["lots"] if lot["id"] == "LOT-7821")
    assert tomato_lot["cropName"] == "Tomato (टमाटर)"
    assert tomato_lot["cropIcon"] == "🍅"
    assert isinstance(tomato_lot["aiDefects"], list)
    assert isinstance(tomato_lot["negotiationEvents"], list)
    assert "pooling_enabled" in tomato_lot
    buyer = next(item for item in payload["buyers"] if item["id"] == "b1")
    assert buyer["cropsWanted"] == ["tomato", "onion", "potato"]


def test_post_lot_accepts_old_request_without_geo_fields(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "lots.db"
    with _client_for(database_path, monkeypatch) as client:
        response = client.post(
            "/api/lots",
            json={
                "farmerName": "  Test Farmer  ",
                "cropId": "tomato",
                "mandiId": "nashik",
                "quantity": 10,
                "photoUrl": "photo.png",
                "aiGrade": "Grade A",
                "aiConfidence": 94.6,
                "aiDefects": ["Clean"],
                "floorPrice": 1900,
                "targetPrice": 2200,
            },
        )
        assert response.status_code == 200
        lot_id = response.json()["lotId"]

        lot = client.get("/api/lots").json()["lots"]
        created = next(item for item in lot if item["id"] == lot_id)

    assert created["farmer_name"] == "Test Farmer"
    assert created["farmer_phone"] == "+91 98000 00000"
    assert created["pooling_enabled"] == 1
    assert created["pooling_radius_km"] == 20
    assert created["latitude"] is None
    assert created["negotiationEvents"][0]["sender_type"] == "Farmer"


def test_post_lot_accepts_optional_geo_pooling_fields(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "lots.db"
    with _client_for(database_path, monkeypatch) as client:
        response = client.post(
            "/api/lots",
            json={
                "farmerName": "Geo Farmer",
                "farmerPhone": "+91 90000 00000",
                "cropId": "onion",
                "mandiId": "nashik",
                "quantity": 20,
                "unit": "quintal",
                "aiDefects": [],
                "floorPrice": 1900,
                "targetPrice": 2250,
                "variety": "Red Onion",
                "latitude": 20.011,
                "longitude": 73.790,
                "availableFrom": "2026-08-30",
                "availableUntil": "2026-09-02",
                "poolingEnabled": True,
                "poolingRadiusKm": 12.5,
            },
        )
        assert response.status_code == 200
        created = next(
            item for item in client.get("/api/lots").json()["lots"] if item["id"] == response.json()["lotId"]
        )

    assert created["variety"] == "Red Onion"
    assert created["latitude"] == 20.011
    assert created["longitude"] == 73.790
    assert created["available_from"] == "2026-08-30"
    assert created["available_until"] == "2026-09-02"
    assert created["pooling_enabled"] == 1
    assert created["pooling_radius_km"] == 12.5


def test_post_lot_rejects_missing_legacy_required_fields(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "lots.db", monkeypatch) as client:
        response = client.post("/api/lots", json={"farmerName": "Missing Fields"})

    assert response.status_code == 400
    assert response.json() == {"error": "Missing required lot creation fields"}
