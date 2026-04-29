// Need card with story, beneficiary count, drag-target behavior
const NeedCard = ({ need, isDropTarget, onDrop, onDragOver, onDragLeave, assignedVols, onPledge, onResolve }) => {
  const urgClass = URGENCY_CLASS[need.urgency];
  const pct = Math.round((need.pledged / need.needed) * 100);
  const resolved = need.pledged >= need.needed;

  return (
    <div
      className={`need-card ${isDropTarget ? "drop-target" : ""} ${resolved ? "resolved" : ""}`}
      onDragOver={(e) => { e.preventDefault(); onDragOver(need.id); }}
      onDragLeave={() => onDragLeave(need.id)}
      onDrop={(e) => { e.preventDefault(); onDrop(need.id); }}
      data-need-id={need.id}
    >
      <div className="urg-bar" style={{ background: URGENCY_COLOR[need.urgency] }} />
      <div className="need-row1">
        <div style={{ flex: 1 }}>
          <div className="need-area">
            <Icon name="pin" size={12} />
            {need.area} · {need.city}
            <span style={{ marginLeft: 8, opacity: 0.6 }}>· {need.requestedBy}</span>
          </div>
          <h3 className="need-title">{need.title}</h3>
          <p className="need-story">{need.story}</p>
        </div>
        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <div className="serif" style={{ fontSize: 28, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {need.beneficiaries.toLocaleString()}
          </div>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
            {need.beneficiaries === 1 ? "person" : "people"}
          </div>
        </div>
      </div>

      <div className="need-meta">
        <span className={`pill ${urgClass}`}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
          {need.urgency}
        </span>
        <span className="pill">
          <Icon name={need.icon} size={11} /> {need.type}
        </span>
        <span className="pill">
          <Icon name="clock" size={11} /> {need.requestedAt} ago
        </span>
        {assignedVols.length > 0 && (
          <span className="pill" style={{ paddingLeft: 6 }}>
            <span className="assigned-list" style={{ display: "inline-flex" }}>
              {assignedVols.slice(0, 4).map(v => (
                <span key={v.id} className="av" style={{ width: 18, height: 18, fontSize: 8, background: v.color }}>
                  {v.name.split(" ").map(p => p[0]).join("").slice(0, 2)}
                </span>
              ))}
            </span>
            <span style={{ marginLeft: 6 }}>{assignedVols.length} pledged</span>
          </span>
        )}
      </div>

      <div className="progress" aria-label={`${pct}% staffed`}>
        <div style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {need.pledged} of {need.needed} volunteers · {pct}%
        </div>
        <div className="need-actions">
          {!resolved ? (
            <>
              <button className="btn tiny" onClick={() => onPledge(need.id)}>
                <Icon name="heart" size={11} /> I'll help
              </button>
              <button className="btn tiny ghost">
                <Icon name="send" size={11} /> Share
              </button>
            </>
          ) : (
            <span className="mono" style={{ fontSize: 11, color: "oklch(0.40 0.08 150)", textTransform: "uppercase", letterSpacing: "0.06em", display: "inline-flex", gap: 4, alignItems: "center" }}>
              <Icon name="check" size={12} /> Fully staffed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Add-need form with live NLP preview
const AddNeedForm = ({ onAdd, onCancel }) => {
  const [text, setText] = React.useState("");
  const [area, setArea] = React.useState("");
  const [people, setPeople] = React.useState(50);
  const cls = classifyText(text);

  const submit = () => {
    if (!text.trim() || !area.trim()) return;
    const newNeed = {
      id: "n" + Date.now(),
      area: area.trim(),
      city: "Mumbai",
      type: cls.need || "Food Distribution",
      urgency: cls.urg,
      title: text.split(/[.!?]/)[0].slice(0, 80) || text.slice(0, 60),
      story: text,
      requestedBy: "You",
      beneficiaries: parseInt(people) || 50,
      pledged: 0,
      needed: 3,
      requestedAt: "now",
      lat: 19.07, lon: 72.87,
      mx: 0.4 + Math.random() * 0.3,
      my: 0.3 + Math.random() * 0.4,
      icon: cls.need === "Medical Camp" ? "medical" :
            cls.need === "Education Support" ? "edu" :
            cls.need === "Sanitation Drive" ? "sanitation" :
            cls.need === "Shelter Assistance" ? "shelter" : "food",
    };
    onAdd(newNeed);
    setText(""); setArea(""); setPeople(50);
  };

  return (
    <div className="add-form">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 22, letterSpacing: "-0.01em" }}>
          Post a need
        </h3>
        <button className="btn tiny ghost" onClick={onCancel}><Icon name="x" size={12} /> Close</button>
      </div>
      <p style={{ margin: "0 0 12px", color: "var(--ink-3)", fontSize: 12.5 }}>
        Describe the situation in plain words — we'll auto-categorise it for nearby volunteers.
      </p>
      <textarea
        placeholder="e.g. 'Urgent — 30 children with high fever in Govandi, doctor needed this weekend'"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10, marginTop: 10 }}>
        <input
          type="text"
          placeholder="Area / locality"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--canvas)", fontSize: 13.5 }}
        />
        <input
          type="number"
          placeholder="People affected"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          min="1"
          style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--canvas)", fontSize: 13.5, fontFamily: "'Geist Mono', monospace" }}
        />
      </div>
      {text.length > 6 && (
        <div className="ai-preview">
          <Icon name="spark" size={14} className="pulse-icon" />
          <div style={{ flex: 1 }}>
            Auto-categorised as{" "}
            <span className="tag">{cls.need || "Food Distribution"}</span>{" "}
            urgency{" "}
            <span className="tag" style={{ color: URGENCY_COLOR[cls.urg] }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
              {cls.urg}
            </span>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="btn saffron" onClick={submit} disabled={!text.trim() || !area.trim()}>
          <Icon name="send" size={12} /> Post need
        </button>
        <button className="btn ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};

Object.assign(window, { NeedCard, AddNeedForm });
