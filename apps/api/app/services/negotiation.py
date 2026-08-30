"""Deterministic negotiation decisions for the Python API.

Numbers and state transitions are deliberately computed here, never by an LLM.
"""

from __future__ import annotations

import math
from typing import Any


def _round_like_javascript(value: float) -> int:
    return math.floor(value + 0.5)


def evaluate_buyer_offer(input_data: dict[str, Any]) -> dict[str, Any]:
    """Evaluate a buyer offer using the legacy thresholds without auto-selling.

    ``RecommendAccept`` means the farmer may review the offer.  It is not a
    completed sale and does not hold a simulated settlement amount.
    """

    floor = float(input_data["floorPrice"])
    target = float(input_data["targetPrice"])
    offer = float(input_data["offerAmount"])
    round_number = int(input_data.get("negotiationRound", 1))
    trust_score = float(input_data.get("buyerTrustScore", 88))
    crop_name = input_data.get("cropName", "produce")
    buyer_name = input_data.get("buyerName", "buyer")
    unit = input_data.get("unit", "quintal")

    if offer >= target:
        return {
            "action": "RecommendAccept",
            "amount": _round_like_javascript(offer),
            "message": (
                f"{buyer_name}'s offer meets the target price. Review it and confirm the final sale when ready."
            ),
            "rationale": f"Offer is at or above the farmer target of Rs {target:,.0f}/{unit}.",
            "farmerRecommendation": "This offer meets your target. Confirm only if you want to finalize the sale.",
            "statusUpdate": "Recommended Accept",
            "finalized": False,
        }

    if offer < floor:
        concession = 0.8 if round_number <= 1 else 0.55
        counter = _round_like_javascript(max(floor + 50, floor + (target - floor) * concession))
        return {
            "action": "Counter",
            "amount": counter,
            "message": f"The offer is below the farmer floor. Counter at Rs {counter:,.0f}/{unit}.",
            "rationale": f"Rs {offer:,.0f}/{unit} is below the protected floor of Rs {floor:,.0f}/{unit}.",
            "farmerRecommendation": "Do not accept this offer. Send the protected counter offer instead.",
            "statusUpdate": "Under Negotiation",
            "finalized": False,
        }

    close_to_target = offer >= target * 0.95
    if close_to_target and trust_score >= 90:
        return {
            "action": "RecommendAccept",
            "amount": _round_like_javascript(offer),
            "message": (
                f"{buyer_name}'s verified offer is close to your target. Review it before confirming the final sale."
            ),
            "rationale": "The offer is within 5% of target and the buyer has a high trust score.",
            "farmerRecommendation": "This is a strong offer. Confirm only if you choose to finalize.",
            "statusUpdate": "Recommended Accept",
            "finalized": False,
        }

    spread = 0.65 if round_number <= 1 else 0.4
    counter = _round_like_javascript(offer + (target - offer) * spread)
    counter = max(_round_like_javascript(floor), counter)
    return {
        "action": "Counter",
        "amount": counter,
        "message": f"Counter at Rs {counter:,.0f}/{unit} to move toward the farmer target.",
        "rationale": f"The offer is above the floor but below the target for {crop_name}.",
        "farmerRecommendation": "Continue negotiating; this counter protects your expected price.",
        "statusUpdate": "Under Negotiation",
        "finalized": False,
    }
