import streamlit as st

from src.database import init_db


@st.cache_resource
def _init_once() -> bool:
    init_db()
    return True


def require_init() -> None:
    _init_once()


def require_auth() -> None:
    require_init()
    if not st.session_state.get("logged_in"):
        st.warning("Please log in to access this page.")
        st.page_link("app.py", label="Go to Login", icon="🔐")
        st.stop()


def require_admin() -> None:
    require_auth()
    if st.session_state.get("user_role") != "admin":
        st.error("Admin access required.")
        st.stop()


def render_sidebar() -> None:
    with st.sidebar:
        st.markdown("## SevaSetu 🤝")
        st.caption("Smart Volunteer Coordination for NGOs")
        st.divider()
        if st.session_state.get("logged_in"):
            role_icon = "🛡️" if st.session_state.get("user_role") == "admin" else "👁️"
            st.markdown(
                f"{role_icon} **{st.session_state['username']}** "
                f"({st.session_state['user_role']})"
            )
            if st.button("Logout", use_container_width=True):
                for key in ("logged_in", "username", "user_role", "user_id"):
                    st.session_state.pop(key, None)
                st.rerun()


URGENCY_COLOR = {
    "Critical": "#FF4B4B",
    "High":     "#FF7043",
    "Medium":   "#FFC107",
    "Low":      "#4CAF50",
}

STATUS_COLOR = {
    "Open":        "#2196F3",
    "In Progress": "#FF9800",
    "Resolved":    "#4CAF50",
    "Active":      "#2196F3",
    "Completed":   "#4CAF50",
    "Cancelled":   "#9E9E9E",
    "Available":   "#4CAF50",
    "Assigned":    "#FF9800",
    "Unavailable": "#9E9E9E",
}

COMMON_CSS = """
<style>
div[data-testid="metric-container"] {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 16px;
}
div[data-testid="metric-container"] label {
    font-size: 0.85rem;
    color: #6c757d;
}
</style>
"""
