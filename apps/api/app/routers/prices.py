"""FastAPI port of the existing ``GET /api/prices`` handler."""

from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..db import get_connection
from ..services.advisory import compute_advisory
from ..services.market_data import fetch_live_agmarknet_prices
from ..services.weather import fetch_mandi_weather


router = APIRouter(prefix="/api")


def _dict(row: Any) -> dict[str, Any]:
    return dict(row)


@router.get("/prices")
async def prices(
    crop: str = Query(default="tomato"),
    mandi: str = Query(default="nashik"),
    days: int = Query(default=30),
) -> Any:
    connection = get_connection()
    try:
        crops = [_dict(row) for row in connection.execute("SELECT * FROM crops").fetchall()]
        mandis = [_dict(row) for row in connection.execute("SELECT * FROM mandis").fetchall()]
        selected_crop_row = connection.execute("SELECT * FROM crops WHERE id = ?", (crop,)).fetchone()
        selected_mandi_row = connection.execute("SELECT * FROM mandis WHERE id = ?", (mandi,)).fetchone()
        if selected_crop_row is None or selected_mandi_row is None:
            return JSONResponse({"error": "Crop or Mandi not found"}, status_code=404)

        selected_crop = _dict(selected_crop_row)
        selected_mandi = _dict(selected_mandi_row)
        all_points = [
            _dict(row)
            for row in connection.execute(
                "SELECT * FROM price_points WHERE crop_id = ? AND mandi_id = ? ORDER BY date ASC",
                (crop, mandi),
            ).fetchall()
        ]
        requested_points = all_points[-days:] if days != 0 else all_points

        comparisons = []
        for market in mandis:
            latest = connection.execute(
                """
                SELECT * FROM price_points
                WHERE crop_id = ? AND mandi_id = ?
                ORDER BY date DESC LIMIT 1
                """,
                (crop, market["id"]),
            ).fetchone()
            latest_dict = _dict(latest) if latest is not None else {}
            comparisons.append(
                {
                    "mandiId": market["id"],
                    "mandiName": market["name"],
                    "state": market["state"],
                    "distanceKm": market.get("distance_km"),
                    "badge": market.get("badge"),
                    "currentModalPrice": latest_dict.get("modal_price") or selected_crop["base_price"],
                    "arrivalVolume": latest_dict.get("arrival_volume") or 120,
                    "isCurrent": market["id"] == mandi,
                }
            )
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)
    finally:
        connection.close()

    selected_crop["grades"] = json.loads(selected_crop["grades_json"]) if selected_crop.get("grades_json") else []
    weather, live_records = await asyncio.gather(
        fetch_mandi_weather(mandi),
        fetch_live_agmarknet_prices(selected_crop["name"], selected_mandi["name"]),
    )
    return {
        "crops": crops,
        "mandis": mandis,
        "selectedCrop": selected_crop,
        "selectedMandi": selected_mandi,
        "priceHistory": requested_points,
        "allHistoryCount": len(all_points),
        "latestPricePoint": requested_points[-1] if requested_points else None,
        "mandiComparisons": comparisons,
        "advisory": compute_advisory(all_points, selected_crop, selected_mandi["name"]),
        "weather": weather,
        "isLiveAgmarknet": bool(live_records),
    }
