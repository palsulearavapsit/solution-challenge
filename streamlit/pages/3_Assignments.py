import streamlit as st

from src.app_utils import COMMON_CSS, render_sidebar, require_auth
from src.assignments_repo import (
    cancel_assignment,
    complete_assignment,
    create_assignment,
    list_assignments,
)
from src.matching import find_matches
from src.needs_repo import list_needs
from src.volunteers_repo import list_volunteers

st.set_page_config(page_title="Assignments — SevaSetu", page_icon="✅", layout="wide")
st.markdown(COMMON_CSS, unsafe_allow_html=True)
require_auth()
render_sidebar()

is_admin = st.session_state.get("user_role") == "admin"

st.markdown("# ✅ Volunteer Assignments")
st.divider()

tab_smart, tab_active, tab_history = st.tabs(
    ["🤖 Smart Matching", "📌 Active Assignments", "📜 History"]
)

# ── Smart Matching ─────────────────────────────────────────────────────────────

with tab_smart:
    needs      = list_needs()
    volunteers = list_volunteers()
    matches    = find_matches(volunteers, needs)

    if not matches:
        st.info(
            "No matches found. This means either all needs are filled, "
            "all volunteers are assigned, or no skill overlaps exist within 50 km."
        )
    else:
        st.markdown(f"**{len(matches)} potential matches** ranked by urgency + proximity.")
        st.caption("Score = 65% urgency weight + 35% proximity (within 50 km).")
        st.divider()

        for score, vol, need in matches:
            pct = int(score * 100)
            with st.container(border=True):
                mc1, mc2, mc3 = st.columns([3, 3, 1.5])
                mc1.markdown(
                    f"**{vol.name}**  \n"
                    f"🛠 {vol.skill}  ·  📍 {vol.location}"
                )
                mc2.markdown(
                    f"**{need.area}**  \n"
                    f"{need.need_type}  ·  {need.urgency}"
                )

                urgency_colors = {"Critical": "🔴", "High": "🟠", "Medium": "🟡", "Low": "🟢"}
                icon = urgency_colors.get(need.urgency, "⚪")
                mc3.markdown(f"**Score:** {pct}%  \n{icon}")

                st.progress(pct)

                if is_admin:
                    if st.button(
                        f"Assign {vol.name} → {need.area}",
                        key=f"assign_{vol.id}_{need.id}",
                        type="primary",
                        use_container_width=True,
                    ):
                        result = create_assignment(vol.id, need.id)
                        if result:
                            st.success(
                                f"Assigned **{vol.name}** to **{need.area}** ({need.need_type})"
                            )
                            st.rerun()
                        else:
                            st.warning("Assignment already exists or failed.")

# ── Active Assignments ─────────────────────────────────────────────────────────

with tab_active:
    active = list_assignments(status="Active")
    if not active:
        st.info("No active assignments.")
    else:
        for a in active:
            with st.container(border=True):
                hc1, hc2, hc3 = st.columns([3, 3, 2])
                hc1.markdown(f"**{a.volunteer_name}**")
                hc2.markdown(f"{a.need_area}  \n{a.need_type} · {a.urgency}")
                hc3.markdown(f"*Assigned:* {a.assigned_at[:10]}")
                if a.notes:
                    st.caption(f"Note: {a.notes}")

                if is_admin:
                    bc1, bc2 = st.columns(2)
                    if bc1.button("✅ Complete", key=f"complete_{a.id}", use_container_width=True):
                        complete_assignment(a.id)
                        st.success(f"Marked assignment #{a.id} as completed.")
                        st.rerun()
                    if bc2.button("❌ Cancel", key=f"cancel_{a.id}", use_container_width=True):
                        cancel_assignment(a.id)
                        st.info(f"Cancelled assignment #{a.id}.")
                        st.rerun()

# ── History ────────────────────────────────────────────────────────────────────

with tab_history:
    import pandas as pd

    status_filter = st.selectbox(
        "Filter by status", ["All", "Completed", "Cancelled", "Active"], key="hist_filter"
    )
    history = list_assignments(
        status=None if status_filter == "All" else status_filter
    )

    if not history:
        st.info("No assignment history yet.")
    else:
        rows = [
            {
                "Volunteer":   a.volunteer_name,
                "Area":        a.need_area,
                "Need Type":   a.need_type,
                "Urgency":     a.urgency,
                "Status":      a.status,
                "Assigned At": a.assigned_at[:16] if a.assigned_at else "",
                "Completed At": a.completed_at[:16] if a.completed_at else "—",
            }
            for a in history
        ]
        df = pd.DataFrame(rows)
        st.dataframe(df, use_container_width=True, hide_index=True)

        csv = df.to_csv(index=False).encode("utf-8")
        st.download_button(
            "⬇️ Export CSV",
            data=csv,
            file_name="sevasetu_assignments.csv",
            mime="text/csv",
        )
