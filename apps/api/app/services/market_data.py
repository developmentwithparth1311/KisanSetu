"""Data.gov.in/Agmarknet integration with the existing null fallback."""

from __future__ import annotations

import os
from datetime import date
from typing import Any
from urllib.parse import quote

import httpx


RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"


def _number_or(value: Any, fallback: float) -> float:
    try:
        parsed = float(value)
        return parsed if parsed else fallback
    except (TypeError, ValueError):
        return fallback


async def fetch_live_agmarknet_prices(crop_name: str, mandi_name: str) -> list[dict[str, Any]] | None:
    api_key = os.getenv("DATA_GOV_IN_API_KEY") or os.getenv("AGMARKNET_API_KEY")
    if not api_key or api_key == "your_data_gov_in_key":
        return None

    clean_crop = crop_name.split(" ")[0].lower()
    url = (
        f"https://api.data.gov.in/resource/{RESOURCE_ID}?api-key={quote(api_key)}"
        f"&format=json&limit=20&filters[commodity]={quote(clean_crop)}"
    )
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0, connect=3.0)) as client:
            response = await client.get(url)
        if not response.is_success:
            return None
        records = response.json().get("records", [])
        if not records:
            return None
        today = date.today().isoformat()
        return [
            {
                "state": record.get("state") or "Maharashtra",
                "district": record.get("district") or "",
                "market": record.get("market") or mandi_name,
                "commodity": record.get("commodity") or crop_name,
                "variety": record.get("variety") or "Local",
                "arrival_date": record.get("arrival_date") or today,
                "min_price": _number_or(record.get("min_price"), 1500),
                "max_price": _number_or(record.get("max_price"), 2500),
                "modal_price": _number_or(record.get("modal_price"), 2000),
            }
            for record in records
        ]
    except (httpx.HTTPError, ValueError, TypeError):
        return None
