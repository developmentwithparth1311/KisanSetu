from pathlib import Path

from fastapi.testclient import TestClient

import app.db as db_module
from app.config import Settings
from app.db import get_connection
from app.main import app
from app.seed import seed_database
from app.services.pooling import (
    are_lots_pool_compatible,
    build_pool_suggestion,
    find_pool_candidates,
    haversine_km,
)


def _lot(**overrides):
    value = {
        "id": "anchor",
        "crop_id": "onion",
        "variety": "Red Onion",
        "ai_grade": "Grade A",
        "quantity": 20,
        "unit": "quintal",
        "latitude": 20.011,
        "longitude": 73.790,
        "available_from": "2026-08-30",
        "available_until": "2026-09-02",
        "pooling_enabled": 1,
        "pooling_radius_km": 20,
        "status": "Active",
        "farmer_name": "Demo Farmer",
    }
    value.update(overrides)
    return value


def _client_for(database_path: Path, monkeypatch) -> TestClient:
    seed_database(database_path)
    monkeypatch.setattr(db_module, "settings", Settings(db_path=database_path))
    return TestClient(app)


def test_haversine_is_zero_for_identical_points_and_bounded_for_nearby_points() -> None:
    assert haversine_km(20.011, 73.790, 20.011, 73.790) == 0
    assert 1 < haversine_km(20.011, 73.790, 20.018, 73.801) < 2


def test_compatibility_requires_crop_variety_grade_time_and_radius() -> None:
    anchor = _lot()
    assert are_lots_pool_compatible(anchor, _lot(id="nearby", latitude=20.018, longitude=73.801)).compatible
    assert not are_lots_pool_compatible(anchor, _lot(crop_id="potato")).compatible
    assert not are_lots_pool_compatible(anchor, _lot(variety="White Onion")).compatible
    assert are_lots_pool_compatible(anchor, _lot(variety=None)).compatible
    assert not are_lots_pool_compatible(anchor, _lot(ai_grade="Grade C")).compatible
    assert not are_lots_pool_compatible(anchor, _lot(latitude=21.011, longitude=74.790)).compatible
    assert not are_lots_pool_compatible(
        anchor,
        _lot(available_from="2026-09-10", available_until="2026-09-12"),
    ).compatible


def test_candidate_discovery_returns_exact_seeded_106_qtl_pool(tmp_path: Path) -> None:
    database_path = tmp_path / "pooling.db"
    seed_database(database_path)
    connection = get_connection(database_path)
    try:
        lots = [dict(row) for row in connection.execute("SELECT * FROM lots")]
    finally:
        connection.close()
    anchor = next(lot for lot in lots if lot["id"] == "LOT-GEO-PRIMARY")
    accepted, rejected = find_pool_candidates(anchor, lots)
    suggestion = build_pool_suggestion(anchor, accepted)

    assert [candidate["lotId"] for candidate in accepted] == ["LOT-GEO-B", "LOT-GEO-C", "LOT-GEO-D"]
    assert {candidate["lotId"] for candidate in rejected} >= {"LOT-7821", "LOT-6540"}
    assert suggestion["anchorQuantity"] == 20
    assert suggestion["nearbyQuantity"] == 86
    assert suggestion["totalQuantity"] == 106
    assert suggestion["memberCount"] == 4


def test_pools_api_discovers_materializes_and_joins_seeded_pool(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "pooling.db"
    with _client_for(database_path, monkeypatch) as client:
        suggestion_response = client.get("/api/pools/suggestions?lotId=LOT-GEO-PRIMARY")
        assert suggestion_response.status_code == 200
        suggestion = suggestion_response.json()["suggestions"][0]
        assert suggestion["totalQuantity"] == 106
        assert [member["lotId"] for member in suggestion["members"]] == [
            "LOT-GEO-PRIMARY", "LOT-GEO-B", "LOT-GEO-C", "LOT-GEO-D"
        ]

        # Remove only the seeded materialization to prove this endpoint writes
        # a new pool and members from the deterministic suggestion.
        connection = get_connection(database_path)
        try:
            with connection:
                connection.execute("DELETE FROM geo_pool_members WHERE pool_id = ?", ("POOL-NSK-ON-01",))
                connection.execute("DELETE FROM geo_pools WHERE id = ?", ("POOL-NSK-ON-01",))
        finally:
            connection.close()
        materialized = client.post("/api/pools", json={"lotId": "LOT-GEO-PRIMARY"})
        assert materialized.status_code == 200
        assert materialized.json()["pool"]["id"] == "POOL-NSK-ON-01"
        assert materialized.json()["pool"]["total_quantity"] == 106

        connection = get_connection(database_path)
        try:
            with connection:
                connection.execute(
                    "UPDATE geo_pool_members SET accepted = 0 WHERE pool_id = ? AND lot_id = ?",
                    ("POOL-NSK-ON-01", "LOT-GEO-PRIMARY"),
                )
        finally:
            connection.close()
        joined = client.post("/api/pools/POOL-NSK-ON-01/join", json={"lotId": "LOT-GEO-PRIMARY"})
        detail = client.get("/api/pools/POOL-NSK-ON-01")

    assert joined.status_code == 200
    assert joined.json()["accepted"] is True
    primary = next(member for member in detail.json()["pool"]["members"] if member["lot_id"] == "LOT-GEO-PRIMARY")
    assert primary["accepted"] == 1
