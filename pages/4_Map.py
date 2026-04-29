import folium
import streamlit as st
from streamlit_folium import st_folium

from src.app_utils import COMMON_CSS, render_sidebar, require_auth
from src.needs_repo import list_needs
from src.volunteers_repo import list_volunteers

st.set_page_config(page_title="Map — SevaSetu", page_icon="🗺️", layout="wide")
st.markdown(COMMON_CSS, unsafe_allow_html=True)
require_auth()
render_sidebar()

st.markdown("# 🗺️ Needs & Volunteer Map")
st.divider()

# ── Controls ──────────────────────────────────────────────────────────────────

fc1, fc2, fc3 = st.columns(3)
urgency_filter  = fc1.selectbox("Urgency",     ["All", "Critical", "High", "Medium", "Low"])
status_filter   = fc2.selectbox("Need Status", ["All", "Open", "In Progress", "Resolved"])
show_volunteers = fc3.checkbox("Show Volunteers", value=True)

needs      = list_needs(
    urgency=None if urgency_filter == "All" else urgency_filter,
    status=None  if status_filter  == "All" else status_filter,
)
volunteers = list_volunteers() if show_volunteers else []

# ── Build map ─────────────────────────────────────────────────────────────────

URGENCY_COLORS = {
    "Critical": "red",
    "High":     "orange",
    "Medium":   "beige",
    "Low":      "green",
}
AVAIL_COLORS = {
    "Available":   "blue",
    "Assigned":    "purple",
    "Unavailable": "gray",
}

m = folium.Map(location=[19.0760, 72.8777], zoom_start=11, tiles="CartoDB positron")

# Needs layer
needs_group = folium.FeatureGroup(name="Community Needs", show=True)
for n in needs:
    color = URGENCY_COLORS.get(n.urgency, "blue")
    popup_html = f"""
        <b>{n.area}</b><br>
        Type: {n.need_type}<br>
        Urgency: <span style='color:{color}'>{n.urgency}</span><br>
        Status: {n.status}<br>
        {f'<i>{n.description[:100]}</i>' if n.description else ''}
    """
    folium.Marker(
        location=[n.lat, n.lon],
        popup=folium.Popup(popup_html, max_width=250),
        tooltip=f"{n.area} — {n.need_type} ({n.urgency})",
        icon=folium.Icon(color=color, icon="exclamation-sign", prefix="glyphicon"),
    ).add_to(needs_group)
needs_group.add_to(m)

# Volunteers layer
if volunteers:
    vol_group = folium.FeatureGroup(name="Volunteers", show=True)
    for v in volunteers:
        color = AVAIL_COLORS.get(v.availability, "gray")
        popup_html = f"""
            <b>{v.name}</b><br>
            Skill: {v.skill}<br>
            Location: {v.location}<br>
            Status: {v.availability}<br>
            {f'📞 {v.phone}' if v.phone else ''}
        """
        folium.CircleMarker(
            location=[v.lat, v.lon],
            radius=8,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.8,
            popup=folium.Popup(popup_html, max_width=200),
            tooltip=f"{v.name} ({v.skill}) — {v.availability}",
        ).add_to(vol_group)
    vol_group.add_to(m)

folium.LayerControl(collapsed=False).add_to(m)

st_folium(m, use_container_width=True, height=580)

# ── Legend ─────────────────────────────────────────────────────────────────────

st.divider()
lc1, lc2 = st.columns(2)

with lc1:
    st.markdown("**Need Urgency**")
    for urgency, color in URGENCY_COLORS.items():
        dot = {"red": "🔴", "orange": "🟠", "beige": "🟡", "green": "🟢"}.get(color, "⚪")
        st.markdown(f"{dot} {urgency}")

with lc2:
    st.markdown("**Volunteer Status**")
    for status, color in AVAIL_COLORS.items():
        dot = {"blue": "🔵", "purple": "🟣", "gray": "⚫"}.get(color, "⚪")
        st.markdown(f"{dot} {status}")

st.caption(f"Showing {len(needs)} needs · {len(volunteers)} volunteers")
