"""Deterministic, explainable Geo-Pooling discovery and persistence helpers."""

from __future__ import annotations

import math
import sqlite3
from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any


EARTH_RADIUS_KM = 6371.0
DEFAULT_RADIUS_KM = 20.0
DEFAULT_AVAILABILITY_GAP_DAYS = 2
GRADE_VALUE = {"Grade A": 3, "A": 3, "Grade B": 2, "B": 2, "Grade C": 1, "C": 1}


@dataclass(frozen=True)
class CompatibilityResult:
    compatible: bool
    reason: str
    distance_km: float | None = None


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in kilometres using the Haversine formula."""

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _normalised(value: Any) -> str:
    return str(value or "").strip().casefold()


def _as_date(value: Any) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _availability_compatible(anchor: dict[str, Any], candidate: dict[str, Any], gap_days: int) -> bool:
    anchor_start, anchor_end = _as_date(anchor.get("available_from")), _as_date(anchor.get("available_until"))
    candidate_start, candidate_end = _as_date(candidate.get("available_from")), _as_date(candidate.get("available_until"))
    # Legacy lots without scheduling metadata stay eligible; specified windows
    # must overlap or be no more than the configured hand-off gap apart.
    if not all((anchor_start, anchor_end, candidate_start, candidate_end)):
        return True
    return candidate_start <= anchor_end.fromordinal(anchor_end.toordinal() + gap_days) and anchor_start <= candidate_end.fromordinal(candidate_end.toordinal() + gap_days)


def are_lots_pool_compatible(
    anchor: dict[str, Any],
    candidate: dict[str, Any],
    radius_km: float | None = None,
    availability_gap_days: int = DEFAULT_AVAILABILITY_GAP_DAYS,
) -> CompatibilityResult:
    """Apply the Phase 7 hard constraints in a stable, explainable order."""

    if _normalised(anchor.get("crop_id")) != _normalised(candidate.get("crop_id")):
        return CompatibilityResult(False, "Different crop")
    anchor_variety, candidate_variety = _normalised(anchor.get("variety")), _normalised(candidate.get("variety"))
    if anchor_variety and candidate_variety and anchor_variety != candidate_variety:
        return CompatibilityResult(False, "Different variety")
    anchor_grade = GRADE_VALUE.get(str(anchor.get("ai_grade") or "").strip())
    candidate_grade = GRADE_VALUE.get(str(candidate.get("ai_grade") or "").strip())
    if anchor_grade is None or candidate_grade is None:
        return CompatibilityResult(False, "Unknown produce grade")
    if abs(anchor_grade - candidate_grade) > 1:
        return CompatibilityResult(False, "Grade difference exceeds one level")
    if not _availability_compatible(anchor, candidate, availability_gap_days):
        return CompatibilityResult(False, "Availability windows are more than two days apart")
    coordinates = (anchor.get("latitude"), anchor.get("longitude"), candidate.get("latitude"), candidate.get("longitude"))
    if any(value is None for value in coordinates):
        return CompatibilityResult(False, "Location is required for Geo-Pooling")
    distance = haversine_km(*(float(value) for value in coordinates))
    effective_radius = float(radius_km if radius_km is not None else anchor.get("pooling_radius_km") or DEFAULT_RADIUS_KM)
    if distance > effective_radius:
        return CompatibilityResult(False, f"Outside {effective_radius:g} km radius", distance)
    return CompatibilityResult(True, "Compatible crop, variety, grade, availability, and radius", distance)


def _is_available_for_pool(lot: dict[str, Any]) -> bool:
    return str(lot.get("status") or "").casefold() not in {"sold", "inactive", "rejected"} and bool(
        lot.get("pooling_enabled", 1)
    )


def find_pool_candidates(
    anchor: dict[str, Any],
    all_lots: list[dict[str, Any]],
    radius_km: float | None = None,
    availability_gap_days: int = DEFAULT_AVAILABILITY_GAP_DAYS,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Return sorted compatible lots and explainable exclusions for an anchor."""

    accepted: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    effective_radius = float(radius_km if radius_km is not None else anchor.get("pooling_radius_km") or DEFAULT_RADIUS_KM)
    for candidate in all_lots:
        if candidate.get("id") == anchor.get("id"):
            continue
        if not _is_available_for_pool(candidate):
            rejected.append({"lotId": candidate.get("id"), "reason": "Lot is sold, inactive, or pooling is disabled"})
            continue
        result = are_lots_pool_compatible(anchor, candidate, effective_radius, availability_gap_days)
        candidate_summary = {
            "lotId": candidate.get("id"),
            "farmerName": candidate.get("farmer_name"),
            "quantity": candidate.get("quantity"),
            "unit": candidate.get("unit"),
            "cropId": candidate.get("crop_id"),
            "variety": candidate.get("variety"),
            "aiGrade": candidate.get("ai_grade"),
            "distanceKm": round(result.distance_km, 2) if result.distance_km is not None else None,
            "reason": result.reason,
        }
        if result.compatible:
            accepted.append(candidate_summary)
        else:
            rejected.append(candidate_summary)
    accepted.sort(key=lambda item: (item["distanceKm"], str(item["lotId"])))
    rejected.sort(key=lambda item: str(item.get("lotId")))
    return accepted, rejected


def suggestion_id_for(anchor_lot_id: str) -> str:
    if anchor_lot_id == "LOT-GEO-PRIMARY":
        return "SUG-NSK-ON-01"
    return f"SUG-{anchor_lot_id.removeprefix('LOT-')}"


