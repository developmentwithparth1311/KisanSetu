from app.services.advisory import compute_advisory


def _crop(crop_id: str = "onion", perishability: int = 2) -> dict:
    return {"id": crop_id, "name": crop_id.title(), "base_price": 100, "perishability": perishability}


def _history(values: list[int]) -> list[dict]:
    return [
        {
            "date": f"2026-08-{index + 1:02d}",
            "modal_price": value,
            "min_price": value - 5,
            "max_price": value + 5,
            "arrival_volume": 100,
        }
        for index, value in enumerate(values)
    ]


def test_empty_history_uses_typescript_fallback() -> None:
    result = compute_advisory([], _crop(), "Nashik APMC")
    assert result["decision"] == "WAIT"
    assert result["currentPrice"] == 100
    assert result["arrivalImpact"] == "Normal Supply"
    assert result["confidenceScore"] == 85


def test_strong_price_premium_recommends_sell_now() -> None:
    result = compute_advisory(_history([100] * 7 + [110]), _crop(), "Nashik APMC")
    assert result["decision"] == "SELL_NOW"
    assert result["pctVs30Day"] >= 8
    assert result["suggestedActionTimeline"] == "Next 24 - 48 Hours"


def test_depressed_storable_crop_recommends_store() -> None:
    result = compute_advisory(_history([100] * 7 + [80]), _crop(), "Nashik APMC")
    assert result["decision"] == "STORE"
    assert result["badgeTitle"] == "Store in Warehouse"


def test_upward_momentum_recommends_wait() -> None:
    result = compute_advisory(_history([100] * 7 + [105]), _crop(), "Nashik APMC")
    assert result["decision"] == "WAIT"
    assert result["suggestedActionTimeline"] == "3 - 5 Days"


def test_stable_perishable_crop_recommends_sell_now() -> None:
    result = compute_advisory(_history([100] * 8), _crop("tomato", 5), "Nashik APMC")
    assert result["decision"] == "SELL_NOW"
    assert result["perishabilityLabel"] == "Very High (1-3 Days)"
