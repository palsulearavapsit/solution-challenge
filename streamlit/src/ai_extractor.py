import json
import re
from typing import Optional

KEYWORD_NEED_MAP: dict[str, str] = {
    "food": "Food Distribution", "hunger": "Food Distribution",
    "meal": "Food Distribution", "ration": "Food Distribution",
    "medical": "Medical Camp", "doctor": "Medical Camp",
    "health": "Medical Camp", "hospital": "Medical Camp", "clinic": "Medical Camp",
    "water": "Sanitation Drive", "sanitation": "Sanitation Drive",
    "toilet": "Sanitation Drive", "drain": "Sanitation Drive", "sewage": "Sanitation Drive",
    "school": "Education Support", "education": "Education Support",
    "study": "Education Support", "teach": "Education Support", "children": "Education Support",
    "shelter": "Shelter Assistance", "house": "Shelter Assistance",
    "homeless": "Shelter Assistance", "flood": "Shelter Assistance", "displaced": "Shelter Assistance",
}
KEYWORD_URGENCY_MAP: dict[str, str] = {
    "urgent": "Critical", "emergency": "Critical", "critical": "Critical",
    "immediate": "Critical", "severe": "Critical",
    "high": "High", "serious": "High",
    "medium": "Medium", "moderate": "Medium", "soon": "Medium",
    "low": "Low", "minor": "Low", "whenever": "Low",
}


def _local_extract(text: str) -> dict:
    lower = text.lower()
    need_type = next((v for k, v in KEYWORD_NEED_MAP.items() if k in lower), "General Support")
    urgency = next((v for k, v in KEYWORD_URGENCY_MAP.items() if k in lower), "High")
    area_match = re.search(
        r"\bin\s+([A-Z][a-zA-Z\s]+?)(?:\s+due|\s+needs|\s+requires|\s+there|\.|,|$)", text
    )
    area = area_match.group(1).strip() if area_match else "Mumbai"
    return {"area": area, "need_type": need_type, "urgency": urgency}


def _call_gemini(description: str, api_key: str) -> Optional[dict]:
    try:
        from google import genai

        client = genai.Client(api_key=api_key)
        prompt = (
            "Extract structured data from this community need description.\n"
            "Return ONLY valid JSON with these exact keys:\n"
            '  "area": city/neighbourhood name (string)\n'
            '  "need_type": one of [Food Distribution, Medical Camp, Education Support, Sanitation Drive, Shelter Assistance]\n'
            '  "urgency": one of [Critical, High, Medium, Low]\n\n'
            f"Description: {description}"
        )
        response = client.models.generate_content(model="gemini-2.0-flash-lite", contents=prompt)
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", response.text.strip(), flags=re.MULTILINE).strip()
        return json.loads(raw)
    except Exception:
        return None


def extract_need(description: str, api_key: Optional[str] = None) -> dict:
    if api_key:
        result = _call_gemini(description, api_key)
        if result:
            return result
    return _local_extract(description)
