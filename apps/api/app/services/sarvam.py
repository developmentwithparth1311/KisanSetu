"""Bounded Sarvam text-to-speech integration with a local fallback boundary."""

from __future__ import annotations

from typing import Any

import httpx

from ..config import settings

SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"
LANGUAGE_CODES = {"en": "en-IN", "hi": "hi-IN", "mr": "mr-IN"}


async def synthesize_speech(text: str, language: str) -> dict[str, Any] | None:
    """Return Sarvam's first WAV payload, or None when unavailable/erroring.

    The caller can always fall back to browser speech synthesis. The timeout is
    intentionally bounded so a paid/external service never blocks the demo.
    """

    api_key = settings.sarvam_api_key.strip()
    language_code = LANGUAGE_CODES.get(language, "en-IN")
    if not api_key or not text.strip():
        return None

    payload = {
        "text": text[:2500],
        "language_code": language_code,
        "model": "bulbul:v3",
        "speaker": "shubh",
        "pace": 0.95,
        "output_audio_codec": "wav",
    }
    headers = {"api-subscription-key": api_key, "Content-Type": "application/json"}

    try:
        timeout = httpx.Timeout(8.0, connect=3.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(SARVAM_TTS_URL, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()
        audios = data.get("audios") if isinstance(data, dict) else None
        if not isinstance(audios, list) or not audios or not isinstance(audios[0], str):
            return None
        return {"audioBase64": audios[0], "mimeType": "audio/wav", "language": language_code}
    except (httpx.HTTPError, ValueError, TypeError):
        return None
