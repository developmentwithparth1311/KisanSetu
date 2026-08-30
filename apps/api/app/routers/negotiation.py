"""FastAPI negotiation endpoint with explicit farmer finalization."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from ..db import get_connection
from ..services.gemini import enhance_negotiation_wording
from ..services.negotiation import evaluate_buyer_offer


router = APIRouter(prefix="/api")


class NegotiateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    lot_id: str | None = Field(default=None, alias="lotId")
    action: str = "buyer_bid"
    buyer_id: str | None = Field(default=None, alias="buyerId")
    buyer_name: str | None = Field(default=None, alias="buyerName")
    pool_id: str | None = Field(default=None, alias="poolId")
    offer_amount: float | None = Field(default=None, alias="offerAmount")
    custom_message: str | None = Field(default=None, alias="customMessage")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _events(connection: Any, lot_id: str) -> list[dict[str, Any]]:
    return [dict(row) for row in connection.execute(
        "SELECT * FROM negotiation_events WHERE lot_id = ? ORDER BY created_at ASC, id ASC", (lot_id,)
    )]


def _pool_quantity_for_lot(connection: Any, pool_id: str, lot_id: str) -> float | None:
    """Return persisted pooled quantity only when the anchor lot belongs to it.

    Negotiation events remain associated with the selected anchor lot so the
    legacy ledger contract is unchanged.  The submitted pool ID may only alter
    the settlement quantity when that lot is a member of the persisted pool.
    """

    row = connection.execute(
        """SELECT p.total_quantity
        FROM geo_pools p
        JOIN geo_pool_members gm ON gm.pool_id = p.id
        WHERE p.id = ? AND gm.lot_id = ?""",
        (pool_id, lot_id),
    ).fetchone()
    return float(row["total_quantity"]) if row is not None else None


@router.post("/negotiate")
async def negotiate(request: NegotiateRequest) -> Any:
    if not request.lot_id:
        return JSONResponse({"error": "Lot not found"}, status_code=404)
    connection = get_connection()
    try:
        lot_row = connection.execute("SELECT * FROM lots WHERE id = ?", (request.lot_id,)).fetchone()
        if not lot_row:
            return JSONResponse({"error": "Lot not found"}, status_code=404)
        lot = dict(lot_row)
        now = _now()
        pooled_quantity = None
        if request.pool_id:
            pooled_quantity = _pool_quantity_for_lot(connection, request.pool_id, request.lot_id)
            if pooled_quantity is None:
                return JSONResponse({"error": "Pool not found or does not include this lot"}, status_code=400)
        negotiation_quantity = pooled_quantity if pooled_quantity is not None else float(lot["quantity"])

        if request.action == "buyer_bid":
            if request.offer_amount is None or request.offer_amount <= 0:
                return JSONResponse({"error": "A positive offerAmount is required"}, status_code=400)
            crop = connection.execute("SELECT * FROM crops WHERE id = ?", (lot["crop_id"],)).fetchone()
            buyer = connection.execute("SELECT * FROM buyers WHERE id = ?", (request.buyer_id,)).fetchone()
            price = connection.execute(
                "SELECT modal_price FROM price_points WHERE crop_id = ? AND mandi_id = ? ORDER BY date DESC LIMIT 1",
                (lot["crop_id"], lot["mandi_id"]),
            ).fetchone()
            buyer_data = dict(buyer) if buyer else {}
            crop_data = dict(crop) if crop else {}
            buyer_name = request.buyer_name or buyer_data.get("name") or "Verified Agro Trader"
            existing = _events(connection, request.lot_id)
            rounds = sum(event["sender_type"] == "Buyer" for event in existing) + 1
            with connection:
                connection.execute(
                    """INSERT INTO negotiation_events
                    (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
                    VALUES (?, 'Buyer', ?, ?, ?, 'Offer', ?)""",
                    (
                        request.lot_id, buyer_name, request.offer_amount,
                        request.custom_message or f"Placed a purchase offer of Rs {request.offer_amount:,.0f}/{lot['unit']}.", now,
                    ),
                )
                decision = evaluate_buyer_offer({
                    "lotId": lot["id"], "farmerName": lot["farmer_name"],
                    "cropName": crop_data.get("name", lot["crop_id"]), "quantity": negotiation_quantity,
                    "unit": lot["unit"], "aiGrade": lot["ai_grade"], "aiConfidence": lot["ai_confidence"],
                    "floorPrice": lot["floor_price"], "targetPrice": lot["target_price"],
                    "buyerName": buyer_name, "buyerTrustScore": buyer_data.get("trust_score", 88),
                    "offerAmount": request.offer_amount,
                    "currentMandiModalPrice": price["modal_price"] if price else crop_data.get("base_price", 1800),
                    "negotiationRound": rounds,
                })
                decision, gemini_used = await enhance_negotiation_wording({
                    "floorPrice": lot["floor_price"], "cropName": crop_data.get("name", lot["crop_id"]),
                    "buyerName": buyer_name, "unit": lot["unit"],
                }, decision)
                connection.execute(
                    """INSERT INTO negotiation_events
                    (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
                    VALUES (?, 'AI_Agent', 'KisanSetu AI Agent', ?, ?, ?, ?)""",
                    (request.lot_id, decision["amount"], decision["message"], decision["action"], now),
                )
                connection.execute(
                    """UPDATE lots SET current_offer = ?, highest_bidder_id = ?, highest_bidder_name = ?,
                    status = ?, escrow_amount = NULL, escrow_status = NULL WHERE id = ?""",
                    (decision["amount"], request.buyer_id or "b1", buyer_name, decision["statusUpdate"], request.lot_id),
                )
            return {
                "success": True, "aiEvaluation": decision, "events": _events(connection, request.lot_id),
                "lotStatus": decision["statusUpdate"], "isGeminiPowered": gemini_used,
                "effectiveQuantity": negotiation_quantity,
            }

        if request.action == "farmer_accept":
            final_price = lot["current_offer"] if lot["current_offer"] is not None else lot["target_price"]
            if float(final_price) < float(lot["floor_price"]):
                return JSONResponse({"error": "Cannot finalize below the farmer floor price"}, status_code=400)
            if lot["status"] != "Recommended Accept" or lot["current_offer"] is None:
                return JSONResponse(
                    {"error": "Farmer can finalize only a buyer offer recommended for acceptance"},
                    status_code=400,
                )
            total = float(final_price) * negotiation_quantity
            with connection:
                connection.execute(
                    """INSERT INTO negotiation_events
                    (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
                    VALUES (?, 'Farmer', ?, ?, ?, 'Accept', ?)""",
                    (request.lot_id, lot["farmer_name"], final_price,
                     f"Farmer confirmed the final price of Rs {final_price:,.0f}/{lot['unit']}"
                     f" for {negotiation_quantity:g} {lot['unit']}. Simulated settlement amount: Rs {total:,.0f}.", now),
                )
                connection.execute(
                    "UPDATE lots SET status = 'Sold', escrow_amount = ?, escrow_status = 'Held' WHERE id = ?",
                    (total, request.lot_id),
                )
            return {"success": True, "message": "Deal confirmed by the farmer. Simulated settlement amount recorded.",
                    "events": _events(connection, request.lot_id), "lotStatus": "Sold", "escrowAmount": total,
                    "effectiveQuantity": negotiation_quantity}

        if request.action == "farmer_counter":
            if request.offer_amount is None or request.offer_amount < float(lot["floor_price"]):
                return JSONResponse({"error": "Farmer counter cannot be below the farmer floor price"}, status_code=400)
            with connection:
                connection.execute(
                    """INSERT INTO negotiation_events
                    (lot_id, sender_type, sender_name, amount, message, action_type, created_at)
                    VALUES (?, 'Farmer', ?, ?, ?, 'Counter', ?)""",
                    (request.lot_id, lot["farmer_name"], request.offer_amount,
                     request.custom_message or f"Farmer countered at Rs {request.offer_amount:,.0f}/{lot['unit']}.", now),
                )
                connection.execute("UPDATE lots SET current_offer = ?, status = 'Under Negotiation' WHERE id = ?",
                                   (request.offer_amount, request.lot_id))
            return {"success": True, "events": _events(connection, request.lot_id), "lotStatus": "Under Negotiation"}

        return JSONResponse({"error": "Invalid action"}, status_code=400)
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)
    finally:
        connection.close()
