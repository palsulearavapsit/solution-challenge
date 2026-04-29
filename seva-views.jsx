// Tab views: Map, Volunteers, Impact

// ─── Map view (fullscreen) ───────────────────────────────────────────────
const MapView = ({ needs, selectedId, onSelect }) => {
  const sortedByUrg = [...needs].sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]);
  const selected = needs.find(n => n.id === selectedId) || sortedByUrg[0];

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Live needs map · Mumbai</h2>
          <div className="sub">Real-time urgency markers across {new Set(needs.map(n => n.area)).size} neighbourhoods</div>
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Updated 38s ago · {needs.length} active
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 18, alignItems: "start" }}>
        <div className="map-fullscreen">
          <SevaMap needs={needs} onSelect={onSelect} selectedId={selectedId} />
        </div>

        <div className="map-side">
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            By urgency
          </div>
          {sortedByUrg.map(n => (
            <div key={n.id} className="map-need-row" onClick={() => onSelect(n.id)} style={selectedId === n.id ? { background: "var(--saffron-soft)" } : {}}>
              <span className="marker-mini" style={{ background: URGENCY_COLOR[n.urgency] }} />
              <div className="body">
                <div className="ttl">{n.title}</div>
                <div className="meta">
                  {n.area} · {n.urgency} · {n.beneficiaries} people
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="panel" style={{ marginTop: 18 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Focused need · {selected.area}
          </div>
          <h3 style={{ marginTop: 0 }}>{selected.title}</h3>
          <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: 8 }}>{selected.story}</p>
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>BENEFICIARIES <b style={{ color: "var(--ink)" }}>{selected.beneficiaries}</b></span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>STAFFED <b style={{ color: "var(--ink)" }}>{selected.pledged}/{selected.needed}</b></span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>POSTED <b style={{ color: "var(--ink)" }}>{selected.requestedAt} ago</b></span>
            <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>BY <b style={{ color: "var(--ink)" }}>{selected.requestedBy}</b></span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Volunteers view ────────────────────────────────────────────────────
const VolunteersView = ({ volunteers, assignments, assignedVolIds }) => {
  const ranked = [...volunteers].sort((a, b) => b.completed - a.completed);
  const maxCompleted = Math.max(...volunteers.map(v => v.completed));
  const totalHours = volunteers.reduce((s, v) => s + v.hours, 0);
  const totalCompleted = volunteers.reduce((s, v) => s + v.completed, 0);

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Volunteer community</h2>
          <div className="sub">{volunteers.length} active members · {totalHours} hours pledged · {totalCompleted} drives completed</div>
        </div>
        <button className="btn saffron">
          <Icon name="plus" size={12} /> Invite a volunteer
        </button>
      </div>

      {/* KPI strip */}
      <div className="kpis">
        <div className="kpi">
          <span className="k">Active roster</span>
          <span className="v">{volunteers.length}</span>
          <span className="d">across 6 skills <span className="delta">+3 this month</span></span>
        </div>
        <div className="kpi">
          <span className="k">Available now</span>
          <span className="v">{volunteers.length - assignedVolIds.size}</span>
          <span className="d">ready to deploy <span className="delta">{Math.round((1 - assignedVolIds.size / volunteers.length) * 100)}%</span></span>
        </div>
        <div className="kpi">
          <span className="k">Avg rating</span>
          <span className="v">4.8<span style={{ fontSize: 22, color: "var(--ink-3)" }}>/5</span></span>
          <span className="d">community feedback <span className="delta">+0.2 ytd</span></span>
        </div>
        <div className="kpi">
          <span className="k">Hours pledged</span>
          <span className="v">{totalHours}</span>
          <span className="d">this quarter <span className="delta">on track</span></span>
        </div>
      </div>

      {/* Roster grid */}
      <div className="vol-grid">
        {volunteers.map(v => {
          const isAssigned = assignedVolIds.has(v.id);
          return (
            <div key={v.id} className="vol-tile">
              <div className="head">
                <Avatar name={v.name} color={v.color} size={48} />
                <div className="name-block">
                  <h4>{v.name}</h4>
                  <div className="sub">{v.location}</div>
                </div>
                <div className={`status ${isAssigned ? "busy" : "avail"}`} style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 999,
                  fontFamily: "'Geist Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em",
                  background: isAssigned ? "var(--canvas-2)" : "var(--sage-soft)",
                  color: isAssigned ? "var(--ink-3)" : "oklch(0.40 0.08 150)",
                }}>
                  {isAssigned ? "Deployed" : "Ready"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span className="skill-chip"><Icon name="spark" size={10} /> {v.skillShort || v.skill}</span>
                <span className="rating"><span className="star">★</span> {v.rating}</span>
              </div>

              <div className="stats">
                <div className="stat"><span className="v">{v.completed}</span><span className="k">drives</span></div>
                <div className="stat"><span className="v">{v.hours}h</span><span className="k">pledged</span></div>
                <div className="stat"><span className="v">{Math.floor(v.completed * 12)}</span><span className="k">helped</span></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <div className="leaderboard">
        <h3 style={{ margin: "0 0 4px", fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 22, letterSpacing: "-0.01em" }}>
          Top contributors this quarter
        </h3>
        <div className="sub" style={{ color: "var(--ink-3)", fontSize: 12, marginBottom: 12 }}>
          Ranked by drives completed
        </div>
        {ranked.map((v, i) => (
          <div key={v.id} className="leader-row">
            <span className={`rank ${i < 3 ? "top" : ""}`}>#{i + 1}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={v.name} color={v.color} size={28} />
              <div>
                <div style={{ fontWeight: 500 }}>{v.name}</div>
                <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{v.skillShort || v.skill}</div>
              </div>
            </div>
            <div className="bar"><div style={{ width: `${(v.completed / maxCompleted) * 100}%` }} /></div>
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-2)" }}>{v.completed} drives</span>
            <span className="rating" style={{ justifySelf: "end" }}><span className="star">★</span> {v.rating}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Impact view ────────────────────────────────────────────────────────
const ImpactView = ({ needs, volunteers, impactCount }) => {
  const totalBeneficiaries = needs.reduce((s, n) => s + n.beneficiaries, 0);
  const totalCompleted = volunteers.reduce((s, v) => s + v.completed, 0);
  const totalHours = volunteers.reduce((s, v) => s + v.hours, 0);

  // Need-type distribution
  const byType = {};
  needs.forEach(n => { byType[n.type] = (byType[n.type] || 0) + n.beneficiaries; });
  const maxType = Math.max(...Object.values(byType), 1);
  const typeColors = {
    "Food Distribution": "var(--saffron)",
    "Medical Camp": "var(--crit)",
    "Education Support": "var(--indigo)",
    "Sanitation Drive": "oklch(0.60 0.10 200)",
    "Shelter Assistance": "var(--sage)",
  };

  // Stories
  const stories = [
    {
      area: "Dharavi",
      caption: "shelter food drive",
      title: "240 families fed during monsoon displacement",
      quote: "We had no kitchen, no gas, nothing. SevaSetu volunteers brought hot khichdi every evening for 14 days.",
      by: "Asha — Dharavi resident",
    },
    {
      area: "Govandi",
      caption: "pediatric health camp",
      title: "32 children screened in 6 hours",
      quote: "Three doctors showed up on a Sunday morning. Two kids needed urgent care — we caught it just in time.",
      by: "Dr. Nair, Govandi PHC",
    },
    {
      area: "Mankhurd",
      caption: "drain clearing",
      title: "1,200 residents protected from flooding",
      quote: "Last monsoon our lane was a river. This year, the drains were clear. The volunteers worked alongside us.",
      by: "Mankhurd RWA chair",
    },
  ];

  return (
    <div>
      <div className="section-head">
        <div>
          <h2>Impact across Mumbai</h2>
          <div className="sub">Every pledge, every drive, every life touched — measured and verified.</div>
        </div>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          since launch · Apr 2025
        </span>
      </div>

      {/* Headline stats */}
      <div className="impact-grid">
        <div className="impact-stat dark" style={{ gridColumn: "span 2" }}>
          <span className="k">Lives touched · cumulative</span>
          <div className="v" style={{ fontSize: 84 }}>
            {impactCount.toLocaleString()}
          </div>
          <span className="delta" style={{ color: "oklch(0.85 0.08 150)" }}>+147 in the last hour</span>
        </div>
        <div className="impact-stat">
          <span className="k">Drives completed</span>
          <span className="v">{totalCompleted}</span>
          <span className="delta">+8 this week</span>
        </div>
        <div className="impact-stat">
          <span className="k">Volunteer hours</span>
          <span className="v">{totalHours}</span>
          <span className="delta">across {volunteers.length} people</span>
        </div>
      </div>

      <div className="impact-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="impact-stat">
          <span className="k">Meals served</span>
          <span className="v">2,180</span>
          <span className="delta">+340 this month</span>
        </div>
        <div className="impact-stat">
          <span className="k">Medical screenings</span>
          <span className="v">412</span>
          <span className="delta">+62 this month</span>
        </div>
        <div className="impact-stat">
          <span className="k">Children tutored</span>
          <span className="v">186</span>
          <span className="delta">+12 this month</span>
        </div>
        <div className="impact-stat">
          <span className="k">Areas reached</span>
          <span className="v">{new Set(needs.map(n => n.area)).size}</span>
          <span className="delta">across Mumbai</span>
        </div>
      </div>

      {/* Bars */}
      <div className="impact-bars">
        <h3 style={{ margin: "0 0 4px", fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 22, letterSpacing: "-0.01em" }}>
          Where help is going
        </h3>
        <div className="sub" style={{ color: "var(--ink-3)", fontSize: 12, marginBottom: 14 }}>
          Beneficiaries by need type · live
        </div>
        {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
          <div key={type} className="bar-row">
            <span className="label-text">
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: typeColors[type] || "var(--ink)" }} />
              {type}
            </span>
            <div className="track">
              <div className="fill" style={{ width: `${(count / maxType) * 100}%`, background: typeColors[type] || "var(--ink)" }} />
            </div>
            <span className="num">{count.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Stories */}
      <div className="section-head" style={{ marginTop: 32 }}>
        <div>
          <h2>Stories from the ground</h2>
          <div className="sub">Why this matters — in their own words</div>
        </div>
      </div>
      <div className="stories">
        {stories.map((s, i) => (
          <div key={i} className="story-card">
            <div className="photo">[ {s.caption} · {s.area} ]</div>
            <div>
              <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                {s.area} · field report
              </div>
              <h4>{s.title}</h4>
            </div>
            <p className="quote">"{s.quote}"</p>
            <div className="by">— {s.by}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

Object.assign(window, { MapView, VolunteersView, ImpactView });
