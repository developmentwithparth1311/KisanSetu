"""Buyer RFQ and deterministic supply-match endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from ..db import get_connection
from ..services.matching import evaluate_buyer_feasibility, score_feasible_match


router = APIRouter(prefix="/api")


def _supply_from_lot(connection: Any, lot_id: str) -> dict[str, Any] | None:
    row = connection.execute("SELECT * FROM lots WHERE id = ?", (lot_id,)).fetchone()
    if row is None:
        return None
    lot = dict(row)
    return {
        "supplyType": "LOT", "supplyId": lot_id, "crop_id": lot["crop_id"], "variety": lot["variety"],
        "minimum_grade": lot["ai_grade"], "member_grades": [lot["ai_grade"]], "quantity": lot["quantity"],
        "unit": lot["unit"], "latitude": lot["latitude"], "longitude": lot["longitude"],
        "available_until": lot["available_until"],
    }


def _supply_from_pool(connection: Any, pool_id: str) -> dict[str, Any] | None:
    row = connection.execute("SELECT * FROM geo_pools WHERE id = ?", (pool_id,)).fetchone()
    if row is None:
        return None
    pool = dict(row)
    members = [dict(item) for item in connection.execute(
        """SELECT l.ai_grade, l.available_until FROM geo_pool_members gm
        JOIN lots l ON l.id = gm.lot_id WHERE gm.pool_id = ?""", (pool_id,)
    )]
    dates = sorted(value["available_until"] for value in members if value["available_until"])
    return {
        "supplyType": "POOL", "supplyId": pool_id, "crop_id": pool["crop_id"], "variety": pool["variety"],
        "minimum_grade": pool["target_grade"], "member_grades": [member["ai_grade"] for member in members],
        "quantity": pool["total_quantity"], "unit": pool["unit"], "latitude": pool["centroid_latitude"],
        "longitude": pool["centroid_longitude"], "available_until": dates[0] if dates else None,
    }


def _match_payload(supply: dict[str, Any], requirement: dict[str, Any], buyer: dict[str, Any]) -> dict[str, Any]:
    feasibility = evaluate_buyer_feasibility(supply, requirement, buyer)
    score = score_feasible_match(supply, requirement, buyer, feasibility)
    payload = {
        "requirementId": requirement["id"], "buyerId": buyer["id"], "buyerName": buyer["name"],
        "feasible": feasibility.feasible, "requirementQuantity": requirement["required_quantity"],
        "availableQuantity": supply["quantity"], "unit": supply["unit"], "cropId": requirement["crop_id"],
        "variety": requirement["variety"], "minimumGrade": requirement["minimum_grade"],
        "offerPrice": requirement["offer_price"], "reasons": feasibility.reasons,
    }
    if score is None:
        return payload | {"matchScore": None, "trustScore": buyer.get("trust_score"), "effectivePrice": None}
    return payload | score | {"reasons": [*feasibility.reasons, *score["trustReasons"], "Delivery distance is feasible."]}


@router.get("/buyer-requirements")
def buyer_requirements(active_only: bool = Query(default=False, alias="activeOnly")) -> dict[str, Any]:
    connection = get_connection()
    try:
        query = """SELECT requirement.*, buyer.name AS buyer_name FROM buyer_requirements requirement
                   JOIN buyers buyer ON buyer.id = requirement.buyer_id"""
        if active_only:
            query += " WHERE requirement.active = 1"
        rows = []
        for row in connection.execute(query):
            value = dict(row)
            value["buyerName"] = value.pop("buyer_name")
            rows.append(value)
        return {"requirements": rows}
    finally:
        connection.close()


@router.get("/matches")
def matches(lot_id: str | None = Query(default=None, alias="lotId"), pool_id: str | None = Query(default=None, alias="poolId")) -> Any:
    if bool(lot_id) == bool(pool_id):
        return JSONResponse({"error": "Provide exactly one of lotId or poolId"}, status_code=400)
    connection = get_connection()
    try:
        supply = _supply_from_lot(connection, lot_id) if lot_id else _supply_from_pool(connection, pool_id or "")
        if supply is None:
            return JSONResponse({"error": "Lot or pool not found"}, status_code=404)
        rows = connection.execute(
            """SELECT requirement.*, buyer.id AS buyer_id, buyer.name AS buyer_name, buyer.verified,
            buyer.trust_score, buyer.completed_trades, buyer.on_time_payments, buyer.disputes, buyer.cancellations
            FROM buyer_requirements requirement JOIN buyers buyer ON buyer.id = requirement.buyer_id
            ORDER BY requirement.id ASC"""
        ).fetchall()
        feasible, infeasible = [], []
        for row in rows:
            value = dict(row)
            buyer = {
                "id": value["buyer_id"], "name": value["buyer_name"], "verified": value["verified"],
                "trust_score": value["trust_score"], "completed_trades": value["completed_trades"],
                "on_time_payments": value["on_time_payments"], "disputes": value["disputes"], "cancellations": value["cancellations"],
            }
            match = _match_payload(supply, value, buyer)
            (feasible if match["feasible"] else infeasible).append(match)
        feasible.sort(key=lambda item: (-float(item["matchScore"]), item["buyerName"]))
        return {
            "supplyType": supply["supplyType"], "supplyId": supply["supplyId"],
            "availableQuantity": supply["quantity"], "unit": supply["unit"],
            "matches": feasible, "infeasibleMatches": infeasible,
        }
    finally:
        connection.close()
