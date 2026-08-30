"""FastAPI port of the existing lots CRUD handler."""

from __future__ import annotations

import json
import random
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from ..db import get_connection


router = APIRouter(prefix="/api")
DEFAULT_PHOTO = "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80"


class LotCreateRequest(BaseModel):
    """Old request fields plus optional Phase 5 location/pooling metadata."""

    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    farmer_name: str | None = Field(default=None, alias="farmerName")
    farmer_phone: str | None = Field(default=None, alias="farmerPhone")
    crop_id: str | None = Field(default=None, alias="cropId")
    mandi_id: str | None = Field(default=None, alias="mandiId")
    quantity: float | None = None
    unit: str = "quintal"
    photo_url: str | None = Field(default=None, alias="photoUrl")
    ai_grade: str | None = Field(default=None, alias="aiGrade")
    ai_confidence: float | None = Field(default=None, alias="aiConfidence")
    ai_defects: list[Any] = Field(default_factory=list, alias="aiDefects")
    floor_price: float | None = Field(default=None, alias="floorPrice")
    target_price: float | None = Field(default=None, alias="targetPrice")
    variety: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    available_from: str | None = Field(default=None, alias="availableFrom")
    available_until: str | None = Field(default=None, alias="availableUntil")
    pooling_enabled: bool = Field(default=True, alias="poolingEnabled")
    pooling_radius_km: float = Field(default=20, alias="poolingRadiusKm")


def _dict(row: Any) -> dict[str, Any]:
    return dict(row)


def _parse_json(value: Any, fallback: Any) -> Any:
    if not value:
        return fallback
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return fallback


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


@router.get("/lots")
def list_lots() -> Any:
    connection = get_connection()
    try:
        lots = [_dict(row) for row in connection.execute("SELECT * FROM lots ORDER BY created_at DESC")]
        enriched_lots = []
        for lot in lots:
            crop = connection.execute("SELECT * FROM crops WHERE id = ?", (lot["crop_id"],)).fetchone()
            mandi = connection.execute("SELECT * FROM mandis WHERE id = ?", (lot["mandi_id"],)).fetchone()
            events = [
                _dict(row)
                for row in connection.execute(
                    "SELECT * FROM negotiation_events WHERE lot_id = ? ORDER BY created_at ASC",
                    (lot["id"],),
                )
            ]
            lot["cropName"] = crop["name"] if crop else lot["crop_id"]
            lot["cropIcon"] = crop["icon"] if crop else "🌾"
            lot["mandiName"] = mandi["name"] if mandi else lot["mandi_id"]
            lot["aiDefects"] = _parse_json(lot.get("ai_defects"), [])
            lot["negotiationEvents"] = events
            enriched_lots.append(lot)

        buyers = []
        for row in connection.execute("SELECT * FROM buyers"):
            buyer = _dict(row)
            buyer["cropsWanted"] = _parse_json(buyer.get("crops_wanted"), [])
            buyers.append(buyer)
        return {"lots": enriched_lots, "buyers": buyers}
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)
    finally:
        connection.close()


@router.post("/lots")
def create_lot(request: LotCreateRequest) -> Any:
    # Match the current TS route's required-field semantics (zero is invalid).
    if (
        not request.farmer_name
        or not request.crop_id
        or not request.mandi_id
        or not request.quantity
        or not request.floor_price
        or not request.target_price
    ):
        return JSONResponse({"error": "Missing required lot creation fields"}, status_code=400)

    lot_id = f"LOT-{random.randint(1000, 9999)}"
    created_at = _now_iso()
    farmer_name = request.farmer_name.strip()
    farmer_phone = request.farmer_phone or "+91 98000 00000"
    ai_grade = request.ai_grade or "Grade A"
    ai_confidence = request.ai_confidence or 92.5
    photo_url = request.photo_url or DEFAULT_PHOTO

    connection = get_connection()
    try:
        with connection:
            connection.execute(
                """
                INSERT INTO lots (
                    id, farmer_name, farmer_phone, crop_id, mandi_id, quantity, unit,
                    photo_url, ai_grade, ai_confidence, ai_defects, floor_price,
                    target_price, current_offer, status, created_at, variety,
                    latitude, longitude, available_from, available_until,
                    pooling_enabled, pooling_radius_km
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'Active', ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    lot_id,
                    farmer_name,
                    farmer_phone,
                    request.crop_id,
                    request.mandi_id,
                    request.quantity,
                    request.unit,
                    photo_url,
                    ai_grade,
                    ai_confidence,
                    json.dumps(request.ai_defects, ensure_ascii=False),
                    request.floor_price,
                    request.target_price,
                    created_at,
                    request.variety,
                    request.latitude,
                    request.longitude,
                    request.available_from,
                    request.available_until,
                    int(request.pooling_enabled),
                    request.pooling_radius_km,
                ),
            )
            connection.execute(
                """
                INSERT INTO negotiation_events
                    (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
                VALUES (?, 'Farmer', ?, ?, ?, 'Offer', ?)
                """,
                (
                    lot_id,
                    request.farmer_name,
                    request.target_price,
                    f"New Produce Listed: {request.quantity} {request.unit} (AI-Assessed {ai_grade}). Expected target ₹{request.target_price:,.0f}/{request.unit}, Floor ₹{request.floor_price:,.0f}/{request.unit}.",
                    created_at,
                ),
            )
        return {"success": True, "lotId": lot_id}
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)
    finally:
        connection.close()
