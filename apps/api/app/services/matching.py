"""Deterministic buyer-RFQ feasibility and explainable ranking rules."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any

from .pooling import GRADE_VALUE, haversine_km


DISTANCE_MAX_KM = 250.0
HANDLING_COST_PER_QTL = 15.0


@dataclass(frozen=True)
class FeasibilityResult:
    feasible: bool
    reasons: list[str]
    distance_km: float | None = None


def _normalised(value: Any) -> str:
    return str(value or "").strip().casefold()


def _as_date(value: Any) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def calculate_trust_score(buyer: dict[str, Any]) -> tuple[int, list[str]]:
    """Return the stored score when available, otherwise a bounded demo formula.

    Retaining a verified buyer's recorded score is backward-compatible with the
    existing data set; the formula supplies an explainable value for new RFQs.
    """

    recorded = buyer.get("trust_score")
    if recorded is not None:
        score = max(0, min(100, int(round(float(recorded)))))
        return score, [f"Buyer trust score is {score}/100 from the verified demo profile."]
    completed = max(0.0, float(buyer.get("completed_trades") or 0))
    payment_ratio = min(1.0, float(buyer.get("on_time_payments") or 0) / completed) if completed else 0.5
    completion_reliability = min(1.0, completed / 100.0)
    dispute_penalty = min(1.0, (float(buyer.get("disputes") or 0) + float(buyer.get("cancellations") or 0)) / max(1.0, completed))
    verification = 1.0 if buyer.get("verified") else 0.0
    score = round(100 * (0.30 * verification + 0.35 * payment_ratio + 0.20 * completion_reliability + 0.15 * (1 - dispute_penalty)))
    return max(0, min(100, score)), ["Trust score uses verification, payment reliability, trade completion, and dispute history."]


def evaluate_buyer_feasibility(
    supply: dict[str, Any], requirement: dict[str, Any], buyer: dict[str, Any]
) -> FeasibilityResult:
    """Apply every RFQ hard filter before any match score is calculated."""

    reasons: list[str] = []
    if not buyer.get("verified"):
        reasons.append("Buyer is not platform-verified in the demo.")
    if not requirement.get("active"):
        reasons.append("Buyer requirement is inactive.")
    if _normalised(supply.get("crop_id")) != _normalised(requirement.get("crop_id")):
        reasons.append("Supply crop does not match the buyer requirement.")
    supply_variety, required_variety = _normalised(supply.get("variety")), _normalised(requirement.get("variety"))
    if supply_variety and required_variety and supply_variety != required_variety:
        reasons.append("Supply variety does not match the buyer requirement.")
    supply_grades = supply.get("member_grades") or [supply.get("minimum_grade")]
    required_grade = GRADE_VALUE.get(str(requirement.get("minimum_grade") or "").strip(), 0)
    if not required_grade or any(GRADE_VALUE.get(str(grade or "").strip(), 0) < required_grade for grade in supply_grades):
        reasons.append("At least one lot does not meet the buyer's minimum grade.")
    available_quantity = float(supply.get("quantity") or 0)
    required_quantity = float(requirement.get("required_quantity") or 0)
    if _normalised(supply.get("unit")) != _normalised(requirement.get("unit")):
        reasons.append("Supply unit does not match the buyer requirement.")
    if available_quantity < required_quantity:
        reasons.append(f"{available_quantity:g} qtl is below the required {required_quantity:g} qtl.")
    available_until, delivery_by = _as_date(supply.get("available_until")), _as_date(requirement.get("delivery_by"))
    if available_until and delivery_by and delivery_by > available_until + timedelta(days=2):
        reasons.append("Supply availability does not meet the buyer delivery window.")
    distance = None
    if None not in (supply.get("latitude"), supply.get("longitude"), requirement.get("delivery_latitude"), requirement.get("delivery_longitude")):
        distance = haversine_km(float(supply["latitude"]), float(supply["longitude"]), float(requirement["delivery_latitude"]), float(requirement["delivery_longitude"]))
    if reasons:
        return FeasibilityResult(False, reasons, distance)
    return FeasibilityResult(
        True,
        [
            f"Pooled quantity satisfies the buyer's {required_quantity:g} qtl requirement.",
            "Grade requirement is satisfied.",
            "Buyer is platform-verified in the demo.",
            "Delivery window is compatible.",
        ],
        distance,
    )


def score_feasible_match(
    supply: dict[str, Any], requirement: dict[str, Any], buyer: dict[str, Any], feasibility: FeasibilityResult
) -> dict[str, Any] | None:
    """Calculate normalized components and a weighted score for feasible RFQs only."""

    if not feasibility.feasible:
        return None
    trust_score, trust_reasons = calculate_trust_score(buyer)
    available_quantity = float(supply["quantity"])
    required_quantity = float(requirement["required_quantity"])
    quantity_fit = min(1.0, available_quantity / required_quantity)
    quality_fit = 1.0
    distance = feasibility.distance_km or 0.0
    distance_fit = max(0.0, 1.0 - distance / DISTANCE_MAX_KM)
    transport_cost = min(150.0, distance * 1.5)
    offer_price = float(requirement["offer_price"])
    effective_price = max(0.0, offer_price - transport_cost - HANDLING_COST_PER_QTL)
    economic_fit = min(1.0, effective_price / offer_price) if offer_price else 0.0
    trust_fit = trust_score / 100.0
    match_score = round(0.20 * quantity_fit + 0.20 * quality_fit + 0.15 * distance_fit + 0.30 * economic_fit + 0.15 * trust_fit, 4)
    return {
        "matchScore": match_score,
        "trustScore": trust_score,
        "distanceKm": round(distance, 2),
        "offerPrice": offer_price,
        "transportCostPerQtl": round(transport_cost, 2),
        "handlingCostPerQtl": HANDLING_COST_PER_QTL,
        "effectivePrice": round(effective_price, 2),
        "scoreComponents": {
            "quantityFit": round(quantity_fit, 4), "qualityFit": quality_fit,
            "distanceFit": round(distance_fit, 4), "economicFit": round(economic_fit, 4), "trustFit": round(trust_fit, 4),
        },
        "trustReasons": trust_reasons,
    }
