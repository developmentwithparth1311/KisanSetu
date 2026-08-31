"""Deterministic English, Hindi, Marathi, and Hinglish voice entity parsing."""

from __future__ import annotations


_CROPS = {
    "onion": ("onion", "pyaz", "pyaaz", "प्याज़", "प्याज", "कांदा"),
    "potato": ("potato", "aloo", "aalu", "आलू", "बटाटा"),
    "wheat": ("wheat", "gehu", "gehoon", "गेहूं", "गहू"),
    "soybean": ("soybean", "soya", "सोयाबीन"),
    "tomato": ("tomato", "tamatar", "टमाटर"),
}
_MANDIS = {
    "pune": ("pune", "पुणे"),
    "indore": ("indore", "इंदौर"),
    "azadpur": ("delhi", "azadpur", "आजादपुर"),
    "nashik": ("nashik", "नाशिक", "नासिक"),
}

_BEST_BUYER_PHRASES = (
    "best buyer", "buyer match", "buyer requirement", "सबसे अच्छा खरीदार", "सर्वोत्तम खरीदार",
    "माझा सर्वोत्तम खरेदीदार",
)
_POOL_PHRASES = (
    "find pool", "show my pool", "read my pool", "geo pool", "geopool", "मेरा पूल", "पूल दिखाओ",
    "माझा पूल", "पूल दाखवा",
)


def parse_voice_query_rules(transcript: str) -> dict[str, object]:
    normalized = transcript.lower().strip()
    if any(phrase in normalized for phrase in _BEST_BUYER_PHRASES):
        return {
            "detectedCropId": "onion", "detectedMandiId": "nashik",
            "cropExplicit": False, "mandiExplicit": False, "intent": "BEST_BUYER",
        }
    if any(phrase in normalized for phrase in _POOL_PHRASES):
        return {
            "detectedCropId": "onion", "detectedMandiId": "nashik",
            "cropExplicit": False, "mandiExplicit": False, "intent": "FIND_POOL",
        }
    crop_id = next((key for key, words in _CROPS.items() if any(word in normalized for word in words)), None)
    mandi_id = next((key for key, words in _MANDIS.items() if any(word in normalized for word in words)), None)
    return {
        "detectedCropId": crop_id or "tomato",
        "detectedMandiId": mandi_id or "nashik",
        "cropExplicit": crop_id is not None,
        "mandiExplicit": mandi_id is not None,
        "intent": "GET_PRICE",
    }
