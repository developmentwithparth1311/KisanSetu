from pathlib import Path

from fastapi.testclient import TestClient

import app.db as db_module
from app.config import Settings
from app.main import app
from app.seed import seed_database
from app.services.voice_parser import parse_voice_query_rules


def _client_for(database_path: Path, monkeypatch) -> TestClient:
    seed_database(database_path)
    monkeypatch.setattr(db_module, "settings", Settings(db_path=database_path))
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    return TestClient(app)


def test_rule_parser_handles_hindi_hinglish_and_marathi() -> None:
    assert parse_voice_query_rules("आज का प्याज़ का भाव नासिक में") ["detectedCropId"] == "onion"
    assert parse_voice_query_rules("आज का प्याज़ का भाव नासिक में") ["detectedMandiId"] == "nashik"
    assert parse_voice_query_rules("आज का प्याज का भाव") ["detectedCropId"] == "onion"
    assert parse_voice_query_rules("बटाटा भाव पुणे") ["detectedCropId"] == "potato"
    assert parse_voice_query_rules("wheat price in indore") ["detectedMandiId"] == "indore"
    assert parse_voice_query_rules("माझा पूल दाखवा")["intent"] == "FIND_POOL"
    assert parse_voice_query_rules("माझा सर्वोत्तम खरेदीदार कोण आहे?")["intent"] == "BEST_BUYER"


def test_voice_query_preserves_frontend_response_fields(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "voice.db", monkeypatch) as client:
        response = client.post("/api/voice-query", json={"transcript": "Onion price in Nashik"})

    assert response.status_code == 200
    payload = response.json()
    assert {"transcript", "cropId", "cropName", "cropIcon", "mandiId", "mandiName", "modalPrice", "minPrice", "maxPrice", "trendPct", "advisoryDecision", "advisoryLabel", "spokenResponse", "spokenResponseHi", "spokenResponseMr", "reason", "isGeminiParsed"}.issubset(payload)
    assert payload["cropId"] == "onion"
    assert payload["mandiId"] == "nashik"
    assert payload["isGeminiParsed"] is False
    assert "प्याज़" in payload["spokenResponseHi"]
    assert "कांदा" in payload["spokenResponseMr"]


def test_feature_five_voice_intents_read_seeded_pool_and_best_buyer(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "voice.db", monkeypatch) as client:
        pool_response = client.post("/api/voice-query", json={"transcript": "Show my pool"})
        buyer_response = client.post("/api/voice-query", json={"transcript": "Who is my best buyer?"})

    assert pool_response.status_code == 200
    assert pool_response.json()["intent"] == "FIND_POOL"
    assert pool_response.json()["availableQuantity"] == 106
    assert pool_response.json()["memberCount"] == 4
    assert buyer_response.status_code == 200
    buyer = buyer_response.json()
    assert buyer["intent"] == "BEST_BUYER"
    assert buyer["buyerName"] == "Shree Balaji Agro Traders"
    assert buyer["requirementQuantity"] == 100
    assert buyer["availableQuantity"] == 106
    assert buyer["trustScore"] == 94
    assert "सबसे अच्छा" in buyer["spokenResponseHi"]
    assert "सर्वोत्तम" in buyer["spokenResponseMr"]


def test_voice_query_rejects_empty_transcript(tmp_path: Path, monkeypatch) -> None:
    with _client_for(tmp_path / "voice.db", monkeypatch) as client:
        response = client.post("/api/voice-query", json={"transcript": "  "})

    assert response.status_code == 400
    assert response.json() == {"error": "Empty voice transcript"}
