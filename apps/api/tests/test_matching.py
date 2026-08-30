from pathlib import Path

from fastapi.testclient import TestClient

import app.db as db_module
from app.config import Settings
from app.main import app
from app.seed import seed_database
from app.services.matching import evaluate_buyer_feasibility, score_feasible_match


def _client_for(database_path: Path, monkeypatch) -> TestClient:
    seed_database(database_path)
    monkeypatch.setattr(db_module, "settings", Settings(db_path=database_path))
    return TestClient(app)


def _supply(**overrides):
    value = {
        "supplyType": "LOT", "supplyId": "LOT-TEST", "crop_id": "onion", "variety": "Red Onion",
        "minimum_grade": "Grade A", "quantity": 20, "unit": "quintal", "latitude": 20.011,
        "longitude": 73.790, "available_until": "2026-09-02", "member_grades": ["Grade A"],
    }
    value.update(overrides)
    return value


def _requirement(**overrides):
    value = {
        "id": "REQ-TEST", "buyer_id": "b1", "crop_id": "onion", "variety": "Red Onion",
        "minimum_grade": "Grade A", "required_quantity": 100, "unit": "quintal", "offer_price": 2030,
        "delivery_latitude": 19.076, "delivery_longitude": 72.8777, "delivery_by": "2026-09-03", "active": 1,
    }
    value.update(overrides)
    return value


def test_hard_feasibility_cannot_be_overridden_by_weighted_score() -> None:
    result = evaluate_buyer_feasibility(_supply(), _requirement(), {"verified": 1})
    assert result.feasible is False
    assert any("20 qtl is below the required 100 qtl" in reason for reason in result.reasons)
    assert score_feasible_match(_supply(), _requirement(), {"verified": 1, "trust_score": 94}, result) is None


def test_pool_quantity_satisfies_seeded_shree_balaji_requirement(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "matching.db", monkeypatch) as client:
        response = client.get("/api/matches?poolId=POOL-NSK-ON-01")

    assert response.status_code == 200
    payload = response.json()
    assert payload["supplyType"] == "POOL"
    assert payload["availableQuantity"] == 106
    match = next(item for item in payload["matches"] if item["buyerId"] == "b1")
    assert match["feasible"] is True
    assert 0 <= match["matchScore"] <= 1
    assert match["trustScore"] == 94
    assert match["effectivePrice"] < match["offerPrice"]
    assert any("100 qtl" in reason for reason in match["reasons"])


def test_direct_20_qtl_lot_is_returned_only_as_an_infeasible_reason(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "matching.db", monkeypatch) as client:
        response = client.get("/api/matches?lotId=LOT-GEO-PRIMARY")

    assert response.status_code == 200
    payload = response.json()
    assert payload["supplyType"] == "LOT"
    assert payload["matches"] == []
    rejected = next(item for item in payload["infeasibleMatches"] if item["buyerId"] == "b1")
    assert rejected["feasible"] is False
    assert any("20 qtl is below the required 100 qtl" in reason for reason in rejected["reasons"])


def test_buyer_requirement_endpoint_returns_seeded_rfq(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "matching.db", monkeypatch) as client:
        response = client.get("/api/buyer-requirements?activeOnly=true")

    assert response.status_code == 200
    requirement = next(item for item in response.json()["requirements"] if item["id"] == "REQ-B1-ONION-100")
    assert requirement["buyerName"] == "Shree Balaji Agro Traders"
    assert requirement["required_quantity"] == 100
