import pytest

from app.services import gemini
from app.services.negotiation import evaluate_buyer_offer


def _input(**overrides):
    value = {
        "cropName": "Tomato", "buyerName": "Trusted Buyer", "unit": "quintal",
        "floorPrice": 1950, "targetPrice": 2300, "offerAmount": 1850,
        "buyerTrustScore": 96, "negotiationRound": 1,
    }
    value.update(overrides)
    return value


def test_below_floor_offer_is_never_recommended_for_acceptance() -> None:
    result = evaluate_buyer_offer(_input())
    assert result["action"] == "Counter"
    assert result["amount"] == 2230
    assert result["amount"] >= 1950
    assert result["finalized"] is False


def test_target_offer_requires_farmer_confirmation() -> None:
    result = evaluate_buyer_offer(_input(offerAmount=2300))
    assert result["action"] == "RecommendAccept"
    assert result["amount"] == 2300
    assert result["statusUpdate"] == "Recommended Accept"
    assert result["finalized"] is False


def test_mid_range_counter_uses_legacy_round_threshold() -> None:
    result = evaluate_buyer_offer(_input(offerAmount=2100, negotiationRound=2, buyerTrustScore=80))
    assert result["action"] == "Counter"
    assert result["amount"] == 2180


@pytest.mark.asyncio
async def test_gemini_can_change_only_wording(monkeypatch) -> None:
    fixed = evaluate_buyer_offer(_input())

    async def generated(_: str):
        return {
            "message": "Please consider this counter.",
            "rationale": "Floor protection applies.",
            "farmerRecommendation": "Review before continuing.",
            "action": "RecommendAccept",
            "amount": 1,
        }

    monkeypatch.setattr(gemini, "_generate_json", generated)
    result, used = await gemini.enhance_negotiation_wording(_input(), fixed)
    assert used is True
    assert result["message"] == "Please consider this counter."
    assert result["action"] == fixed["action"] == "Counter"
    assert result["amount"] == fixed["amount"] == 2230


@pytest.mark.asyncio
async def test_gemini_voice_result_must_use_known_entities(monkeypatch) -> None:
    async def generated(_: str):
        return {"detectedCropId": "unknown", "detectedMandiId": "nashik"}

    monkeypatch.setattr(gemini, "_generate_json", generated)
    assert await gemini.parse_voice_query_with_gemini("something ambiguous") is None
