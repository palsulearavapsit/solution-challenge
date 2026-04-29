import streamlit as st

from src.app_utils import COMMON_CSS, require_init, render_sidebar
from src.auth import authenticate
from src.assignments_repo import list_assignments
from src.needs_repo import list_needs
from src.volunteers_repo import list_volunteers

st.set_page_config(page_title="SevaSetu", page_icon="🤝", layout="wide")
st.markdown(COMMON_CSS, unsafe_allow_html=True)

require_init()
render_sidebar()

# ── Login gate ────────────────────────────────────────────────────────────────

if not st.session_state.get("logged_in"):
    col_l, col_c, col_r = st.columns([1, 1.2, 1])
    with col_c:
        st.markdown("# SevaSetu 🤝")
        st.markdown("### Smart Volunteer Coordination for NGOs")
        st.markdown(
            "> *Bridging community needs with willing hearts — powered by AI.*"
        )
        st.divider()

        with st.form("login_form"):
            username = st.text_input("Username", placeholder="admin")
            password = st.text_input("Password", type="password", placeholder="••••••••")
            submitted = st.form_submit_button("Login", use_container_width=True, type="primary")

        if submitted:
            user = authenticate(username.strip(), password)
            if user:
                st.session_state["logged_in"] = True
                st.session_state["username"]  = user.username
                st.session_state["user_role"] = user.role
                st.session_state["user_id"]   = user.id
                st.rerun()
            else:
                st.error("Invalid username or password.")

        st.caption("Default credentials — username: `admin` · password: `admin123`")
    st.stop()

# ── Dashboard (logged-in) ────────────────────────────────────────────────────

st.markdown("# SevaSetu Dashboard 🤝")
st.caption("Smart Volunteer Coordination for NGOs")
st.divider()

needs       = list_needs()
volunteers  = list_volunteers()
assignments = list_assignments()

open_needs    = [n for n in needs if n.status == "Open"]
critical_needs = [n for n in needs if n.urgency == "Critical" and n.status != "Resolved"]
available_vol  = [v for v in volunteers if v.availability == "Available"]
active_assigns = [a for a in assignments if a.status == "Active"]

c1, c2, c3, c4 = st.columns(4)
c1.metric("Open Needs",          len(open_needs))
c2.metric("Critical Needs",      len(critical_needs), delta=None if not critical_needs else "⚠️")
c3.metric("Available Volunteers", len(available_vol))
c4.metric("Active Assignments",   len(active_assigns))

st.divider()

left, right = st.columns(2)

with left:
    st.markdown("#### Highest Priority Needs")
    if open_needs:
        for n in open_needs[:5]:
            urgency_colors = {"Critical": "🔴", "High": "🟠", "Medium": "🟡", "Low": "🟢"}
            icon = urgency_colors.get(n.urgency, "⚪")
            with st.container(border=True):
                st.markdown(f"{icon} **{n.area}** — {n.need_type}")
                st.caption(f"{n.urgency} · {n.status}" + (f" · {n.description[:80]}…" if n.description else ""))
    else:
        st.info("No open needs at the moment.")

with right:
    st.markdown("#### Recent Assignments")
    if active_assigns:
        for a in active_assigns[:5]:
            with st.container(border=True):
                st.markdown(f"**{a.volunteer_name}** → {a.need_area}")
                st.caption(f"{a.need_type} · {a.urgency}")
    else:
        st.info("No active assignments yet.")

st.divider()
st.markdown("#### Quick Navigation")
nc1, nc2, nc3, nc4, nc5 = st.columns(5)
nc1.page_link("pages/1_Needs.py",       label="📋 Needs",       use_container_width=True)
nc2.page_link("pages/2_Volunteers.py",  label="👥 Volunteers",  use_container_width=True)
nc3.page_link("pages/3_Assignments.py", label="✅ Assignments",  use_container_width=True)
nc4.page_link("pages/4_Map.py",         label="🗺️ Map",         use_container_width=True)
nc5.page_link("pages/5_Analytics.py",   label="📊 Analytics",   use_container_width=True)
