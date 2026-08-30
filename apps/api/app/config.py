"""Configuration for the Python API skeleton.

This module deliberately has no feature or business configuration yet.  It only
resolves the repository database path without depending on the process cwd.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]


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
        )


settings = Settings.from_env()
