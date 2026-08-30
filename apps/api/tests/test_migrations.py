import sqlite3
from pathlib import Path

import pytest

from app.db import MigrationError, get_connection, run_geo_pooling_migrations


LEGACY_SCHEMA = """
CREATE TABLE buyers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL,
    trust_score INTEGER NOT NULL,
    rating REAL NOT NULL,
    completed_trades INTEGER NOT NULL,
    payment_speed TEXT NOT NULL,
    crops_wanted TEXT NOT NULL,
    avatar TEXT NOT NULL
);

CREATE TABLE lots (
    id TEXT PRIMARY KEY,
    farmer_name TEXT NOT NULL,
    farmer_phone TEXT NOT NULL,
    crop_id TEXT NOT NULL,
    mandi_id TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    ai_grade TEXT NOT NULL,
    ai_confidence REAL NOT NULL,
    ai_defects TEXT,
    floor_price REAL NOT NULL,
    target_price REAL NOT NULL,
    current_offer REAL,
    highest_bidder_id TEXT,
    highest_bidder_name TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    escrow_amount REAL,
    escrow_status TEXT,
    created_at TEXT NOT NULL
);
"""


def _create_legacy_database(database_path: Path) -> None:
    with sqlite3.connect(database_path) as connection:
        connection.executescript(LEGACY_SCHEMA)
        connection.execute(
            """INSERT INTO buyers VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            ("b1", "Legacy Buyer", "Trader", "Nashik", 94, 4.8, 120, "Fast", "[]", "buyer.png"),
        )
        connection.execute(
            """
            INSERT INTO lots (
                id, farmer_name, farmer_phone, crop_id, mandi_id, quantity, unit,
                photo_url, ai_grade, ai_confidence, ai_defects, floor_price,
                target_price, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "LOT-1",
                "Legacy Farmer",
                "+91 90000 00000",
                "onion",
                "nashik",
                20,
                "quintal",
                "photo.png",
                "Grade A",
                92.5,
                "[]",
                1900,
                2250,
                "Active",
                "2026-08-30T00:00:00.000Z",
            ),
        )


def _column_names(connection: sqlite3.Connection, table_name: str) -> set[str]:
    return {row["name"] for row in connection.execute(f"PRAGMA table_info({table_name})")}


def test_geo_pooling_migration_preserves_legacy_data_and_is_idempotent(tmp_path: Path) -> None:
    database_path = tmp_path / "kisansetu.db"
    _create_legacy_database(database_path)

    run_geo_pooling_migrations(database_path)
    run_geo_pooling_migrations(database_path)

    with get_connection(database_path) as connection:
        assert {
            "variety",
            "latitude",
            "longitude",
            "available_from",
            "available_until",
            "pooling_enabled",
            "pooling_radius_km",
        }.issubset(_column_names(connection, "lots"))
        assert {
            "latitude",
            "longitude",
            "verified",
            "on_time_payments",
            "disputes",
            "cancellations",
        }.issubset(_column_names(connection, "buyers"))

        tables = {
            row["name"]
            for row in connection.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
        }
        assert {"buyer_requirements", "geo_pools", "geo_pool_members"}.issubset(tables)

        lot = connection.execute("SELECT * FROM lots WHERE id = 'LOT-1'").fetchone()
        buyer = connection.execute("SELECT * FROM buyers WHERE id = 'b1'").fetchone()
        assert lot["farmer_name"] == "Legacy Farmer"
        assert lot["quantity"] == 20
        assert lot["pooling_enabled"] == 1
        assert lot["pooling_radius_km"] == 20
        assert buyer["name"] == "Legacy Buyer"
        assert buyer["verified"] == 1
        assert buyer["on_time_payments"] == 0


def test_migration_requires_legacy_schema(tmp_path: Path) -> None:
    with pytest.raises(MigrationError, match="missing legacy table"):
        run_geo_pooling_migrations(tmp_path / "empty.db")
