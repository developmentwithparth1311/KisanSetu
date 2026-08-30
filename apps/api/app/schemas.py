"""Pydantic schemas for the Phase 1 health endpoint only."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    ok: bool
    service: str
