from typing import Optional

from src.database import get_db
from src.models import Assignment

_JOIN_SQL = """
    SELECT a.id, a.volunteer_id, a.need_id, a.assigned_at, a.completed_at,
           a.status, a.notes,
           v.name  AS volunteer_name,
           n.area  AS need_area,
           n.need_type,
           n.urgency
    FROM assignments a
    JOIN volunteers v ON a.volunteer_id = v.id
    JOIN needs      n ON a.need_id      = n.id
"""


def _row_to_assign(row) -> Assignment:
    return Assignment(**dict(row))


def list_assignments(status: Optional[str] = None) -> list[Assignment]:
    sql = _JOIN_SQL + " WHERE 1=1"
    params: list = []
    if status:
        sql += " AND a.status = ?"
        params.append(status)
    sql += " ORDER BY a.assigned_at DESC"
    with get_db() as conn:
        return [_row_to_assign(r) for r in conn.execute(sql, params).fetchall()]


def get_assignment(assignment_id: int) -> Optional[Assignment]:
    sql = _JOIN_SQL + " WHERE a.id = ?"
    with get_db() as conn:
        row = conn.execute(sql, (assignment_id,)).fetchone()
    return _row_to_assign(row) if row else None


def create_assignment(volunteer_id: int, need_id: int, notes: str = "") -> Optional[Assignment]:
    with get_db() as conn:
        try:
            cur = conn.execute(
                "INSERT INTO assignments (volunteer_id, need_id, notes) VALUES (?,?,?)",
                (volunteer_id, need_id, notes),
            )
            conn.execute(
                "UPDATE volunteers SET availability='Assigned' WHERE id=?", (volunteer_id,)
            )
            conn.execute(
                "UPDATE needs SET status='In Progress', updated_at=CURRENT_TIMESTAMP WHERE id=?",
                (need_id,),
            )
            row = conn.execute(_JOIN_SQL + " WHERE a.id=?", (cur.lastrowid,)).fetchone()
            return _row_to_assign(row)
        except Exception:
            return None


def complete_assignment(assignment_id: int) -> None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT volunteer_id, need_id FROM assignments WHERE id=?", (assignment_id,)
        ).fetchone()
        if not row:
            return
        conn.execute(
            "UPDATE assignments SET status='Completed', completed_at=CURRENT_TIMESTAMP WHERE id=?",
            (assignment_id,),
        )
        conn.execute(
            "UPDATE volunteers SET availability='Available' WHERE id=?", (row["volunteer_id"],)
        )
        conn.execute(
            "UPDATE needs SET status='Resolved', updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (row["need_id"],),
        )


def cancel_assignment(assignment_id: int) -> None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT volunteer_id, need_id FROM assignments WHERE id=?", (assignment_id,)
        ).fetchone()
        if not row:
            return
        conn.execute(
            "UPDATE assignments SET status='Cancelled' WHERE id=?", (assignment_id,)
        )
        conn.execute(
            "UPDATE volunteers SET availability='Available' WHERE id=?", (row["volunteer_id"],)
        )
        conn.execute(
            "UPDATE needs SET status='Open', updated_at=CURRENT_TIMESTAMP WHERE id=?",
            (row["need_id"],),
        )
