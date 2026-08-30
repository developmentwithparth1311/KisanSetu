"""Idempotent Python port of the deterministic KisanSetu demo seed.

The legacy crop, mandi, buyer, price-history, lot, and negotiation data mirrors
``lib/seed.ts``. The final section adds only the Phase 2 deterministic
Geo-Pooling demonstration data; pooling and matching algorithms are later
phases.
"""

from __future__ import annotations

import json
import math
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .db import get_connection, initialize_schema
from .services.seeded_random import create_seeded_random


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
CROP_DATA_PATH = REPOSITORY_ROOT / "data" / "seed" / "crops-mandis.json"
BUYER_DATA_PATH = REPOSITORY_ROOT / "data" / "seed" / "buyers.json"

DEMO_GEO_CREATED_AT = "2026-08-30T00:00:00.000Z"
DEMO_GEO_LOTS = (
    {
        "id": "LOT-GEO-PRIMARY",
        "farmer_name": "Ramesh Patil (Demo)",
        "farmer_phone": "+91 98231 44520",
        "quantity": 20,
        "latitude": 20.011,
        "longitude": 73.790,
        "floor_price": 1900,
        "target_price": 2250,
        "photo_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
    },
    {
        "id": "LOT-GEO-B",
        "farmer_name": "Farmer B (Demo)",
        "farmer_phone": "+91 90000 00001",
        "quantity": 35,
        "latitude": 20.018,
        "longitude": 73.801,
        "floor_price": 1880,
        "target_price": 2200,
        "photo_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
    },
    {
        "id": "LOT-GEO-C",
        "farmer_name": "Farmer C (Demo)",
        "farmer_phone": "+91 90000 00002",
        "quantity": 26,
        "latitude": 20.043,
        "longitude": 73.776,
        "floor_price": 1875,
        "target_price": 2200,
        "photo_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
    },
    {
        "id": "LOT-GEO-D",
        "farmer_name": "Farmer D (Demo)",
        "farmer_phone": "+91 90000 00003",
        "quantity": 25,
        "latitude": 19.972,
        "longitude": 73.795,
        "floor_price": 1890,
        "target_price": 2220,
        "photo_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
    },
)


def _js_round(value: float) -> int:
    """Match JavaScript Math.round for the positive seed values."""

    return math.floor(value + 0.5)


def _iso_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _crop_trend_narrative(crop_id: str, day_offset: int) -> float:
    intensity = (10 - day_offset) / 10
    return {
        "tomato": 0.012,
        "onion": -0.015,
        "potato": 0.002,
        "wheat": 0.005,
        "soybean": 0.009,
    }.get(crop_id, 0) * intensity


def _load_seed_data() -> tuple[dict, list[dict]]:
    with CROP_DATA_PATH.open(encoding="utf-8") as crop_file:
        crop_data = json.load(crop_file)
    with BUYER_DATA_PATH.open(encoding="utf-8") as buyer_file:
        buyer_data = json.load(buyer_file)
    return crop_data, buyer_data


