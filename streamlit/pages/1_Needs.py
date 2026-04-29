import streamlit as st

from src.app_utils import COMMON_CSS, render_sidebar, require_auth
from src.ai_extractor import extract_need
from src.matching import ALL_NEED_TYPES
from src.needs_repo import create_need, delete_need, list_needs, update_need_status

st.set_page_config(page_title="Community Needs — SevaSetu", page_icon="📋", layout="wide")
st.markdown(COMMON_CSS, unsafe_allow_html=True)
require_auth()
render_sidebar()

is_admin = st.session_state.get("user_role") == "admin"

st.markdown("# 📋 Community Needs")
st.divider()

# ── Filters ──────────────────────────────────────────────────────────────────

fc1, fc2, fc3 = st.columns(3)
urgency_filter = fc1.selectbox("Urgency", ["All", "Critical", "High", "Medium", "Low"])
status_filter  = fc2.selectbox("Status",  ["All", "Open", "In Progress", "Resolved"])
type_filter    = fc3.selectbox("Need Type", ["All"] + ALL_NEED_TYPES)

needs = list_needs(
    status=None if status_filter == "All" else status_filter,
    urgency=None if urgency_filter == "All" else urgency_filter,
)
if type_filter != "All":
    needs = [n for n in needs if n.need_type == type_filter]

# ── Table ─────────────────────────────────────────────────────────────────────

URGENCY_BADGE = {
    "Critical": "🔴 Critical",
    "High":     "🟠 High",
    "Medium":   "🟡 Medium",
    "Low":      "🟢 Low",
}
STATUS_BADGE = {
    "Open":        "🔵 Open",
    "In Progress": "🟠 In Progress",
    "Resolved":    "🟢 Resolved",
}

if not needs:
    st.info("No needs match the current filters.")
else:
    for n in needs:
        with st.container(border=True):
            hc1, hc2, hc3, hc4 = st.columns([3, 2, 1.5, 1.5])
            hc1.markdown(f"**{n.area}**  \n{n.need_type}")
            hc2.markdown(URGENCY_BADGE.get(n.urgency, n.urgency))
            hc3.markdown(STATUS_BADGE.get(n.status, n.status))
            if n.description:
                st.caption(n.description)

            if is_admin:
                ac1, ac2, ac3, ac4 = st.columns(4)
                if n.status != "Open" and ac1.button("Mark Open", key=f"open_{n.id}"):
                    update_need_status(n.id, "Open")
                    st.rerun()
                if n.status != "In Progress" and ac2.button("In Progress", key=f"ip_{n.id}"):
                    update_need_status(n.id, "In Progress")
                    st.rerun()
                if n.status != "Resolved" and ac3.button("Resolved", key=f"res_{n.id}"):
                    update_need_status(n.id, "Resolved")
                    st.rerun()
                if ac4.button("🗑 Delete", key=f"del_{n.id}"):
                    delete_need(n.id)
                    st.rerun()

st.divider()

# ── Add Need ──────────────────────────────────────────────────────────────────

if not is_admin:
    st.info("Contact an admin to add or modify needs.")
    st.stop()

tab_manual, tab_ai = st.tabs(["➕ Add Manually", "🤖 Describe with AI"])

with tab_manual:
    with st.form("need_form", clear_on_submit=True):
        mc1, mc2 = st.columns(2)
        f_area    = mc1.text_input("Area / Neighbourhood")
        f_need    = mc2.selectbox("Need Type", ALL_NEED_TYPES)
        mc3, mc4  = st.columns(2)
        f_urgency = mc3.selectbox("Urgency", ["Critical", "High", "Medium", "Low"])
        f_status  = mc4.selectbox("Status",  ["Open", "In Progress"])
        f_desc    = st.text_area("Description (optional)")
        lc1, lc2  = st.columns(2)
        f_lat     = lc1.number_input("Latitude",  value=19.0760, format="%.4f")
        f_lon     = lc2.number_input("Longitude", value=72.8777, format="%.4f")
        if st.form_submit_button("Add Need", type="primary") and f_area:
            n = create_need(f_area, f_need, f_urgency, f_lat, f_lon, f_desc)
            update_need_status(n.id, f_status)
            st.success(f"Added: {n.area} — {n.need_type} ({n.urgency})")
            st.rerun()

with tab_ai:
    api_key = None
    try:
        api_key = st.secrets.get("GEMINI_API_KEY")
    except Exception:
        pass

    if not api_key:
        st.warning(
            "No Gemini API key found in `.streamlit/secrets.toml`. "
            "AI extraction will use keyword fallback."
        )

    with st.form("ai_need_form", clear_on_submit=True):
        ai_desc = st.text_area(
            "Describe the community need",
            placeholder="e.g. There is an urgent need for clean drinking water in Bandra due to pipe leakage",
        )
        alc1, alc2 = st.columns(2)
        ai_lat = alc1.number_input("Latitude",  value=19.0760, format="%.4f")
        ai_lon = alc2.number_input("Longitude", value=72.8777, format="%.4f")
        if st.form_submit_button("Extract & Add", type="primary") and ai_desc:
            with st.spinner("Extracting with AI…"):
                extracted = extract_need(ai_desc, api_key)
            urgency = extracted.get("urgency", "High").strip().title()
            if urgency not in ("Critical", "High", "Medium", "Low"):
                urgency = "High"
            n = create_need(
                extracted.get("area", "Unknown"),
                extracted.get("need_type", "General Support"),
                urgency,
                ai_lat,
                ai_lon,
                ai_desc,
            )
            st.success(f"Added: {n.area} — {n.need_type} ({urgency})")
            st.rerun()
