from pathlib import Path

import pytest

from app.db import get_connection
from app.seed import seed_database
from app.services.seeded_random import create_seeded_random


def test_seeded_random_matches_typescript_park_miller() -> None:
    random_value = create_seeded_random(42)
    assert random_value() == pytest.approx(0.0003287070433876543)
    assert random_value() == pytest.approx(0.5245871017916008)


def test_seed_preserves_legacy_demo_and_adds_exact_geo_pool(tmp_path: Path) -> None:
    database_path = tmp_path / "seeded.db"

    seed_database(database_path)
    seed_database(database_path)

    with get_connection(database_path) as connection:
        counts = {
            table: connection.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            for table in (
                "crops",
                "mandis",
                "price_points",
                "buyers",
                "lots",
                "negotiation_events",
                "buyer_requirements",
                "geo_pools",
                "geo_pool_members",
            )
        }
        assert counts == {
            "crops": 5,
            "mandis": 4,
            "price_points": 1820,
            "buyers": 5,
            "lots": 6,
            "negotiation_events": 3,
            "buyer_requirements": 1,
            "geo_pools": 1,
            "geo_pool_members": 4,
        }

        pool = connection.execute(
            "SELECT * FROM geo_pools WHERE id = 'POOL-NSK-ON-01'"
        ).fetchone()
        assert pool["total_quantity"] == 106
        assert pool["crop_id"] == "onion"
        assert pool["variety"] == "Red Onion"

        member_total = connection.execute(
            "SELECT SUM(quantity) FROM geo_pool_members WHERE pool_id = 'POOL-NSK-ON-01'"
        ).fetchone()[0]
        assert member_total == 106

        requirement = connection.execute(
            "SELECT * FROM buyer_requirements WHERE id = 'REQ-B1-ONION-100'"
        ).fetchone()
        assert requirement["buyer_id"] == "b1"
        assert requirement["required_quantity"] == 100
        assert requirement["offer_price"] == 2030
        assert requirement["minimum_grade"] == "Grade A"

        tomato_lot = connection.execute(
            "SELECT * FROM lots WHERE id = 'LOT-7821'"
        ).fetchone()
        assert tomato_lot["farmer_name"] == "Ramesh Patil (रमेश पाटिल)"
        assert tomato_lot["quantity"] == 50


def test_seed_can_add_feature_data_to_an_existing_legacy_seed(tmp_path: Path) -> None:
    database_path = tmp_path / "legacy.db"
    seed_database(database_path)

    with get_connection(database_path) as connection:
        connection.execute("DELETE FROM geo_pool_members")
        connection.execute("DELETE FROM geo_pools")
        connection.execute("DELETE FROM buyer_requirements")
        connection.commit()

    seed_database(database_path)

    with get_connection(database_path) as connection:
        assert connection.execute("SELECT COUNT(*) FROM crops").fetchone()[0] == 5
        assert connection.execute("SELECT COUNT(*) FROM buyer_requirements").fetchone()[0] == 1
        assert connection.execute("SELECT COUNT(*) FROM geo_pools").fetchone()[0] == 1
        assert connection.execute("SELECT COUNT(*) FROM geo_pool_members").fetchone()[0] == 4
