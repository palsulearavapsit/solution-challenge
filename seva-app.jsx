// Main app — orchestrates state, drag/drop, filters, NLP add flow
const { useState, useEffect, useMemo, useRef, useCallback } = React;

function App() {
  const [needs, setNeeds] = useState(SEED_NEEDS);
  const [volunteers, setVolunteers] = useState(SEED_VOLUNTEERS);
  const [assignments, setAssignments] = useState([]); // [{volId, needId}]
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [selectedNeedId, setSelectedNeedId] = useState(null);
  const [activeDrag, setActiveDrag] = useState(null); // vol object
  const [hoverNeedId, setHoverNeedId] = useState(null);
  const [feed, setFeed] = useState(SEED_FEED);
  const [impactCount, setImpactCount] = useState(12480);
  const [tab, setTab] = useState("Coordination");
  const [dragGhost, setDragGhost] = useState({ show: false, x: 0, y: 0, vol: null });

  // Tweaks
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "accentHue": 60,
    "density": "Comfortable",
    "showStories": true,
    "darkHero": true
  }/*EDITMODE-END*/);

  // Apply accent hue
  useEffect(() => {
    document.documentElement.style.setProperty("--saffron", `oklch(0.72 0.16 ${tweaks.accentHue})`);
    document.documentElement.style.setProperty("--saffron-deep", `oklch(0.58 0.18 ${tweaks.accentHue - 10})`);
    document.documentElement.style.setProperty("--saffron-soft", `oklch(0.94 0.05 ${tweaks.accentHue + 15})`);
  }, [tweaks.accentHue]);

  // Live impact ticker
  useEffect(() => {
    const t = setInterval(() => setImpactCount(c => c + Math.floor(Math.random() * 3)), 2400);
    return () => clearInterval(t);
  }, []);

  // Sorted + filtered needs
  const sortedNeeds = useMemo(() => {
    const arr = [...needs].sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency]);
    if (filter === "All") return arr;
    if (filter === "Resolved") return arr.filter(n => n.pledged >= n.needed);
    if (filter === "Open") return arr.filter(n => n.pledged < n.needed);
    return arr.filter(n => n.urgency === filter || n.type === filter);
  }, [needs, filter]);

  // Helpers
  const assignedByNeed = useMemo(() => {
    const map = {};
    for (const a of assignments) {
      (map[a.needId] = map[a.needId] || []).push(volunteers.find(v => v.id === a.volId));
    }
    return map;
  }, [assignments, volunteers]);

  const assignedVolIds = useMemo(() => new Set(assignments.map(a => a.volId)), [assignments]);

  const skillCompatible = (vol, need) => {
    const list = SKILL_TO_NEED[vol.skill] || [];
    return list.includes(need.type);
  };

  // Drag handlers
  const onDragStart = (vol) => {
    setActiveDrag(vol);
    setDragGhost({ show: true, x: 0, y: 0, vol });
  };
  const onDragEnd = () => {
    setActiveDrag(null);
    setHoverNeedId(null);
    setDragGhost({ show: false, x: 0, y: 0, vol: null });
  };
  useEffect(() => {
    const move = (e) => {
      if (activeDrag) setDragGhost(g => ({ ...g, x: e.clientX, y: e.clientY }));
    };
    window.addEventListener("dragover", move);
    return () => window.removeEventListener("dragover", move);
  }, [activeDrag]);

  const onDropOn = (needId) => {
    if (!activeDrag) return;
    if (assignedVolIds.has(activeDrag.id)) return;
    const need = needs.find(n => n.id === needId);
    if (!need) return;
    setAssignments(a => [...a, { volId: activeDrag.id, needId }]);
    setNeeds(arr => arr.map(n => n.id === needId ? { ...n, pledged: Math.min(n.needed, n.pledged + 1) } : n));
    setFeed(f => [{ time: "now", color: "var(--sage)", text: `<b>${activeDrag.name}</b> pledged for ${need.area}` }, ...f.slice(0, 5)]);
    setImpactCount(c => c + need.beneficiaries);
    onDragEnd();
  };

  const onPledge = (needId) => {
    // Auto-find first available compatible volunteer
    const need = needs.find(n => n.id === needId);
    const candidate = volunteers.find(v => !assignedVolIds.has(v.id) && skillCompatible(v, need));
    if (candidate) {
      setAssignments(a => [...a, { volId: candidate.id, needId }]);
      setNeeds(arr => arr.map(n => n.id === needId ? { ...n, pledged: Math.min(n.needed, n.pledged + 1) } : n));
      setFeed(f => [{ time: "now", color: "var(--saffron)", text: `<b>${candidate.name}</b> auto-matched to ${need.area}` }, ...f.slice(0, 5)]);
      setImpactCount(c => c + Math.floor(need.beneficiaries / 5));
    }
  };

  const addNeed = (n) => {
    setNeeds(arr => [n, ...arr]);
    setShowAdd(false);
    setFeed(f => [{ time: "now", color: "var(--saffron)", text: `<b>New need</b> posted in ${n.area} — ${n.urgency}` }, ...f.slice(0, 5)]);
  };

  const VOL_COLORS = ["oklch(0.60 0.18 250)","oklch(0.55 0.20 140)","oklch(0.62 0.19 320)","oklch(0.58 0.18 30)","oklch(0.50 0.22 200)"];
  const addVolunteer = (v) => {
    const color = VOL_COLORS[volunteers.length % VOL_COLORS.length];
    const newVol = { ...v, id: "v" + Date.now(), color, rating: 4.5 };
    setVolunteers(arr => [...arr, newVol]);
    setShowSignup(false);
    setFeed(f => [{ time: "now", color: "var(--sage)", text: `<b>${v.name}</b> joined as ${v.skill} volunteer` }, ...f.slice(0, 5)]);
    setImpactCount(c => c + 10);
  };

  // Filter chips
  const counts = useMemo(() => {
    const c = { All: needs.length, Critical: 0, High: 0, Medium: 0, Low: 0, Open: 0, Resolved: 0 };
    needs.forEach(n => {
      c[n.urgency] = (c[n.urgency] || 0) + 1;
      if (n.pledged >= n.needed) c.Resolved++; else c.Open++;
    });
    return c;
  }, [needs]);

  // Stats
  const totalBeneficiaries = useMemo(() => needs.reduce((s, n) => s + n.beneficiaries, 0), [needs]);
  const openNeeds = needs.filter(n => n.pledged < n.needed).length;
  const matchRate = needs.length ? Math.round((needs.filter(n => n.pledged > 0).length / needs.length) * 100) : 0;

  return (
    <div className="app">
      {/* ─── Topbar ─── */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Icon name="bridge" size={26} />
          </div>
          <div className="brand-text">
            <span className="en">SevaSetu</span>
            <span className="hi">सेवा सेतु — a bridge of service</span>
          </div>
        </div>

        <nav className="nav">
          {["Coordination", "Map", "Volunteers", "Impact"].map(t => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </nav>

        <div className="top-meta">
          <span className="live-dot">Live · 6 cities</span>
          <div className="me">
            <Avatar name="You" color="linear-gradient(135deg, var(--indigo), var(--saffron))" size={28} />
            <span style={{ fontSize: 12, color: "var(--ink-2)" }}>NGO Coordinator</span>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="hero">
        <div className="hero-card">
          <div className="label">Mission · Mumbai · Today</div>
          <h1>
            <em>{openNeeds}</em> communities are waiting.<br />
            Let's bridge them to help — together.
          </h1>
          <p className="helper">
            SevaSetu connects verified neighbourhood requests with volunteers nearby. Drag a volunteer onto a need to pledge, or post a new request and we'll auto-route it.
          </p>
          <div className="hero-actions">
            <button className="btn saffron" onClick={() => setShowAdd(true)}>
              <Icon name="plus" size={14} /> Post a need
            </button>
            <button className="btn" onClick={() => setShowSignup(true)}>
              <Icon name="user" size={14} /> Sign up as volunteer
            </button>
            <button className="btn ghost" onClick={() => setShowDonate(true)}>
              <Icon name="heart" size={14} /> Donate
            </button>
          </div>
        </div>

        <div className={`hero-card ${tweaks.darkHero ? "dark" : ""}`}>
          <div className="label">Lives touched · cumulative</div>
          <div className="impact-headline">
            {impactCount.toLocaleString()}
            <span className="unit">since launch</span>
          </div>
          <div style={{ height: 14 }} />
          <div className="micro-meters">
            <div className="micro">
              <div className="v">2,180</div>
              <div className="k">meals served</div>
            </div>
            <div className="micro">
              <div className="v">412</div>
              <div className="k">medical visits</div>
            </div>
            <div className="micro">
              <div className="v">96</div>
              <div className="k">drives completed</div>
            </div>
          </div>
        </div>
      </section>

      {tab === "Coordination" && (<>
      {/* ─── KPIs ─── */}
      <div className="kpis">
        <div className="kpi">
          <span className="k">Open needs</span>
          <span className="v">{openNeeds}</span>
          <span className="d">across {new Set(needs.map(n => n.area)).size} areas <span className="delta">+2 today</span></span>
        </div>
        <div className="kpi">
          <span className="k">People affected</span>
          <span className="v">{totalBeneficiaries.toLocaleString()}</span>
          <span className="d">awaiting help <span className="delta">verified</span></span>
        </div>
        <div className="kpi">
          <span className="k">Volunteers ready</span>
          <span className="v">{volunteers.length - assignedVolIds.size}</span>
          <span className="d">of {volunteers.length} on roster <span className="delta">{Math.round((1 - assignedVolIds.size / volunteers.length) * 100)}% available</span></span>
        </div>
        <div className="kpi">
          <span className="k">Match rate</span>
          <span className="v">{matchRate}<span style={{ fontSize: 22, color: "var(--ink-3)" }}>%</span></span>
          <span className="d">needs with pledges <span className="delta">+{Math.max(0, matchRate - 40)} from baseline</span></span>
        </div>
      </div>

      {/* ─── Section: Needs board ─── */}
      <div className="section-head">
        <div>
          <h2>Open requests, sorted by urgency</h2>
          <div className="sub">Drag a volunteer from the right onto a card to pledge them.</div>
        </div>
        <div className="chips">
          <button className="chip" onClick={() => setShowAdd(s => !s)} style={{ background: "var(--saffron)", color: "white", borderColor: "var(--saffron-deep)" }}>
            <Icon name="plus" size={11} /> New
          </button>
        </div>
      </div>

      <div className="chips" style={{ marginBottom: 14 }}>
        {[
          { k: "All",      label: "All", swatch: null },
          { k: "Critical", label: "Critical", swatch: "var(--crit)" },
          { k: "High",     label: "High", swatch: "var(--high)" },
          { k: "Medium",   label: "Medium", swatch: "var(--med)" },
          { k: "Low",      label: "Low", swatch: "var(--low)" },
          { k: "Open",     label: "Still open", swatch: null },
          { k: "Resolved", label: "Fully staffed", swatch: "var(--sage)" },
        ].map(c => (
          <button
            key={c.k}
            className={`chip ${filter === c.k ? "active" : ""}`}
            onClick={() => setFilter(c.k)}
          >
            {c.swatch && <span className="swatch" style={{ background: c.swatch }} />}
            {c.label}
            <span className="count">{counts[c.k] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="board">
        {/* Needs list */}
        <div>
          {showAdd && <AddNeedForm onAdd={addNeed} onCancel={() => setShowAdd(false)} />}

          {sortedNeeds.length === 0 ? (
            <div className="panel" style={{ textAlign: "center", padding: 40, color: "var(--ink-3)" }}>
              <Icon name="check" size={28} />
              <div className="serif" style={{ fontSize: 22, marginTop: 8, color: "var(--ink)" }}>All caught up</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>No needs match this filter.</div>
            </div>
          ) : (
            sortedNeeds.map(n => (
              <NeedCard
                key={n.id}
                need={n}
                isDropTarget={hoverNeedId === n.id && activeDrag != null}
                onDragOver={(id) => setHoverNeedId(id)}
                onDragLeave={(id) => setHoverNeedId(h => h === id ? null : h)}
                onDrop={onDropOn}
                assignedVols={(assignedByNeed[n.id] || []).filter(Boolean)}
                onPledge={onPledge}
              />
            ))
          )}
        </div>

        {/* Side panel */}
        <aside className="side">
          <div className="panel">
            <h3>Volunteer roster</h3>
            <div className="sub">Drag any name onto a need card</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {volunteers.map(v => {
                const assigned = assignedVolIds.has(v.id);
                const compat = activeDrag && hoverNeedId
                  ? false
                  : false;
                return (
                  <VolunteerCard
                    key={v.id}
                    vol={v}
                    assigned={assigned}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    isDragging={activeDrag && activeDrag.id === v.id}
                  />
                );
              })}
            </div>
          </div>

          <ActivityFeed items={feed} />

          <div className="panel">
            <h3>Volunteer journey</h3>
            <div className="sub">Where each pledge stands</div>
            <div className="journey" style={{ marginTop: 4 }}>
              <div className="stage">
                <div className="step">01</div>
                <div className="name">Pledged</div>
                <div className="count">{assignments.length} active</div>
              </div>
              <div className="stage cur">
                <div className="step">02</div>
                <div className="name">En route</div>
                <div className="count">{Math.max(0, assignments.length - 1)} traveling</div>
              </div>
              <div className="stage">
                <div className="step">03</div>
                <div className="name">On site</div>
                <div className="count">1 active</div>
              </div>
              <div className="stage">
                <div className="step">04</div>
                <div className="name">Completed</div>
                <div className="count">96 to date</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── Map preview ─── */}
      <SevaMap needs={needs} onSelect={setSelectedNeedId} selectedId={selectedNeedId} />
      </>)}

      {tab === "Map" && (
        <MapView needs={needs} selectedId={selectedNeedId} onSelect={setSelectedNeedId} />
      )}

      {tab === "Volunteers" && (
        <VolunteersView volunteers={volunteers} assignments={assignments} assignedVolIds={assignedVolIds} />
      )}

      {tab === "Impact" && (
        <ImpactView needs={needs} volunteers={volunteers} impactCount={impactCount} />
      )}

      {/* Footer */}
      <div className="footnote">
        <span className="deva">सेवा परमो धर्मः</span>
        Built with care · SevaSetu connects {volunteers.length} volunteers to {needs.length} active community needs across Mumbai · v0.4 prototype
      </div>

      {/* Drop hint */}
      <div className={`drop-hint ${activeDrag ? "show" : ""}`}>
        {activeDrag ? `Drop ${activeDrag.name} on a need to pledge` : ""}
      </div>

      {/* Drag ghost */}
      {dragGhost.show && dragGhost.vol && dragGhost.x > 0 && (
        <div className="drag-ghost" style={{ left: dragGhost.x, top: dragGhost.y }}>
          <span className="av" style={{ width: 22, height: 22, fontSize: 9, background: dragGhost.vol.color, borderRadius: "50%", color: "white", display: "grid", placeItems: "center", fontWeight: 600 }}>
            {dragGhost.vol.name.split(" ").map(p => p[0]).join("").slice(0, 2)}
          </span>
          <span style={{ fontWeight: 500 }}>{dragGhost.vol.name}</span>
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{dragGhost.vol.skillShort || dragGhost.vol.skill}</span>
        </div>
      )}

      {/* ─── Sign-up modal ─── */}
      {showSignup && <SignupModal onAdd={addVolunteer} onCancel={() => setShowSignup(false)} />}

      {/* ─── Donate modal ─── */}
      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}

      {/* Tweaks */}
      <TweaksPanel title="Tweaks">
        <TweakSection title="Theme">
          <TweakSlider label="Accent hue" value={tweaks.accentHue} min={20} max={120} step={5} onChange={(v) => setTweak("accentHue", v)} />
          <TweakToggle label="Dark hero card" value={tweaks.darkHero} onChange={(v) => setTweak("darkHero", v)} />
        </TweakSection>
        <TweakSection title="Content">
          <TweakToggle label="Show stories on cards" value={tweaks.showStories} onChange={(v) => setTweak("showStories", v)} />
          <TweakRadio
            label="Density"
            value={tweaks.density}
            options={["Compact", "Comfortable", "Spacious"]}
            onChange={(v) => setTweak("density", v)}
          />
        </TweakSection>
        <TweakSection title="Demo actions">
          <TweakButton label="Reset all pledges" onClick={() => { setAssignments([]); setNeeds(SEED_NEEDS); }} />
          <TweakButton label="+1 random pledge" onClick={() => {
            const open = needs.filter(n => n.pledged < n.needed);
            if (!open.length) return;
            const n = open[Math.floor(Math.random() * open.length)];
            onPledge(n.id);
          }} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
