import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from src.app_utils import COMMON_CSS, render_sidebar, require_auth
from src.assignments_repo import list_assignments
from src.needs_repo import list_needs
from src.volunteers_repo import list_volunteers

st.set_page_config(page_title="Analytics — SevaSetu", page_icon="📊", layout="wide")
st.markdown(COMMON_CSS, unsafe_allow_html=True)
require_auth()
render_sidebar()

st.markdown("# 📊 Analytics & Reports")
st.divider()

needs       = list_needs()
volunteers  = list_volunteers()
assignments = list_assignments()

# ── Top-line metrics ──────────────────────────────────────────────────────────

m1, m2, m3, m4, m5 = st.columns(5)
total_needs    = len(needs)
resolved_needs = sum(1 for n in needs if n.status == "Resolved")
resolution_pct = int(resolved_needs / total_needs * 100) if total_needs else 0

m1.metric("Total Needs",       total_needs)
m2.metric("Resolved",          resolved_needs, f"{resolution_pct}%")
m3.metric("Total Volunteers",  len(volunteers))
m4.metric("Total Assignments", len(assignments))
m5.metric("Completion Rate",
          f"{int(sum(1 for a in assignments if a.status == 'Completed') / len(assignments) * 100) if assignments else 0}%")

st.divider()

# ── Charts row 1 ──────────────────────────────────────────────────────────────

ch1, ch2 = st.columns(2)

with ch1:
    st.markdown("#### Needs by Type")
    if needs:
        type_counts = pd.Series([n.need_type for n in needs]).value_counts().reset_index()
        type_counts.columns = ["Need Type", "Count"]
        fig = px.pie(
            type_counts, values="Count", names="Need Type",
            color_discrete_sequence=px.colors.qualitative.Safe,
            hole=0.4,
        )
        fig.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=320)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No needs data.")

with ch2:
    st.markdown("#### Needs by Urgency")
    if needs:
        urgency_counts = pd.Series([n.urgency for n in needs]).value_counts()
        urgency_order  = ["Critical", "High", "Medium", "Low"]
        urgency_counts = urgency_counts.reindex(urgency_order).dropna()
        color_map = {"Critical": "#FF4B4B", "High": "#FF7043", "Medium": "#FFC107", "Low": "#4CAF50"}
        fig = px.bar(
            x=urgency_counts.index,
            y=urgency_counts.values,
            color=urgency_counts.index,
            color_discrete_map=color_map,
            labels={"x": "Urgency", "y": "Count"},
        )
        fig.update_layout(showlegend=False, margin=dict(t=10, b=10, l=10, r=10), height=320)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No needs data.")

# ── Charts row 2 ──────────────────────────────────────────────────────────────

ch3, ch4 = st.columns(2)

with ch3:
    st.markdown("#### Volunteer Skills Distribution")
    if volunteers:
        skill_counts = pd.Series([v.skill for v in volunteers]).value_counts().reset_index()
        skill_counts.columns = ["Skill", "Count"]
        fig = px.bar(
            skill_counts, x="Count", y="Skill", orientation="h",
            color="Count",
            color_continuous_scale="Blues",
        )
        fig.update_layout(coloraxis_showscale=False, margin=dict(t=10, b=10, l=10, r=10), height=320)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No volunteer data.")

with ch4:
    st.markdown("#### Needs Status Breakdown")
    if needs:
        status_counts = pd.Series([n.status for n in needs]).value_counts().reset_index()
        status_counts.columns = ["Status", "Count"]
        status_colors = {"Open": "#2196F3", "In Progress": "#FF9800", "Resolved": "#4CAF50"}
        fig = px.pie(
            status_counts, values="Count", names="Status",
            color="Status", color_discrete_map=status_colors,
            hole=0.4,
        )
        fig.update_layout(margin=dict(t=10, b=10, l=10, r=10), height=320)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("No needs data.")

# ── Assignment timeline ───────────────────────────────────────────────────────

if assignments:
    st.divider()
    st.markdown("#### Assignment History")
    assign_df = pd.DataFrame(
        [
            {
                "Date":       a.assigned_at[:10] if a.assigned_at else "Unknown",
                "Volunteer":  a.volunteer_name,
                "Area":       a.need_area,
                "Need Type":  a.need_type,
                "Urgency":    a.urgency,
                "Status":     a.status,
            }
            for a in assignments
        ]
    )
    st.dataframe(assign_df, use_container_width=True, hide_index=True)
    csv = assign_df.to_csv(index=False).encode("utf-8")
    st.download_button(
        "⬇️ Export Assignments CSV",
        data=csv,
        file_name="sevasetu_analytics_export.csv",
        mime="text/csv",
    )

# ── Needs table export ────────────────────────────────────────────────────────

st.divider()
st.markdown("#### Export Raw Data")
ec1, ec2 = st.columns(2)

with ec1:
    if needs:
        needs_df = pd.DataFrame(
            [{"Area": n.area, "Type": n.need_type, "Urgency": n.urgency, "Status": n.status,
              "Description": n.description, "Created": n.created_at[:10]}
             for n in needs]
        )
        st.download_button(
            "⬇️ Export Needs CSV",
            data=needs_df.to_csv(index=False).encode("utf-8"),
            file_name="sevasetu_needs.csv",
            mime="text/csv",
            use_container_width=True,
        )

with ec2:
    if volunteers:
        vol_df = pd.DataFrame(
            [{"Name": v.name, "Skill": v.skill, "Location": v.location,
              "Availability": v.availability, "Phone": v.phone}
             for v in volunteers]
        )
        st.download_button(
            "⬇️ Export Volunteers CSV",
            data=vol_df.to_csv(index=False).encode("utf-8"),
            file_name="sevasetu_volunteers.csv",
            mime="text/csv",
            use_container_width=True,
        )
