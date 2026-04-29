import hashlib
import secrets
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

DB_PATH = Path("data/sevasetu.db")


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS needs (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                area        TEXT    NOT NULL,
                need_type   TEXT    NOT NULL,
                urgency     TEXT    NOT NULL,
                lat         REAL    NOT NULL,
                lon         REAL    NOT NULL,
                description TEXT    DEFAULT '',
                status      TEXT    DEFAULT 'Open',
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS volunteers (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                name         TEXT    NOT NULL,
                skill        TEXT    NOT NULL,
                location     TEXT    NOT NULL,
                lat          REAL    DEFAULT 19.0760,
                lon          REAL    DEFAULT 72.8777,
                phone        TEXT    DEFAULT '',
                email        TEXT    DEFAULT '',
                availability TEXT    DEFAULT 'Available',
                created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS assignments (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                volunteer_id INTEGER NOT NULL,
                need_id      INTEGER NOT NULL,
                assigned_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                completed_at TIMESTAMP,
                status       TEXT    DEFAULT 'Active',
                notes        TEXT    DEFAULT '',
                FOREIGN KEY(volunteer_id) REFERENCES volunteers(id),
                FOREIGN KEY(need_id)      REFERENCES needs(id),
                UNIQUE(volunteer_id, need_id)
            );

            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                username      TEXT    UNIQUE NOT NULL,
                password_hash TEXT    NOT NULL,
                role          TEXT    DEFAULT 'viewer',
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_needs_urgency ON needs(urgency);
            CREATE INDEX IF NOT EXISTS idx_needs_status  ON needs(status);
            CREATE INDEX IF NOT EXISTS idx_vol_skill     ON volunteers(skill);
            CREATE INDEX IF NOT EXISTS idx_vol_avail     ON volunteers(availability);
            CREATE INDEX IF NOT EXISTS idx_assign_status ON assignments(status);
        """)
        _seed(conn)


def _seed(conn: sqlite3.Connection) -> None:
    if conn.execute("SELECT COUNT(*) FROM needs").fetchone()[0] > 0:
        return

    conn.executemany(
        "INSERT INTO needs (area, need_type, urgency, lat, lon, description) VALUES (?,?,?,?,?,?)",
        [
            ("Dharavi, Mumbai",  "Food Distribution",  "High",     19.0422, 72.8533, "Daily food supply needed for 500+ families displaced by flooding."),
            ("Govandi, Mumbai",  "Medical Camp",       "Critical", 19.2183, 72.9781, "Urgent medical attention required — outbreak of waterborne illness post-monsoon."),
            ("Kurla, Mumbai",    "Education Support",  "Medium",   19.0726, 72.8867, "Learning materials and tutoring for 200 children who missed school."),
            ("Mankhurd, Mumbai", "Sanitation Drive",   "High",     19.1136, 72.8697, "Blocked drains causing severe health hazard in residential area."),
            ("Chembur, Mumbai",  "Shelter Assistance", "Low",      19.2307, 72.8567, "Temporary shelter needed for 30 displaced families."),
        ],
    )

    conn.executemany(
        "INSERT INTO volunteers (name, skill, location, lat, lon, phone) VALUES (?,?,?,?,?,?)",
        [
            ("Ramesh Sharma",  "Medical",            "Thane",    19.2183, 72.9781, "9876543210"),
            ("Priya Desai",    "Logistics",          "Kurla",    19.0726, 72.8867, "9876543211"),
            ("Amit Patil",     "Water & Sanitation", "Dharavi",  19.0422, 72.8533, "9876543212"),
            ("Sara Khan",      "Food Distribution",  "Andheri",  19.1196, 72.8468, "9876543213"),
            ("Ravi Joshi",     "Medical",            "Borivali", 19.2307, 72.8567, "9876543214"),
            ("Neha Singh",     "Education",          "Kurla",    19.0726, 72.8867, "9876543215"),
            ("Deepak Verma",   "Construction",       "Chembur",  19.2307, 72.8567, "9876543216"),
        ],
    )

    if conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        salt = secrets.token_hex(16)
        h = hashlib.sha256(f"{salt}admin123".encode()).hexdigest()
        conn.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?,?,?)",
            ("admin", f"{salt}:{h}", "admin"),
        )
