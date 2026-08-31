"""Configuration for the Python API skeleton.

This module deliberately has no feature or business configuration yet.  It only
resolves the repository database path without depending on the process cwd.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
API_ROOT = Path(__file__).resolve().parents[1]
LOCAL_ENV_FILE = API_ROOT / ".env"


def load_local_env(path: Path = LOCAL_ENV_FILE) -> None:
    """Load a small local .env file without overriding process variables.

    The API intentionally avoids a dotenv dependency. Production/container
    environment variables still win over local development values.
    """

    if not path.is_file():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name = name.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        if name:
            os.environ.setdefault(name, value)


load_local_env()


def _resolve_db_path(value: str | None) -> Path:
    """Resolve a configured database path, keeping relative paths repo-local."""

    configured = value or os.getenv("KISANSETU_DB_PATH")
    if not configured:
        return REPOSITORY_ROOT / "data" / "kisansetu.db"

    path = Path(configured).expanduser()
    return path if path.is_absolute() else (REPOSITORY_ROOT / path).resolve()


@dataclass(frozen=True)
class Settings:
    """Minimal Phase 1 settings; feature settings belong to later phases."""

    db_path: Path
    host: str = "127.0.0.1"
    port: int = 8000
    sarvam_api_key: str = ""

    @classmethod
    def from_env(cls) -> "Settings":
        port_value = os.getenv("PORT", "8000")
        try:
            port = int(port_value)
        except ValueError as exc:
            raise ValueError("PORT must be an integer") from exc
        return cls(
            db_path=_resolve_db_path(None),
            host=os.getenv("HOST", "127.0.0.1"),
            port=port,
            sarvam_api_key=os.getenv("SARVAM_API_KEY", "").strip(),
        )


settings = Settings.from_env()
