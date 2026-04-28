import json
import re
import streamlit as st
import pandas as pd
import folium
from google import genai
from streamlit_folium import st_folium

st.set_page_config(page_title="SevaSetu", layout="wide")

# ── Constants ────────────────────────────────────────────────────────────────

URGENCY_ORDER  = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
URGENCY_BG     = {
    "Critical": "background-color: #ff4b4b; color: white",
    "High":     "background-color: #ff4b4b; color: white",
    "Medium":   "background-color: #ffd700; color: black",
    "Low":      "background-color: #21c354; color: white",
}
URGENCY_COLOR  = {"Critical": "red", "High": "red", "Medium": "orange", "Low": "green"}
SKILL_TO_NEED  = {
    "Medical":            "Medical Camp",
    "Logistics":          "Education Support",
    "Water & Sanitation": "Sanitation Drive",
    "Food Distribution":  "Food Distribution",
}

# ── Session state defaults ───────────────────────────────────────────────────

if "needs" not in st.session_state:
    st.session_state.needs = pd.DataFrame([
        {"Area": "Dharavi, Mumbai",  "Need Type": "Food Distribution", "Urgency": "High",     "lat": 19.0422, "lon": 72.8533},
        {"Area": "Govandi, Mumbai",  "Need Type": "Medical Camp",       "Urgency": "Critical", "lat": 19.2183, "lon": 72.9781},
        {"Area": "Kurla, Mumbai",    "Need Type": "Education Support",  "Urgency": "Medium",   "lat": 19.0726, "lon": 72.8867},
        {"Area": "Mankhurd, Mumbai", "Need Type": "Sanitation Drive",   "Urgency": "High",     "lat": 19.1136, "lon": 72.8697},
        {"Area": "Chembur, Mumbai",  "Need Type": "Shelter Assistance", "Urgency": "Low",      "lat": 19.2307, "lon": 72.8567},
    ])

if "volunteers" not in st.session_state:
    st.session_state.volunteers = pd.DataFrame([
        {"Volunteer": "Ramesh", "Skill": "Medical",             "Location": "Thane"},
        {"Volunteer": "Priya",  "Skill": "Logistics",           "Location": "Kurla"},
        {"Volunteer": "Amit",   "Skill": "Water & Sanitation",  "Location": "Dharavi"},
        {"Volunteer": "Sara",   "Skill": "Food Distribution",   "Location": "Andheri"},
        {"Volunteer": "Ravi",   "Skill": "Medical",             "Location": "Borivali"},
    ])

# ── Helpers ──────────────────────────────────────────────────────────────────

def sorted_needs(df: pd.DataFrame) -> pd.DataFrame:
    return df.assign(_order=df["Urgency"].map(URGENCY_ORDER)).sort_values("_order").drop(columns="_order")

