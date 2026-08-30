"""Deterministic sale-window advisory ported from ``lib/advisory-engine.ts``."""

from __future__ import annotations

import math
from typing import Any


def _js_round(value: float) -> int:
    return math.floor(value + 0.5)


def _js_round_1(value: float) -> float:
    return math.floor(value * 10 + 0.5) / 10


def _format_inr(value: float | int) -> str:
    """Small positive-number formatter matching the UI's en-IN output."""

    return f"{int(value):,}"


def compute_advisory(
    price_history: list[dict[str, Any]], crop: dict[str, Any], mandi_name: str
) -> dict[str, Any]:
    """Return the same advisory fields and deterministic decisions as TypeScript."""

    base_price = crop.get("base_price", crop.get("basePrice", 0))
    perishability = crop.get("perishability", 0)
    crop_name = crop.get("name", crop.get("id", "crop"))

    if not price_history:
        return {
            "decision": "WAIT",
            "badgeTitle": "Wait a Few Days",
            "badgeTitleHi": "कुछ दिन रुकें",
            "shortTagline": "Gathering more market data",
            "reason": "Sufficient market data is being processed.",
            "reasonHi": "बाजार के आंकड़ों का विश्लेषण किया जा रहा है।",
            "currentPrice": base_price,
            "avg30Day": base_price,
            "avg7Day": base_price,
            "pctVs30Day": 0,
            "pctTrend7Day": 0,
            "perishabilityScore": perishability,
            "perishabilityLabel": "Medium",
            "confidenceScore": 85,
            "suggestedActionTimeline": "2-3 days",
            "arrivalVolumeToday": 150,
            "arrivalVolumeAvg": 150,
            "arrivalImpact": "Normal Supply",
        }

    sorted_history = sorted(price_history, key=lambda point: point["date"])
    latest = sorted_history[-1]
    current_price = latest["modal_price"]

    last_30 = sorted_history[-30:]
    avg_30 = _js_round(sum(point["modal_price"] for point in last_30) / len(last_30))
    last_7 = sorted_history[-7:]
    avg_7 = _js_round(sum(point["modal_price"] for point in last_7) / len(last_7))
    price_7_days_ago = (
        sorted_history[-8]["modal_price"] if len(sorted_history) >= 8 else last_7[0]["modal_price"]
    )
    pct_vs_30 = _js_round_1(((current_price - avg_30) / avg_30) * 100)
    pct_trend_7 = _js_round_1(((current_price - price_7_days_ago) / price_7_days_ago) * 100)

    arrival_today = latest["arrival_volume"]
    arrival_avg = _js_round(sum(point["arrival_volume"] for point in last_30) / len(last_30))
    arrival_impact = "Normal Supply"
    if arrival_today > arrival_avg * 1.25:
        arrival_impact = "High Supply (Price Down)"
    elif arrival_today < arrival_avg * 0.8:
        arrival_impact = "Low Supply (Price Up)"

    perishability_label = (
        "Very High (1-3 Days)"
        if perishability >= 4
        else "Medium (1-2 Weeks)"
        if perishability == 3
        else "Low / Storable (>3 Months)"
    )

    if pct_vs_30 >= 8:
        decision = "SELL_NOW"
        badge_title = "Sell Now"
        badge_title_hi = "तुरंत बेचें"
        short_tagline = f"Prices are {pct_vs_30}% above the monthly average"
        reason = (
            f"Market rates at {mandi_name} are currently ₹{_format_inr(current_price)}/qtl "
            f"({pct_vs_30}% above the 30-day average). Favorable window to lock in premium "
            "profit before fresh mandi arrivals increase."
        )
        reason_hi = f"{mandi_name} में मौजूदा भाव 30 दिनों के औसत से {pct_vs_30}% अधिक है। माल तुरंत बेचकर अधिक मुनाफा कमाने का यह सबसे सही समय है।"
        timeline = "Next 24 - 48 Hours"
        confidence = 95
    elif pct_vs_30 <= -10:
        if perishability >= 4:
            decision = "SELL_NOW"
            badge_title = "Sell Now"
            badge_title_hi = "तुरंत बेचें"
            short_tagline = "High spoilage risk — liquidate to avoid post-harvest losses"
            reason = (
                f"Although prices are below monthly average, {crop_name} has high perishability "
                f"({perishability_label}). Selling today avoids weight loss and produce degradation."
            )
            reason_hi = "भाव कुछ कम हैं, लेकिन जल्द खराब होने वाली फसल होने के कारण आज ही बेचना नुकसान से बचाएगा।"
            timeline = "Immediate (Today)"
            confidence = 88
        else:
            decision = "STORE"
            badge_title = "Store in Warehouse"
            badge_title_hi = "भंडारण करें"
            short_tagline = f"Prices are {abs(pct_vs_30)}% below normal — hold for market recovery"
            reason = (
                f"Current prices are temporarily dipped by {abs(pct_vs_30)}% at {mandi_name}. "
                f"Since {crop_name} is storable, holding in local warehouse/cold storage for "
                f"2-4 weeks will yield ₹{_format_inr(_js_round(avg_30 * 1.1))}+/qtl."
            )
            reason_hi = "मौजूदा भाव मंदी में है ({}% कम)। फसल को वेयरहाउस या कोल्ड स्टोरेज में रखें, कुछ हफ्तों में भाव सुधरने की संभावना है।".format(abs(pct_vs_30))
            timeline = "Hold for 2-4 Weeks"
            confidence = 93
    elif pct_trend_7 >= 4:
        decision = "WAIT"
        badge_title = "Wait a Few Days"
        badge_title_hi = "कुछ दिन रुकें"
        short_tagline = f"Prices gained +{pct_trend_7}% this week — upward rally underway"
        reason = f"Rates have risen +{pct_trend_7}% over the last 7 days. Demand from outstation buyers is building up. Holding for 3-5 days is likely to fetch higher bids."
        reason_hi = "पिछले 7 दिनों में भाव में +{}% की तेजी आई है। 3-5 दिन रुकने पर और बेहतर भाव मिल सकता है।".format(pct_trend_7)
        timeline = "3 - 5 Days"
        confidence = 92
    elif perishability >= 4:
        decision = "SELL_NOW"
        badge_title = "Sell Now"
        badge_title_hi = "तुरंत बेचें"
        short_tagline = "Steady prices — sell fresh harvest for best grade valuation"
        reason = f"Prices are stable at ₹{_format_inr(current_price)}/qtl. Given fast perishability, selling fresh harvest guarantees Grade-A pricing."
        reason_hi = "भाव स्थिर हैं। ताजा उपज तुरंत बेचकर ग्रेड-ए का पूरा दाम प्राप्त करें।"
        timeline = "Next 1-2 Days"
        confidence = 90
    else:
        decision = "WAIT"
        badge_title = "Wait a Few Days"
        badge_title_hi = "कुछ दिन रुकें"
        short_tagline = "Market is consolidating — watch for upcoming buyer demand"
        reason = f"Prices are holding near ₹{_format_inr(current_price)}/qtl. Mandi arrivals are moderate. Recommend waiting 2-4 days for better buying bids."
        reason_hi = "बाजार स्थिर है। आगामी दिनों में बड़े खरीदारों की मांग बढ़ने पर अच्छे भाव की उम्मीद है।"
        timeline = "2 - 4 Days"
        confidence = 87

    return {
        "decision": decision,
        "badgeTitle": badge_title,
        "badgeTitleHi": badge_title_hi,
        "shortTagline": short_tagline,
        "reason": reason,
        "reasonHi": reason_hi,
        "currentPrice": current_price,
        "avg30Day": avg_30,
        "avg7Day": avg_7,
        "pctVs30Day": pct_vs_30,
        "pctTrend7Day": pct_trend_7,
        "perishabilityScore": perishability,
        "perishabilityLabel": perishability_label,
        "confidenceScore": confidence,
        "suggestedActionTimeline": timeline,
        "arrivalVolumeToday": arrival_today,
        "arrivalVolumeAvg": arrival_avg,
        "arrivalImpact": arrival_impact,
    }
