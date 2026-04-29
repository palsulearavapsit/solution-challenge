import math
from typing import Optional

from src.models import Need, Volunteer

URGENCY_WEIGHT: dict[str, int] = {"Critical": 4, "High": 3, "Medium": 2, "Low": 1}

SKILL_NEED_MAP: dict[str, list[str]] = {
    "Medical":            ["Medical Camp"],
    "Logistics":          ["Education Support", "Shelter Assistance", "Food Distribution"],
    "Water & Sanitation": ["Sanitation Drive"],
    "Food Distribution":  ["Food Distribution"],
    "Education":          ["Education Support"],
    "Construction":       ["Shelter Assistance"],
    "General":            ["Food Distribution", "Education Support", "Sanitation Drive", "Shelter Assistance"],
}

ALL_SKILLS = sorted(SKILL_NEED_MAP.keys())
ALL_NEED_TYPES = [
    "Food Distribution",
    "Medical Camp",
    "Education Support",
    "Sanitation Drive",
    "Shelter Assistance",
    "General Support",
]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def score_match(volunteer: Volunteer, need: Need, max_dist_km: float = 50.0) -> float:
    compatible = SKILL_NEED_MAP.get(volunteer.skill, [])
    if need.need_type not in compatible:
        return 0.0
    dist = haversine_km(volunteer.lat, volunteer.lon, need.lat, need.lon)
    if dist > max_dist_km:
        return 0.0
    proximity = 1.0 - (dist / max_dist_km)
    urgency = URGENCY_WEIGHT.get(need.urgency, 1) / 4.0
    return round(0.35 * proximity + 0.65 * urgency, 3)


def find_matches(
    volunteers: list[Volunteer],
    needs: list[Need],
    max_dist_km: float = 50.0,
    top_k: Optional[int] = None,
) -> list[tuple[float, Volunteer, Need]]:
    available = [v for v in volunteers if v.availability == "Available"]
    open_needs = [n for n in needs if n.status == "Open"]
    results: list[tuple[float, Volunteer, Need]] = []
    for v in available:
        for n in open_needs:
            s = score_match(v, n, max_dist_km)
            if s > 0:
                results.append((s, v, n))
    results.sort(key=lambda x: -x[0])
    return results[:top_k] if top_k else results