def compute_matches(needs: pd.DataFrame, volunteers: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for _, vol in volunteers.iterrows():
        need_type = SKILL_TO_NEED.get(vol["Skill"])
        if not need_type:
            continue
        match = needs[needs["Need Type"] == need_type]
        if not match.empty:
            r = match.iloc[0]
            rows.append({
                "Volunteer":     vol["Volunteer"],
                "Skill":         vol["Skill"],
                "Assigned Area": r["Area"],
                "Need Type":     r["Need Type"],
                "Urgency":       r["Urgency"],
            })
    return pd.DataFrame(rows)

def color_urgency(val):
    return URGENCY_BG.get(val, "")

KEYWORD_NEED_MAP = {
    "food": "Food Distribution", "hunger": "Food Distribution", "meal": "Food Distribution",
    "medical": "Medical Camp", "doctor": "Medical Camp", "health": "Medical Camp", "hospital": "Medical Camp",
    "water": "Sanitation Drive", "sanitation": "Sanitation Drive", "toilet": "Sanitation Drive", "clean": "Sanitation Drive",
    "school": "Education Support", "education": "Education Support", "study": "Education Support", "teach": "Education Support",
    "shelter": "Shelter Assistance", "house": "Shelter Assistance", "homeless": "Shelter Assistance", "flood": "Shelter Assistance",
}
KEYWORD_URGENCY_MAP = {
    "urgent": "Critical", "emergency": "Critical", "critical": "Critical", "immediate": "Critical",
    "medium": "Medium", "moderate": "Medium", "soon": "Medium",
    "low": "Low", "minor": "Low", "whenever": "Low",
}

def _local_extract(description: str) -> dict:
    text = description.lower()
    need_type = next((v for k, v in KEYWORD_NEED_MAP.items() if k in text), "General Support")
    urgency   = next((v for k, v in KEYWORD_URGENCY_MAP.items() if k in text), "High")
    # crude area: first capitalised word sequence before a comma or end
    area_match = re.search(r'\bin\s+([A-Z][a-zA-Z\s,]+?)(?:\s+due|\s+because|\s+needs|\.|$)', description)
    area = area_match.group(1).strip().rstrip(",") if area_match else "Mumbai"
    return {"area": area, "need_type": need_type, "urgency": urgency}

def extract_need_with_gemini(description: str) -> dict | None:
    try:
        client = genai.Client(api_key=st.secrets["GEMINI_API_KEY"])
        prompt = (
            "Extract from this text: Area name, Need type, Urgency level (Critical/High/Medium/Low).\n"
            'Return only JSON like: {"area": "...", "need_type": "...", "urgency": "..."}\n\n'
            f"Text: {description}"
        )
        response = client.models.generate_content(model="gemini-2.0-flash-lite", contents=prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.MULTILINE).strip()
        return json.loads(raw)
    except Exception:
        # Gemini unavailable — fall back to local keyword extraction
        return _local_extract(description)

# ── Derived data (re-computed on every run) ──────────────────────────────────

needs      = sorted_needs(st.session_state.needs)
volunteers = st.session_state.volunteers
matched_df = compute_matches(needs, volunteers)

assigned_names = set(matched_df["Volunteer"]) if not matched_df.empty else set()
volunteers_display = volunteers.copy()
volunteers_display["Status"] = volunteers_display["Volunteer"].apply(
    lambda name: "🟢 Assigned" if name in assigned_names else "🔴 Available"
)

# ── Header ───────────────────────────────────────────────────────────────────

st.markdown("# SevaSetu 🤝")
st.markdown("### Smart Volunteer Coordination for NGOs")
st.divider()

col1, col2, col3 = st.columns(3)
col1.metric("Total Needs",       len(needs))
col2.metric("Total Volunteers",  len(volunteers))
col3.metric("Matches Made",      len(matched_df))
st.divider()

# ── Community Needs ───────────────────────────────────────────────────────────

st.markdown("### 📋 Community Needs")
urgency_filter = st.selectbox("Filter by Urgency", ["All", "Critical", "High", "Medium", "Low"], key="urgency_filter")
filtered_needs = needs if urgency_filter == "All" else needs[needs["Urgency"] == urgency_filter]
styled_needs = filtered_needs[["Area", "Need Type", "Urgency"]].style.map(color_urgency, subset=["Urgency"])
st.dataframe(styled_needs, use_container_width=True)

with st.expander("➕ Add Community Need"):
    with st.form("need_form", clear_on_submit=True):
        f_area     = st.text_input("Area")
        f_need     = st.text_input("Need Type")
        f_urgency  = st.selectbox("Urgency", ["Critical", "High", "Medium", "Low"])
        f_lat      = st.number_input("Latitude",  value=19.0760, format="%.4f")
        f_lon      = st.number_input("Longitude", value=72.8777, format="%.4f")
        if st.form_submit_button("Add Need") and f_area and f_need:
            new_row = pd.DataFrame([{"Area": f_area, "Need Type": f_need,
                                     "Urgency": f_urgency, "lat": f_lat, "lon": f_lon}])
            st.session_state.needs = pd.concat([st.session_state.needs, new_row], ignore_index=True)
            st.rerun()

with st.expander("🤖 Describe a Need in Plain Words (AI)"):
    with st.form("ai_need_form", clear_on_submit=True):
        ai_description = st.text_area(
            "Describe the community need",
            placeholder="e.g. There is an urgent need for clean drinking water in Bandra due to pipe leakage",
        )
        ai_lat = st.number_input("Latitude (approximate)",  value=19.0760, format="%.4f")
        ai_lon = st.number_input("Longitude (approximate)", value=72.8777, format="%.4f")
        if st.form_submit_button("Extract & Add with Gemini") and ai_description:
            with st.spinner("Asking Gemini..."):
                extracted = extract_need_with_gemini(ai_description)
            if extracted:
                urgency_val = extracted.get("urgency", "Medium").strip().title()
                if urgency_val not in URGENCY_ORDER:
                    urgency_val = "Medium"
                new_row = pd.DataFrame([{
                    "Area":      extracted.get("area", "Unknown"),
                    "Need Type": extracted.get("need_type", "General"),
                    "Urgency":   urgency_val,
                    "lat":       ai_lat,
                    "lon":       ai_lon,
                }])
                st.session_state.needs = pd.concat([st.session_state.needs, new_row], ignore_index=True)
                st.success(f"Added: {extracted.get('area')} — {extracted.get('need_type')} ({urgency_val})")
                st.rerun()

st.divider()

# ── Map ───────────────────────────────────────────────────────────────────────

st.markdown("### 🗺️ Needs Map")
m = folium.Map(location=[19.0760, 72.8777], zoom_start=11)
for _, row in filtered_needs.iterrows():
    folium.Marker(
        location=[row["lat"], row["lon"]],
        popup=folium.Popup(f"<b>{row['Area']}</b><br>{row['Need Type']}", max_width=200),
        icon=folium.Icon(color=URGENCY_COLOR[row["Urgency"]], icon="info-sign"),
    ).add_to(m)
st_folium(m, use_container_width=True, height=500)

st.markdown("### 📊 Needs by Area")
area_counts = needs.groupby("Area").size().rename("Number of Needs")
st.bar_chart(area_counts)
st.divider()

# ── Volunteers ────────────────────────────────────────────────────────────────

st.markdown("### 👥 Available Volunteers")
st.dataframe(volunteers_display, use_container_width=True)

with st.expander("➕ Add Volunteer"):
    with st.form("volunteer_form", clear_on_submit=True):
        v_name     = st.text_input("Name")
        v_skill    = st.text_input("Skill")
        v_location = st.text_input("Location")
        if st.form_submit_button("Add Volunteer") and v_name and v_skill and v_location:
            new_vol = pd.DataFrame([{"Volunteer": v_name, "Skill": v_skill, "Location": v_location}])
            st.session_state.volunteers = pd.concat([st.session_state.volunteers, new_vol], ignore_index=True)
            st.rerun()

st.divider()

# ── Matched Results ───────────────────────────────────────────────────────────

st.markdown("### ✅ Volunteer Assignments")
st.dataframe(matched_df, use_container_width=True)
