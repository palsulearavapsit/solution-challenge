import hashlib
import secrets
from typing import Optional

from src.database import get_db
from src.models import User


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.sha256(f"{salt}{password}".encode()).hexdigest()
    return f"{salt}:{h}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, h = stored_hash.split(":", 1)
        return hashlib.sha256(f"{salt}{password}".encode()).hexdigest() == h
    except Exception:
        return False


def authenticate(username: str, password: str) -> Optional[User]:
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()
    if not row or not verify_password(password, row["password_hash"]):
        return None
    return User(id=row["id"], username=row["username"], role=row["role"], created_at=row["created_at"])


def create_user(username: str, password: str, role: str = "viewer") -> Optional[User]:
    try:
        with get_db() as conn:
            cur = conn.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (?,?,?)",
                (username, hash_password(password), role),
            )
            return User(id=cur.lastrowid, username=username, role=role)
    except Exception:
        return None
