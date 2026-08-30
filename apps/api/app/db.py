"""SQLite connection and additive Geo-Pooling migration helpers.

The Python service now owns an idempotent copy of the legacy schema for its
database/seed parity phase. These migrations intentionally alter an existing
legacy database in place and never drop or rebuild existing tables.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

from .config import settings


class MigrationError(RuntimeError):
    """Raised when the expected legacy database is not available to migrate."""


LOT_COLUMNS: dict[str, str] = {
    "variety": "TEXT",
    "latitude": "REAL",
    "longitude": "REAL",
    "available_from": "TEXT",
    "available_until": "TEXT",
    "pooling_enabled": "INTEGER DEFAULT 1",
    "pooling_radius_km": "REAL DEFAULT 20",
}

BUYER_COLUMNS: dict[str, str] = {
    "latitude": "REAL",
    "longitude": "REAL",
    "verified": "INTEGER DEFAULT 1",
    "on_time_payments": "INTEGER DEFAULT 0",
    "disputes": "INTEGER DEFAULT 0",
    "cancellations": "INTEGER DEFAULT 0",
}


CREATE_BUYER_REQUIREMENTS = """
CREATE TABLE IF NOT EXISTS buyer_requirements (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL,
    crop_id TEXT NOT NULL,
    variety TEXT,
    minimum_grade TEXT,
    required_quantity REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'quintal',
    offer_price REAL NOT NULL,
    delivery_latitude REAL,
    delivery_longitude REAL,
    delivery_by TEXT,
    payment_terms TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    FOREIGN KEY (buyer_id) REFERENCES buyers(id)
)
"""

CREATE_GEO_POOLS = """
CREATE TABLE IF NOT EXISTS geo_pools (
    id TEXT PRIMARY KEY,
    crop_id TEXT NOT NULL,
    variety TEXT,
    target_grade TEXT,
    centroid_latitude REAL NOT NULL,
    centroid_longitude REAL NOT NULL,
    radius_km REAL NOT NULL,
    total_quantity REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'quintal',
    status TEXT NOT NULL DEFAULT 'Suggested',
    created_at TEXT NOT NULL
)
"""

CREATE_GEO_POOL_MEMBERS = """
CREATE TABLE IF NOT EXISTS geo_pool_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pool_id TEXT NOT NULL,
    lot_id TEXT NOT NULL,
    farmer_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    accepted INTEGER NOT NULL DEFAULT 0,
    distance_from_anchor_km REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE(pool_id, lot_id),
    FOREIGN KEY (pool_id) REFERENCES geo_pools(id),
    FOREIGN KEY (lot_id) REFERENCES lots(id)
)
"""


LEGACY_SCHEMA = """
CREATE TABLE IF NOT EXISTS crops (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    unit TEXT NOT NULL,
    unit_short TEXT NOT NULL,
    perishability INTEGER NOT NULL,
    base_price REAL NOT NULL,
    volatility REAL NOT NULL,
    description TEXT,
    grades_json TEXT
);

CREATE TABLE IF NOT EXISTS mandis (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    distance_km INTEGER,
    badge TEXT
);

CREATE TABLE IF NOT EXISTS price_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop_id TEXT NOT NULL,
    mandi_id TEXT NOT NULL,
    date TEXT NOT NULL,
    min_price REAL NOT NULL,
    max_price REAL NOT NULL,
    modal_price REAL NOT NULL,
    arrival_volume INTEGER NOT NULL,
    UNIQUE(crop_id, mandi_id, date)
);

CREATE TABLE IF NOT EXISTS buyers (
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

CREATE TABLE IF NOT EXISTS lots (
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

CREATE TABLE IF NOT EXISTS negotiation_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lot_id TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    amount REAL NOT NULL,
    message TEXT NOT NULL,
    action_type TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


def get_connection(db_path: str | Path | None = None) -> sqlite3.Connection:
    """Open SQLite with row access, WAL mode, and foreign-key enforcement."""

    path = Path(db_path) if db_path is not None else settings.db_path
    path = path.expanduser().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def verify_connection(db_path: str | Path | None = None) -> None:
    """Open and close a connection as a startup smoke check."""

    with get_connection(db_path) as connection:
        connection.execute("SELECT 1").fetchone()


def initialize_schema(db_path: str | Path | None = None) -> None:
    """Create the legacy schema if absent, then apply additive migrations.

    Existing tables and rows are left in place. Feature seed data is separate
    and is only written by ``app.seed``.
    """

    connection = get_connection(db_path)
    try:
        connection.executescript(LEGACY_SCHEMA)
        connection.commit()
    finally:
        connection.close()
    run_geo_pooling_migrations(db_path)


def _table_exists(connection: sqlite3.Connection, table_name: str) -> bool:
    return (
        connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
            (table_name,),
        ).fetchone()
        is not None
    )


def _existing_columns(connection: sqlite3.Connection, table_name: str) -> set[str]:
    # Table names are controlled module constants, never user input.
    return {row["name"] for row in connection.execute(f"PRAGMA table_info({table_name})")}


def _add_missing_columns(
    connection: sqlite3.Connection, table_name: str, columns: dict[str, str]
) -> None:
    existing_columns = _existing_columns(connection, table_name)
    for column_name, definition in columns.items():
        if column_name not in existing_columns:
            # Both parts originate from the fixed constants above, not input.
            connection.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}")


def run_geo_pooling_migrations(db_path: str | Path | None = None) -> None:
    """Apply only additive Phase 2 Geo-Pooling/Buyer-Requirement migrations.

    The function requires the legacy `lots` and `buyers` tables rather than
    inventing an incomplete replacement schema. Re-running it only observes
    existing columns/tables and therefore preserves all existing data.
    """

    with get_connection(db_path) as connection:
        missing_tables = [
            table_name for table_name in ("lots", "buyers") if not _table_exists(connection, table_name)
        ]
        if missing_tables:
            names = ", ".join(missing_tables)
            raise MigrationError(
                f"Cannot apply Geo-Pooling migrations: missing legacy table(s): {names}. "
                "Initialize the existing KisanSetu schema first."
            )

        with connection:
            _add_missing_columns(connection, "lots", LOT_COLUMNS)
            _add_missing_columns(connection, "buyers", BUYER_COLUMNS)
            connection.execute(CREATE_BUYER_REQUIREMENTS)
            connection.execute(CREATE_GEO_POOLS)
            connection.execute(CREATE_GEO_POOL_MEMBERS)


def init_schema(db_path: str | Path | None = None) -> None:
    """Compatibility name for the complete legacy-plus-additive initializer."""

    initialize_schema(db_path)


def run_migrations(db_path: str | Path | None = None) -> None:
    """Compatibility name for the additive Phase 2 migrations."""

    run_geo_pooling_migrations(db_path)
