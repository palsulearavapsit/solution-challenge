from typing import Optional

from src.database import get_db
from src.models import Volunteer


def _row_to_vol(row) -> Volunteer:
    return Volunteer(**dict(row))


def list_volunteers(availability: Optional[str] = None) -> list[Volunteer]:
    sql = "SELECT * FROM volunteers WHERE 1=1"
    params: list = []
    if availability:
        sql += " AND availability = ?"
        params.append(availability)
    sql += " ORDER BY name"
    with get_db() as conn:
        return [_row_to_vol(r) for r in conn.execute(sql, params).fetchall()]


def get_volunteer(vol_id: int) -> Optional[Volunteer]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM volunteers WHERE id=?", (vol_id,)).fetchone()
    return _row_to_vol(row) if row else None


def create_volunteer(
    name: str,
    skill: str,
    location: str,
    lat: float,
    lon: float,
    phone: str = "",
    email: str = "",
) -> Volunteer:
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO volunteers (name, skill, location, lat, lon, phone, email) VALUES (?,?,?,?,?,?,?)",
            (name, skill, location, lat, lon, phone, email),
        )
        row = conn.execute("SELECT * FROM volunteers WHERE id=?", (cur.lastrowid,)).fetchone()
    return _row_to_vol(row)


def update_volunteer_availability(vol_id: int, availability: str) -> None:
    with get_db() as conn:
        conn.execute(
            "UPDATE volunteers SET availability=? WHERE id=?", (availability, vol_id)
        )


def delete_volunteer(vol_id: int) -> None:
    with get_db() as conn:
        conn.execute("DELETE FROM assignments WHERE volunteer_id=?", (vol_id,))
        conn.execute("DELETE FROM volunteers WHERE id=?", (vol_id,))
