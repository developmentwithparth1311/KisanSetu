from pathlib import Path

from fastapi.testclient import TestClient

import app.db as db_module
from app.config import Settings
from app.db import get_connection
from app.main import app
from app.seed import seed_database


def _client_for(database_path: Path, monkeypatch) -> TestClient:
    seed_database(database_path)
    monkeypatch.setattr(db_module, "settings", Settings(db_path=database_path))
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    return TestClient(app)


def test_low_buyer_bid_is_countered_without_a_sale(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "negotiation.db"
    with _client_for(database_path, monkeypatch) as client:
        response = client.post("/api/negotiate", json={
            "lotId": "LOT-GEO-PRIMARY", "action": "buyer_bid", "buyerId": "b1", "offerAmount": 1800,
        })
        assert response.status_code == 200
        payload = response.json()
        assert payload["aiEvaluation"]["action"] == "Counter"
        assert payload["aiEvaluation"]["amount"] >= 1900
        assert payload["lotStatus"] == "Under Negotiation"
        assert payload["aiEvaluation"]["finalized"] is False
        premature_accept = client.post(
            "/api/negotiate", json={"lotId": "LOT-GEO-PRIMARY", "action": "farmer_accept"}
        )
        lot = next(item for item in client.get("/api/lots").json()["lots"] if item["id"] == "LOT-GEO-PRIMARY")

    assert premature_accept.status_code == 400
    assert premature_accept.json() == {
        "error": "Farmer can finalize only a buyer offer recommended for acceptance"
    }
    assert lot["status"] != "Sold"
    assert lot["escrow_amount"] is None


def test_farmer_cannot_finalize_without_a_recommended_buyer_offer(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "negotiation.db", monkeypatch) as client:
        response = client.post(
            "/api/negotiate", json={"lotId": "LOT-GEO-PRIMARY", "action": "farmer_accept"}
        )
        lot = next(item for item in client.get("/api/lots").json()["lots"] if item["id"] == "LOT-GEO-PRIMARY")

    assert response.status_code == 400
    assert response.json() == {
        "error": "Farmer can finalize only a buyer offer recommended for acceptance"
    }
    assert lot["status"] == "Active"
    assert lot["escrow_amount"] is None


def test_recommended_offer_is_not_final_until_farmer_accepts(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "negotiation.db"
    with _client_for(database_path, monkeypatch) as client:
        bid = client.post("/api/negotiate", json={
            "lotId": "LOT-GEO-PRIMARY", "action": "buyer_bid", "buyerId": "b1", "offerAmount": 2250,
        })
        assert bid.status_code == 200
        assert bid.json()["aiEvaluation"]["action"] == "RecommendAccept"
        assert bid.json()["lotStatus"] == "Recommended Accept"
        before_confirmation = next(item for item in client.get("/api/lots").json()["lots"] if item["id"] == "LOT-GEO-PRIMARY")
        accepted = client.post("/api/negotiate", json={"lotId": "LOT-GEO-PRIMARY", "action": "farmer_accept"})
        after_confirmation = next(item for item in client.get("/api/lots").json()["lots"] if item["id"] == "LOT-GEO-PRIMARY")

    assert before_confirmation["status"] == "Recommended Accept"
    assert before_confirmation["escrow_amount"] is None
    assert accepted.status_code == 200
    assert accepted.json()["lotStatus"] == "Sold"
    assert after_confirmation["escrow_amount"] == 45000
    assert after_confirmation["escrow_status"] == "Held"


def test_farmer_finalization_rejects_a_below_floor_current_offer(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "negotiation.db"
    with _client_for(database_path, monkeypatch) as client:
        connection = get_connection(database_path)
        try:
            with connection:
                connection.execute("UPDATE lots SET current_offer = 1800 WHERE id = 'LOT-GEO-PRIMARY'")
        finally:
            connection.close()
        response = client.post("/api/negotiate", json={"lotId": "LOT-GEO-PRIMARY", "action": "farmer_accept"})
        lot = next(item for item in client.get("/api/lots").json()["lots"] if item["id"] == "LOT-GEO-PRIMARY")

    assert response.status_code == 400
    assert response.json() == {"error": "Cannot finalize below the farmer floor price"}
    assert lot["status"] != "Sold"


def test_pooled_confirmation_uses_the_persisted_pool_quantity(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "negotiation.db"
    with _client_for(database_path, monkeypatch) as client:
        bid = client.post("/api/negotiate", json={
            "lotId": "LOT-GEO-PRIMARY", "poolId": "POOL-NSK-ON-01",
            "action": "buyer_bid", "buyerId": "b1", "offerAmount": 2250,
        })
        accepted = client.post("/api/negotiate", json={
            "lotId": "LOT-GEO-PRIMARY", "poolId": "POOL-NSK-ON-01", "action": "farmer_accept",
        })

    assert bid.status_code == 200
    assert bid.json()["effectiveQuantity"] == 106
    assert accepted.status_code == 200
    assert accepted.json()["effectiveQuantity"] == 106
    assert accepted.json()["escrowAmount"] == 238500


def test_pool_context_must_include_the_negotiated_lot(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "negotiation.db", monkeypatch) as client:
        response = client.post("/api/negotiate", json={
            "lotId": "LOT-7821", "poolId": "POOL-NSK-ON-01", "action": "buyer_bid",
            "buyerId": "b1", "offerAmount": 2250,
        })

    assert response.status_code == 400
    assert response.json() == {"error": "Pool not found or does not include this lot"}


def test_farmer_counter_and_invalid_action_are_validated(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "negotiation.db", monkeypatch) as client:
        too_low = client.post("/api/negotiate", json={
            "lotId": "LOT-GEO-PRIMARY", "action": "farmer_counter", "offerAmount": 1800,
        })
        counter = client.post("/api/negotiate", json={
            "lotId": "LOT-GEO-PRIMARY", "action": "farmer_counter", "offerAmount": 2100,
        })
        invalid = client.post("/api/negotiate", json={"lotId": "LOT-GEO-PRIMARY", "action": "unknown"})

    assert too_low.status_code == 400
    assert counter.status_code == 200
    assert counter.json()["lotStatus"] == "Under Negotiation"
    assert invalid.status_code == 400
    assert invalid.json() == {"error": "Invalid action"}
