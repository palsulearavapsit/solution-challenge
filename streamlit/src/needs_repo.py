from typing import Optional

from src.database import get_db
from src.models import Need


def _row_to_need(row) -> Need:
    return Need(**dict(row))


def list_needs(status: Optional[str] = None, urgency: Optional[str] = None) -> list[Need]:
    sql = "SELECT * FROM needs WHERE 1=1"
    params: list = []
    if status:
        sql += " AND status = ?"
        params.append(status)
    if urgency:
        sql += " AND urgency = ?"
        params.append(urgency)
    sql += (
        " ORDER BY CASE urgency"
        " WHEN 'Critical' THEN 0 WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END"
    )
    with get_db() as conn:
        return [_row_to_need(r) for r in conn.execute(sql, params).fetchall()]


def get_need(need_id: int) -> Optional[Need]:
    with get_db() as conn:
        row = conn.execute("SELECT * FROM needs WHERE id = ?", (need_id,)).fetchone()
    return _row_to_need(row) if row else None


def create_need(
    area: str,
    need_type: str,
    urgency: str,
    lat: float,
    lon: float,
    description: str = "",
) -> Need:
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO needs (area, need_type, urgency, lat, lon, description) VALUES (?,?,?,?,?,?)",
            (area, need_type, urgency, lat, lon, description),
        )
        row = conn.execute("SELECT * FROM needs WHERE id=?", (cur.lastrowid,)).fetchone()
    return _row_to_need(row)


def update_need_status(need_id: int, status: str) -> None:
    with get_db() as conn:
        conn.execute(
            "UPDATE needs SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (status, need_id),
        )


def delete_need(need_id: int) -> None:
    with get_db() as conn:
        conn.execute("DELETE FROM assignments WHERE need_id=?", (need_id,))
        conn.execute("DELETE FROM needs WHERE id=?", (need_id,))