def pool_id_for(anchor_lot_id: str) -> str:
    if anchor_lot_id == "LOT-GEO-PRIMARY":
        return "POOL-NSK-ON-01"
    return f"POOL-{anchor_lot_id.removeprefix('LOT-')}"


def build_pool_suggestion(anchor: dict[str, Any], candidates: list[dict[str, Any]]) -> dict[str, Any]:
    """Form one deterministic radius-based suggestion from compatible lots."""

    anchor_quantity = float(anchor["quantity"])
    nearby_quantity = sum(float(candidate["quantity"]) for candidate in candidates)
    anchor_member = {
        "lotId": anchor["id"], "farmerName": anchor["farmer_name"], "quantity": anchor["quantity"],
        "unit": anchor["unit"], "cropId": anchor["crop_id"], "variety": anchor.get("variety"),
        "aiGrade": anchor["ai_grade"], "distanceKm": 0.0, "reason": "Anchor lot",
    }
    members = [anchor_member, *candidates]
    return {
        "suggestionId": suggestion_id_for(anchor["id"]),
        "poolId": pool_id_for(anchor["id"]),
        "cropId": anchor["crop_id"],
        "variety": anchor.get("variety"),
        "targetGrade": anchor["ai_grade"],
        "memberCount": len(members),
        "anchorQuantity": anchor_quantity,
        "nearbyQuantity": nearby_quantity,
        "totalQuantity": anchor_quantity + nearby_quantity,
        "unit": anchor["unit"],
        "radiusKm": float(anchor.get("pooling_radius_km") or DEFAULT_RADIUS_KM),
        "maxDistanceKm": round(max((float(candidate["distanceKm"]) for candidate in candidates), default=0), 2),
        "members": members,
    }


def get_pool_detail(connection: sqlite3.Connection, pool_id: str) -> dict[str, Any] | None:
    pool_row = connection.execute("SELECT * FROM geo_pools WHERE id = ?", (pool_id,)).fetchone()
    if pool_row is None:
        return None
    pool = dict(pool_row)
    pool["members"] = [
        dict(row)
        for row in connection.execute(
            """SELECT gm.*, l.crop_id, l.variety, l.ai_grade, l.unit
            FROM geo_pool_members gm JOIN lots l ON l.id = gm.lot_id
            WHERE gm.pool_id = ? ORDER BY gm.distance_from_anchor_km ASC, gm.lot_id ASC""",
            (pool_id,),
        )
    ]
    return pool


def materialize_pool(connection: sqlite3.Connection, anchor: dict[str, Any], suggestion: dict[str, Any]) -> dict[str, Any]:
    """Persist a suggestion once; deterministic IDs make replays idempotent."""

    pool_id = str(suggestion["poolId"])
    existing = get_pool_detail(connection, pool_id)
    if existing is not None:
        return existing
    now = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    with connection:
        connection.execute(
            """INSERT INTO geo_pools
            (id, crop_id, variety, target_grade, centroid_latitude, centroid_longitude,
             radius_km, total_quantity, unit, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Suggested', ?)""",
            (pool_id, suggestion["cropId"], suggestion["variety"], suggestion["targetGrade"],
             anchor["latitude"], anchor["longitude"], suggestion["radiusKm"], suggestion["totalQuantity"],
             suggestion["unit"], now),
        )
        for member in suggestion["members"]:
            connection.execute(
                """INSERT INTO geo_pool_members
                (pool_id, lot_id, farmer_name, quantity, accepted, distance_from_anchor_km, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (pool_id, member["lotId"], member["farmerName"], member["quantity"],
                 int(member["lotId"] == anchor["id"]), member["distanceKm"], now),
            )
    return get_pool_detail(connection, pool_id) or {}


def join_pool(connection: sqlite3.Connection, pool_id: str, lot: dict[str, Any]) -> tuple[dict[str, Any], bool]:
    """Join a compatible lot to a materialized pool and mark it accepted."""

    pool = get_pool_detail(connection, pool_id)
    if pool is None:
        raise LookupError("Pool not found")
    existing = next((member for member in pool["members"] if member["lot_id"] == lot["id"]), None)
    if existing is not None:
        with connection:
            connection.execute("UPDATE geo_pool_members SET accepted = 1 WHERE pool_id = ? AND lot_id = ?", (pool_id, lot["id"]))
        return get_pool_detail(connection, pool_id) or {}, bool(existing["accepted"])

    anchor_member = next((member for member in pool["members"] if member["distance_from_anchor_km"] == 0), None)
    if anchor_member is None:
        raise ValueError("Pool has no anchor lot")
    anchor_row = connection.execute("SELECT * FROM lots WHERE id = ?", (anchor_member["lot_id"],)).fetchone()
    if anchor_row is None:
        raise ValueError("Pool anchor lot not found")
    result = are_lots_pool_compatible(dict(anchor_row), lot, float(pool["radius_km"]))
    if not result.compatible:
        raise ValueError(result.reason)
    now = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    with connection:
        connection.execute(
            """INSERT INTO geo_pool_members
            (pool_id, lot_id, farmer_name, quantity, accepted, distance_from_anchor_km, created_at)
            VALUES (?, ?, ?, ?, 1, ?, ?)""",
            (pool_id, lot["id"], lot["farmer_name"], lot["quantity"], result.distance_km, now),
        )
        connection.execute("UPDATE geo_pools SET total_quantity = total_quantity + ? WHERE id = ?", (lot["quantity"], pool_id))
    return get_pool_detail(connection, pool_id) or {}, False
