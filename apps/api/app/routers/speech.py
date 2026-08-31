"""Optional speech synthesis endpoint; browser speech remains the fallback."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.sarvam import synthesize_speech

router = APIRouter(prefix="/api")


class SpeechRequest(BaseModel):
    text: str = Field(default="", max_length=2500)
    language: str = "en"


@router.post("/speech")
async def speech(request: SpeechRequest) -> dict[str, object]:
    result = await synthesize_speech(request.text, request.language)
    if result is None:
        return {"available": False}
    return {"available": True, **result}
