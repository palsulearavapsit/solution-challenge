import streamlit as st

from src.app_utils import COMMON_CSS, STATUS_COLOR, render_sidebar, require_auth
from src.matching import ALL_SKILLS
from src.volunteers_repo import (
    create_volunteer,
    delete_volunteer,
    list_volunteers,
    update_volunteer_availability,
)

st.set_page_config(page_title="Volunteers — SevaSetu", page_icon="👥", layout="wide")
st.markdown(COMMON_CSS, unsafe_allow_html=True)
require_auth()
render_sidebar()

is_admin = st.session_state.get("user_role") == "admin"

st.markdown("# 👥 Volunteers")
st.divider()

# ── Filters ───────────────────────────────────────────────────────────────────

fc1, fc2 = st.columns(2)
avail_filter = fc1.selectbox("Availability", ["All", "Available", "Assigned", "Unavailable"])
skill_filter = fc2.selectbox("Skill", ["All"] + ALL_SKILLS)

volunteers = list_volunteers(
    availability=None if avail_filter == "All" else avail_filter
)
if skill_filter != "All":
    volunteers = [v for v in volunteers if v.skill == skill_filter]

# ── Summary metrics ───────────────────────────────────────────────────────────

mc1, mc2, mc3 = st.columns(3)
mc1.metric("Total",     len(volunteers))
mc2.metric("Available", sum(1 for v in volunteers if v.availability == "Available"))
mc3.metric("Assigned",  sum(1 for v in volunteers if v.availability == "Assigned"))
st.divider()

# ── Volunteer cards ───────────────────────────────────────────────────────────

AVAIL_ICON = {"Available": "🟢", "Assigned": "🟠", "Unavailable": "⚫"}

if not volunteers:
    st.info("No volunteers match the current filters.")
else:
    for v in volunteers:
        with st.container(border=True):
            hc1, hc2, hc3 = st.columns([3, 2, 2])
            icon = AVAIL_ICON.get(v.availability, "⚪")
            hc1.markdown(f"**{v.name}**  \n{v.skill}")
            hc2.markdown(f"📍 {v.location}")
            hc3.markdown(f"{icon} {v.availability}")
            if v.phone:
                st.caption(f"📞 {v.phone}" + (f"  |  ✉️ {v.email}" if v.email else ""))

            if is_admin:
                ac1, ac2, ac3, ac4 = st.columns(4)
                if v.availability != "Available" and ac1.button(
                    "Mark Available", key=f"avail_{v.id}"
                ):
                    update_volunteer_availability(v.id, "Available")
                    st.rerun()
                if v.availability != "Unavailable" and ac2.button(
                    "Mark Unavailable", key=f"unavail_{v.id}"
                ):
                    update_volunteer_availability(v.id, "Unavailable")
                    st.rerun()
                if ac4.button("🗑 Remove", key=f"del_{v.id}"):
                    delete_volunteer(v.id)
                    st.rerun()

st.divider()

# ── Add volunteer ──────────────────────────────────────────────────────────────

if not is_admin:
    st.info("Contact an admin to add volunteers.")
    st.stop()

with st.expander("➕ Add Volunteer", expanded=False):
    with st.form("vol_form", clear_on_submit=True):
        fc1, fc2 = st.columns(2)
        v_name     = fc1.text_input("Full Name")
        v_skill    = fc2.selectbox("Skill", ALL_SKILLS)
        fc3, fc4   = st.columns(2)
        v_location = fc3.text_input("Location / Neighbourhood")
        v_phone    = fc4.text_input("Phone (optional)")
        v_email    = st.text_input("Email (optional)")
        lc1, lc2   = st.columns(2)
        v_lat      = lc1.number_input("Latitude",  value=19.0760, format="%.4f")
        v_lon      = lc2.number_input("Longitude", value=72.8777, format="%.4f")
        if st.form_submit_button("Add Volunteer", type="primary") and v_name and v_location:
            vol = create_volunteer(v_name, v_skill, v_location, v_lat, v_lon, v_phone, v_email)
            st.success(f"Added volunteer: {vol.name} ({vol.skill})")
            st.rerun()
