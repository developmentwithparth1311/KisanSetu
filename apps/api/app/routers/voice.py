"""FastAPI port of the voice market-query endpoint."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..db import get_connection
from ..services.advisory import compute_advisory
from ..services.gemini import parse_voice_query_with_gemini
from ..services.voice_parser import parse_voice_query_rules
from .matches import _match_payload, _supply_from_pool


router = APIRouter(prefix="/api")


class VoiceQueryRequest(BaseModel):
    transcript: str = ""


def _feature_five_voice_response(connection: Any, transcript: str, intent: str) -> dict[str, Any]:
    supply = _supply_from_pool(connection, "POOL-NSK-ON-01")
    if supply is None:
        return {
            "transcript": transcript,
            "intent": intent,
            "spokenResponse": "No active demo Geo-Pool is available yet.",
            "spokenResponseHi": "अभी कोई सक्रिय डेमो जियो-पूल उपलब्ध नहीं है।",
        }

    pool = connection.execute(
        "SELECT radius_km FROM geo_pools WHERE id = ?", (supply["supplyId"],)
    ).fetchone()
    member_count = connection.execute(
        "SELECT COUNT(*) AS count FROM geo_pool_members WHERE pool_id = ?",
        (supply["supplyId"],),
    ).fetchone()["count"]
    matches = []
    rows = connection.execute(
        """SELECT requirement.*, buyer.id AS matched_buyer_id, buyer.name AS buyer_name,
        buyer.verified, buyer.trust_score, buyer.completed_trades, buyer.on_time_payments,
        buyer.disputes, buyer.cancellations
        FROM buyer_requirements requirement JOIN buyers buyer ON buyer.id = requirement.buyer_id
        ORDER BY requirement.id ASC"""
    ).fetchall()
    for row in rows:
        requirement = dict(row)
        buyer = {
            "id": requirement["matched_buyer_id"], "name": requirement["buyer_name"],
            "verified": requirement["verified"], "trust_score": requirement["trust_score"],
            "completed_trades": requirement["completed_trades"],
            "on_time_payments": requirement["on_time_payments"], "disputes": requirement["disputes"],
            "cancellations": requirement["cancellations"],
        }
        match = _match_payload(supply, requirement, buyer)
        if match["feasible"]:
            matches.append(match)
    matches.sort(key=lambda item: (-float(item["matchScore"]), item["buyerName"]))
    best_match = matches[0] if matches else None

    if intent == "BEST_BUYER" and best_match:
        label = "Best Buyer Match"
        reason = (
            f"The {supply['quantity']:g} qtl pool satisfies the buyer's "
            f"{best_match['requirementQuantity']:g} qtl requirement with trust {best_match['trustScore']}/100."
        )
        spoken = (
            f"Your best verified demo buyer is {best_match['buyerName']}. The buyer needs "
            f"{best_match['requirementQuantity']:g} quintals and your pool has {supply['quantity']:g} quintals."
        )
    else:
        label = "Geo-Pool Ready"
        reason = (
            f"The pool combines {supply['quantity']:g} qtl from {member_count} compatible demo farmers "
            f"within a {float(pool['radius_km']):g} km radius."
        )
        spoken = (
            f"Your Nashik Red Onion Geo-Pool has {supply['quantity']:g} quintals "
            f"from {member_count} demo farmers."
        )

    offer_price = float(best_match["offerPrice"]) if best_match else 0.0
    return {
        "transcript": transcript, "intent": intent, "poolId": supply["supplyId"],
        "cropId": supply["crop_id"], "cropName": "Red Onion Geo-Pool", "cropIcon": "🧅",
        "mandiId": "nashik", "mandiName": "Nashik APMC", "modalPrice": offer_price,
        "minPrice": offer_price, "maxPrice": offer_price, "trendPct": 0,
        "advisoryDecision": intent, "advisoryLabel": label,
        "spokenResponse": spoken, "spokenResponseHi": spoken,
        "reason": reason, "isGeminiParsed": False,
        "availableQuantity": supply["quantity"], "memberCount": member_count,
        "buyerId": best_match["buyerId"] if best_match else None,
        "buyerName": best_match["buyerName"] if best_match else None,
        "requirementQuantity": best_match["requirementQuantity"] if best_match else None,
        "trustScore": best_match["trustScore"] if best_match else None,
        "matchScore": best_match["matchScore"] if best_match else None,
    }


@router.post("/voice-query")
async def voice_query(request: VoiceQueryRequest) -> Any:
    transcript = request.transcript.lower().strip()
    if not transcript:
        return JSONResponse({"error": "Empty voice transcript"}, status_code=400)
    parsed = parse_voice_query_rules(transcript)
    gemini_parsed = None
    if parsed["intent"] == "GET_PRICE" and (not parsed["cropExplicit"] or not parsed["mandiExplicit"]):
        gemini_parsed = await parse_voice_query_with_gemini(transcript)
        if gemini_parsed:
            if not parsed["cropExplicit"]:
                parsed["detectedCropId"] = gemini_parsed["detectedCropId"]
            if not parsed["mandiExplicit"]:
                parsed["detectedMandiId"] = gemini_parsed["detectedMandiId"]
    crop_id, mandi_id = str(parsed["detectedCropId"]), str(parsed["detectedMandiId"])
    connection = get_connection()
    try:
        if parsed["intent"] in {"FIND_POOL", "BEST_BUYER"}:
            return _feature_five_voice_response(connection, transcript, str(parsed["intent"]))
        crop_row = connection.execute("SELECT * FROM crops WHERE id = ?", (crop_id,)).fetchone()
        mandi_row = connection.execute("SELECT * FROM mandis WHERE id = ?", (mandi_id,)).fetchone()
        price_rows = connection.execute(
            "SELECT * FROM price_points WHERE crop_id = ? AND mandi_id = ? ORDER BY date ASC", (crop_id, mandi_id)
        ).fetchall()
        if not crop_row or not mandi_row or not price_rows:
            return {"spokenResponse": f"I could not find latest rates for {transcript}. Please try asking for Tomato or Onion in Nashik.", "transcript": transcript}
        crop, mandi = dict(crop_row), dict(mandi_row)
        history = [dict(row) for row in price_rows]
        advisory = compute_advisory(history, crop, mandi["name"])
        latest = history[-1]
        trend = advisory["pctTrend7Day"]
        trend_text = f"up {trend}% this week" if trend >= 0 else f"down {abs(trend)}% this week"
        short_name = crop["name"].split(" ")[0]
        return {
            "transcript": transcript, "intent": "GET_PRICE", "cropId": crop_id, "cropName": crop["name"], "cropIcon": crop["icon"],
            "mandiId": mandi_id, "mandiName": mandi["name"], "modalPrice": latest["modal_price"],
            "minPrice": latest["min_price"], "maxPrice": latest["max_price"], "trendPct": trend,
            "advisoryDecision": advisory["decision"], "advisoryLabel": advisory["badgeTitle"],
            "spokenResponse": f"{short_name} price in {mandi['name']} is Rs {latest['modal_price']:,.0f} per quintal, {trend_text}. Our AI recommendation is to {advisory['badgeTitle']}.",
            "spokenResponseHi": f"{mandi['name']} में {short_name} का भाव Rs {latest['modal_price']:,.0f} प्रति क्विंटल है। AI सलाह है: {advisory['badgeTitleHi']}।",
            "reason": advisory["reason"], "isGeminiParsed": gemini_parsed is not None,
        }
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=500)
    finally:
        connection.close()
