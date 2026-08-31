import os
from pathlib import Path

from fastapi.testclient import TestClient

from app.config import load_local_env
from app.db import get_connection
from app.main import app


def test_health_response() -> None:
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"ok": True, "service": "kisansetu-python-api"}


def test_connection_creates_database_and_enables_pragmas(tmp_path: Path) -> None:
    database_path = tmp_path / "nested" / "kisansetu.db"

    with get_connection(database_path) as connection:
        journal_mode = connection.execute("PRAGMA journal_mode").fetchone()[0]
        foreign_keys = connection.execute("PRAGMA foreign_keys").fetchone()[0]
        assert connection.execute("SELECT 1").fetchone()[0] == 1

    assert database_path.exists()
    assert journal_mode.lower() == "wal"
    assert foreign_keys == 1


def test_local_env_loads_values_without_overriding_process_env(tmp_path: Path, monkeypatch) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text(
        "SARVAM_API_KEY=local-key\nHOST=local-host\n# ignored comment\n",
        encoding="utf-8",
    )
    monkeypatch.delenv("SARVAM_API_KEY", raising=False)
    monkeypatch.setenv("HOST", "process-host")

    load_local_env(env_file)

    assert os.environ["SARVAM_API_KEY"] == "local-key"
    assert os.environ["HOST"] == "process-host"
