from pathlib import Path

from fastapi.testclient import TestClient

import app.db as db_module
from app.config import Settings
from app.main import app
from app.seed import seed_database


def test_speech_endpoint_returns_local_fallback_without_key(tmp_path: Path, monkeypatch) -> None:
    database_path = tmp_path / "speech.db"
    seed_database(database_path)
    monkeypatch.setattr(db_module, "settings", Settings(db_path=database_path))
    monkeypatch.setattr("app.services.sarvam.settings", Settings(db_path=database_path))
    with TestClient(app) as client:
        response = client.post("/api/speech", json={"text": "आपका मंडी भाव आज अच्छा है।", "language": "hi"})

    assert response.status_code == 200
    assert response.json() == {"available": False}


def test_speech_endpoint_returns_localized_provider_audio(monkeypatch) -> None:
    received: dict[str, str] = {}

    async def fake_synthesize_speech(text: str, language: str) -> dict[str, str]:
        received.update({"text": text, "language": language})
        return {
            "audioBase64": "d2F2LWF1ZGlv",
            "mimeType": "audio/wav",
            "language": "mr-IN",
        }

    monkeypatch.setattr("app.routers.speech.synthesize_speech", fake_synthesize_speech)
    with TestClient(app) as client:
        response = client.post(
            "/api/speech",
            json={"text": "नाशिकमध्ये कांद्याचा भाव", "language": "mr"},
        )

    assert response.status_code == 200
    assert received == {"text": "नाशिकमध्ये कांद्याचा भाव", "language": "mr"}
    assert response.json() == {
        "available": True,
        "audioBase64": "d2F2LWF1ZGlv",
        "mimeType": "audio/wav",
        "language": "mr-IN",
    }