def _seed_legacy_data(connection: sqlite3.Connection, now: datetime) -> None:
    crop_data, buyer_data = _load_seed_data()
    rand = create_seeded_random(42)

    for crop in crop_data["crops"]:
        connection.execute(
            """
            INSERT OR IGNORE INTO crops
                (id, name, icon, unit, unit_short, perishability, base_price,
                 volatility, description, grades_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                crop["id"],
                crop["name"],
                crop["icon"],
                crop["unit"],
                crop["unitShort"],
                crop["perishability"],
                crop["basePrice"],
                crop["volatility"],
                crop["description"],
                json.dumps(crop["grades"], ensure_ascii=False, separators=(",", ":")),
            ),
        )

    for mandi in crop_data["mandis"]:
        connection.execute(
            "INSERT OR IGNORE INTO mandis (id, name, state, distance_km, badge) VALUES (?, ?, ?, ?, ?)",
            (mandi["id"], mandi["name"], mandi["state"], mandi["distanceKm"], mandi["badge"]),
        )

    for buyer in buyer_data:
        connection.execute(
            """
            INSERT OR IGNORE INTO buyers
                (id, name, type, location, trust_score, rating, completed_trades,
                 payment_speed, crops_wanted, avatar)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                buyer["id"],
                buyer["name"],
                buyer["type"],
                buyer["location"],
                buyer["trustScore"],
                buyer["rating"],
                buyer["completedTrades"],
                buyer["paymentSpeed"],
                json.dumps(buyer["cropsWanted"], ensure_ascii=False, separators=(",", ":")),
                buyer["avatar"],
            ),
        )

    for crop in crop_data["crops"]:
        for mandi_index, mandi in enumerate(crop_data["mandis"]):
            price = crop["basePrice"] * (1 + (mandi_index - 1) * 0.04)
            for day_offset in range(90, -1, -1):
                date_string = (now - timedelta(days=day_offset)).date().isoformat()
                noise = (rand() - 0.48) * crop["volatility"]
                price = max(crop["basePrice"] * 0.55, price * (1 + noise))
                if day_offset <= 10:
                    price *= 1 + _crop_trend_narrative(crop["id"], day_offset)

                modal_price = _js_round(price)
                min_price = _js_round(modal_price * 0.93)
                max_price = _js_round(modal_price * 1.07)
                arrival_volume = _js_round(100 + rand() * 350)
                connection.execute(
                    """
                    INSERT OR REPLACE INTO price_points
                        (crop_id, mandi_id, date, min_price, max_price, modal_price, arrival_volume)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        crop["id"],
                        mandi["id"],
                        date_string,
                        min_price,
                        max_price,
                        modal_price,
                        arrival_volume,
                    ),
                )

    old_lots = (
        {
            "id": "LOT-7821",
            "farmer_name": "Ramesh Patil (रमेश पाटिल)",
            "farmer_phone": "+91 98231 44520",
            "crop_id": "tomato",
            "quantity": 50,
            "floor_price": 1950,
            "target_price": 2300,
            "photo_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
            "ai_confidence": 94.2,
            "ai_defects": ["Uniform Crimson Color", "Firm Flesh (>90%)", "Zero Pest Marks"],
            "current_offer": 2150,
            "highest_bidder_id": "b1",
            "highest_bidder_name": "Shree Balaji Agro Traders",
            "status": "Under Negotiation",
            "created_at": _iso_utc(now - timedelta(hours=4)),
        },
        {
            "id": "LOT-6540",
            "farmer_name": "Suresh Gaikwad",
            "farmer_phone": "+91 94220 88192",
            "crop_id": "onion",
            "quantity": 80,
            "floor_price": 1550,
            "target_price": 1850,
            "photo_url": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
            "ai_confidence": 91.8,
            "ai_defects": ["Clean dry outer layer", "Average 55mm bulb", "Low moisture content"],
            "current_offer": None,
            "highest_bidder_id": None,
            "highest_bidder_name": None,
            "status": "Active",
            "created_at": _iso_utc(now - timedelta(hours=8)),
        },
    )
    for lot in old_lots:
        connection.execute(
            """
            INSERT OR IGNORE INTO lots
                (id, farmer_name, farmer_phone, crop_id, mandi_id, quantity, unit,
                 photo_url, ai_grade, ai_confidence, ai_defects, floor_price,
                 target_price, current_offer, highest_bidder_id, highest_bidder_name,
                 status, escrow_amount, escrow_status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                lot["id"],
                lot["farmer_name"],
                lot["farmer_phone"],
                lot["crop_id"],
                "nashik",
                lot["quantity"],
                "quintal",
                lot["photo_url"],
                "Grade A",
                lot["ai_confidence"],
                json.dumps(lot["ai_defects"], ensure_ascii=False, separators=(",", ":")),
                lot["floor_price"],
                lot["target_price"],
                lot["current_offer"],
                lot["highest_bidder_id"],
                lot["highest_bidder_name"],
                lot["status"],
                None,
                None,
                lot["created_at"],
            ),
        )

    events = (
        (
            "LOT-7821",
            "Farmer",
            "Ramesh Patil",
            2300,
            "Listed 50 qtl Grade A Tomatoes at target price ₹2,300/qtl (Floor: ₹1,950).",
            "Offer",
            _iso_utc(now - timedelta(hours=4)),
        ),
        (
            "LOT-7821",
            "Buyer",
            "Shree Balaji Agro Traders",
            1850,
            "Offered ₹1,850/qtl for immediate dispatch to Vashi market.",
            "Offer",
            _iso_utc(now - timedelta(hours=3)),
        ),
        (
            "LOT-7821",
            "AI_Agent",
            "KisanSetu AI Agent",
            2150,
            "Counter-offered ₹2,150/qtl. AI analysis: Produce is Grade A with 94.2% quality score, and Nashik mandi modal price has surged +8.4% this week. ₹1,850 is below farmer floor of ₹1,950.",
            "Counter",
            _iso_utc(now - timedelta(hours=2)),
        ),
    )
    for event in events:
        exists = connection.execute(
            """
            SELECT 1 FROM negotiation_events
            WHERE lot_id = ? AND sender_type = ? AND action_type = ? AND amount = ?
            """,
            event[:1] + event[1:2] + event[5:6] + event[3:4],
        ).fetchone()
        if exists is None:
            connection.execute(
                """
                INSERT INTO negotiation_events
                    (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                event,
            )


def _seed_geo_pool(connection: sqlite3.Connection) -> None:
    for lot in DEMO_GEO_LOTS:
        connection.execute(
            """
            INSERT OR IGNORE INTO lots
                (id, farmer_name, farmer_phone, crop_id, mandi_id, quantity, unit,
                 photo_url, ai_grade, ai_confidence, ai_defects, floor_price,
                 target_price, status, created_at, variety, latitude, longitude,
                 available_from, available_until, pooling_enabled, pooling_radius_km)
            VALUES (?, ?, ?, 'onion', 'nashik', ?, 'quintal', ?, 'Grade A', 92.0,
                    '[]', ?, ?, 'Active', ?, 'Red Onion', ?, ?, '2026-08-30',
                    '2026-09-02', 1, 20)
            """,
            (
                lot["id"],
                lot["farmer_name"],
                lot["farmer_phone"],
                lot["quantity"],
                lot["photo_url"],
                lot["floor_price"],
                lot["target_price"],
                DEMO_GEO_CREATED_AT,
                lot["latitude"],
                lot["longitude"],
            ),
        )

    # Add deterministic location/trust metadata without overwriting an
    # existing buyer's non-null values in a pre-seeded database.
    connection.execute(
        """
        UPDATE buyers
        SET latitude = COALESCE(latitude, 19.0760),
            longitude = COALESCE(longitude, 72.8777),
            verified = COALESCE(verified, 1),
            on_time_payments = COALESCE(on_time_payments, 142),
            disputes = COALESCE(disputes, 0),
            cancellations = COALESCE(cancellations, 0)
        WHERE id = 'b1'
        """
    )

    buyer_exists = connection.execute("SELECT 1 FROM buyers WHERE id = 'b1'").fetchone()
    if buyer_exists is None:
        raise RuntimeError("Cannot seed Shree Balaji requirement: buyer b1 is missing")

    connection.execute(
        """
        INSERT OR IGNORE INTO buyer_requirements
            (id, buyer_id, crop_id, variety, minimum_grade, required_quantity, unit,
             offer_price, delivery_latitude, delivery_longitude, delivery_by,
             payment_terms, active, created_at)
        VALUES ('REQ-B1-ONION-100', 'b1', 'onion', 'Red Onion', 'Grade A', 100,
                'quintal', 2030, 19.0760, 72.8777, '2026-09-03',
                'Instant Escrow', 1, ?)
        """,
        (DEMO_GEO_CREATED_AT,),
    )

    connection.execute(
        """
        INSERT OR IGNORE INTO geo_pools
            (id, crop_id, variety, target_grade, centroid_latitude,
             centroid_longitude, radius_km, total_quantity, unit, status, created_at)
        VALUES ('POOL-NSK-ON-01', 'onion', 'Red Onion', 'Grade A', 20.011,
                73.790, 20, 106, 'quintal', 'Suggested', ?)
        """,
        (DEMO_GEO_CREATED_AT,),
    )

    distances = {"LOT-GEO-PRIMARY": 0.0, "LOT-GEO-B": 1.3, "LOT-GEO-C": 3.9, "LOT-GEO-D": 4.4}
    for lot in DEMO_GEO_LOTS:
        connection.execute(
            """
            INSERT OR IGNORE INTO geo_pool_members
                (pool_id, lot_id, farmer_name, quantity, accepted,
                 distance_from_anchor_km, created_at)
            VALUES ('POOL-NSK-ON-01', ?, ?, ?, 1, ?, ?)
            """,
            (
                lot["id"],
                lot["farmer_name"],
                lot["quantity"],
                distances[lot["id"]],
                DEMO_GEO_CREATED_AT,
            ),
        )


def seed_database(db_path: str | Path | None = None) -> None:
    """Initialize schema and seed legacy plus deterministic Feature 5 data."""

    initialize_schema(db_path)
    connection = get_connection(db_path)
    try:
        with connection:
            crop_count = connection.execute("SELECT COUNT(*) AS count FROM crops").fetchone()["count"]
            if crop_count == 0:
                now = datetime.now(timezone.utc)
                _seed_legacy_data(connection, now)
            _seed_geo_pool(connection)
    finally:
        connection.close()


if __name__ == "__main__":
    seed_database()
    print("[Seed] KisanSetu database seeded successfully.")
