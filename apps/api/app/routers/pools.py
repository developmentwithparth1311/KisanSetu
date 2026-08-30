"""Geo-Pooling API endpoints backed exclusively by deterministic Python rules."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from ..db import get_connection
from ..services.pooling import (
    build_pool_suggestion,
    find_pool_candidates,
    get_pool_detail,
    join_pool,
    materialize_pool,
)


router = APIRouter(prefix="/api")


class PoolLotRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    lot_id: str = Field(alias="lotId")


def _lot(connection: Any, lot_id: str) -> dict[str, Any] | None:
    row = connection.execute("SELECT * FROM lots WHERE id = ?", (lot_id,)).fetchone()
    return dict(row) if row is not None else None


def _suggestion(connection: Any, lot_id: str) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    anchor = _lot(connection, lot_id)
    if anchor is None:
        return None, []
    lots = [dict(row) for row in connection.execute("SELECT * FROM lots")]
    candidates, rejected = find_pool_candidates(anchor, lots)
    return build_pool_suggestion(anchor, candidates) if candidates else None, rejected


@router.get("/pools/suggestions")
def pool_suggestions(lot_id: str = Query(alias="lotId")) -> Any:
    connection = get_connection()
    try:
        suggestion, rejected = _suggestion(connection, lot_id)
        if _lot(connection, lot_id) is None:
            return JSONResponse({"error": "Lot not found"}, status_code=404)
        anchor = _lot(connection, lot_id)
        return {
            "anchorLotId": lot_id,
            "radiusKm": float(anchor.get("pooling_radius_km") or 20),
            "suggestions": [suggestion] if suggestion else [],
            "rejectedCandidates": rejected,
        }
    finally:
        connection.close()


@router.get("/pools")
def list_pools() -> dict[str, Any]:
    connection = get_connection()
    try:
        pools = [get_pool_detail(connection, row["id"]) for row in connection.execute("SELECT id FROM geo_pools ORDER BY created_at ASC")]
        return {"pools": [pool for pool in pools if pool is not None]}
    finally:
        connection.close()


@router.post("/pools")
def create_pool(request: PoolLotRequest) -> Any:
    connection = get_connection()
    try:
        anchor = _lot(connection, request.lot_id)
        if anchor is None:
            return JSONResponse({"error": "Lot not found"}, status_code=404)
        lots = [dict(row) for row in connection.execute("SELECT * FROM lots")]
        candidates, _ = find_pool_candidates(anchor, lots)
        if not candidates:
            return JSONResponse({"error": "No compatible lots available for pooling"}, status_code=400)
        pool = materialize_pool(connection, anchor, build_pool_suggestion(anchor, candidates))
        return {"success": True, "pool": pool}
    finally:
        connection.close()


@router.get("/pools/{pool_id}")
def pool_detail(pool_id: str) -> Any:
    connection = get_connection()
    try:
        pool = get_pool_detail(connection, pool_id)
        return {"pool": pool} if pool is not None else JSONResponse({"error": "Pool not found"}, status_code=404)
    finally:
        connection.close()


@router.post("/pools/{pool_id}/join")
def join_existing_pool(pool_id: str, request: PoolLotRequest) -> Any:
    connection = get_connection()
    try:
        lot = _lot(connection, request.lot_id)
        if lot is None:
            return JSONResponse({"error": "Lot not found"}, status_code=404)
        try:
            pool, already_joined = join_pool(connection, pool_id, lot)
        except LookupError:
            return JSONResponse({"error": "Pool not found"}, status_code=404)
        except ValueError as exc:
            return JSONResponse({"error": str(exc)}, status_code=400)
        return {"success": True, "accepted": True, "alreadyJoined": already_joined, "pool": pool}
    finally:
        connection.close()
