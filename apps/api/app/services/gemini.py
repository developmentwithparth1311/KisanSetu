"""Optional Gemini language assistance with deterministic safety boundaries."""

from __future__ import annotations

import json
import os
from typing import Any

import httpx


_PLACEHOLDER_KEYS = {"", "your_gemini_api_key", "your-gemini-api-key"}
_GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


def _api_key() -> str | None:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    return key if key not in _PLACEHOLDER_KEYS else None


async def _generate_json(prompt: str) -> dict[str, Any] | None:
    key = _api_key()
    if not key:
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                _GEMINI_URL,
                params={"key": key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
                },
            )
            response.raise_for_status()
        text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
        value = json.loads(text)
        return value if isinstance(value, dict) else None
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError):
        return None


async def enhance_negotiation_wording(
    input_data: dict[str, Any], rule_result: dict[str, Any]
) -> tuple[dict[str, Any], bool]:
    """Optionally improve wording while retaining every deterministic outcome."""

    prompt = f"""Write concise, respectful negotiation wording for an Indian farm marketplace.
The decision and amount below are fixed rules, not suggestions: action={rule_result['action']}, amount={rule_result['amount']}, floor={input_data['floorPrice']}.
Never propose a price, change a number, say a sale is final, or claim escrow/payment is real.
Return JSON only with string keys message, rationale, farmerRecommendation.
Crop: {input_data.get('cropName')}; buyer: {input_data.get('buyerName')}; unit: {input_data.get('unit')}.
"""
    generated = await _generate_json(prompt)
    if not generated:
        return rule_result, False

    result = dict(rule_result)
    for field in ("message", "rationale", "farmerRecommendation"):
        value = generated.get(field)
        if isinstance(value, str) and value.strip():
            result[field] = value.strip()
    return result, True


async def parse_voice_query_with_gemini(transcript: str) -> dict[str, str] | None:
    """Use Gemini solely to resolve a voice query the deterministic parser cannot."""

    prompt = f"""Extract entities from this agricultural market-price voice query: {transcript!r}
Return JSON only: detectedCropId, detectedMandiId, intent, language.
detectedCropId must be one of tomato, onion, potato, wheat, soybean.
detectedMandiId must be one of nashik, pune, indore, azadpur.
Do not provide prices, recommendations, or any numeric decision."""
    generated = await _generate_json(prompt)
    if not generated:
        return None
    crop_id = generated.get("detectedCropId")
    mandi_id = generated.get("detectedMandiId")
    if crop_id not in {"tomato", "onion", "potato", "wheat", "soybean"} or mandi_id not in {
        "nashik", "pune", "indore", "azadpur"
    }:
        return None
    return {
        "detectedCropId": crop_id,
        "detectedMandiId": mandi_id,
        "intent": str(generated.get("intent", "check_price")),
        "language": str(generated.get("language", "unknown")),
    }
