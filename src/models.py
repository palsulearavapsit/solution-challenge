from dataclasses import dataclass
from typing import Optional


@dataclass
class Need:
    id: int
    area: str
    need_type: str
    urgency: str
    lat: float
    lon: float
    description: str = ""
    status: str = "Open"
    created_at: str = ""
    updated_at: str = ""


@dataclass
class Volunteer:
    id: int
    name: str
    skill: str
    location: str
    lat: float
    lon: float
    phone: str = ""
    email: str = ""
    availability: str = "Available"
    created_at: str = ""


@dataclass
class Assignment:
    id: int
    volunteer_id: int
    need_id: int
    assigned_at: str = ""
    completed_at: Optional[str] = None
    status: str = "Active"
    notes: str = ""
    volunteer_name: str = ""
    need_area: str = ""
    need_type: str = ""
    urgency: str = ""


@dataclass
class User:
    id: int
    username: str
    role: str
    created_at: str = ""
