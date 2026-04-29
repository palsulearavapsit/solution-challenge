// ── Volunteer sign-up modal ──────────────────────────────────────────────────
const SKILL_OPTIONS = [
  "Medical", "Food Distribution", "Education", "Logistics",
  "Water & Sanitation", "Construction", "Mental Health", "Legal Aid",
];

const SignupModal = ({ onAdd, onCancel }) => {
  const [name,     setName]     = React.useState("");
  const [skill,    setSkill]    = React.useState(SKILL_OPTIONS[0]);
  const [location, setLocation] = React.useState("");
  const [phone,    setPhone]    = React.useState("");
  const [done,     setDone]     = React.useState(false);

  const submit = () => {
    if (!name.trim() || !location.trim()) return;
    onAdd({
      name:       name.trim(),
      skill,
      skillShort: skill.split(" ")[0],
      location:   location.trim(),
      phone:      phone.trim(),
    });
    setDone(true);
  };

  return (
    <div style={OVERLAY_STYLE} onClick={onCancel}>
      <div style={MODAL_STYLE} onClick={e => e.stopPropagation()}>
        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 40 }}>🙏</div>
            <h3 style={MODAL_TITLE}>You're on the roster!</h3>
            <p style={{ color: "var(--ink-3)", fontSize: 13.5, margin: "6px 0 20px" }}>
              Welcome, <strong>{name}</strong>. We'll match you with nearby needs based on your skill.
            </p>
            <button className="btn saffron" onClick={onCancel} style={{ width: "100%" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={MODAL_HEAD}>
              <h3 style={MODAL_TITLE}>Join as a volunteer</h3>
              <button className="btn tiny ghost" onClick={onCancel}><Icon name="x" size={12} /> Close</button>
            </div>
            <p style={{ color: "var(--ink-3)", fontSize: 12.5, margin: "0 0 14px" }}>
              Tell us a little about yourself — we'll route the right requests to you.
            </p>

            <label style={LABEL}>Full name *</label>
            <input style={INPUT} placeholder="e.g. Priya Sharma" value={name} onChange={e => setName(e.target.value)} />

            <label style={LABEL}>Primary skill *</label>
            <select style={INPUT} value={skill} onChange={e => setSkill(e.target.value)}>
              {SKILL_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={LABEL}>Area / locality *</label>
                <input style={INPUT} placeholder="e.g. Andheri" value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div>
                <label style={LABEL}>Phone (optional)</label>
                <input style={INPUT} placeholder="+91 98…" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn saffron" onClick={submit} disabled={!name.trim() || !location.trim()} style={{ flex: 1 }}>
                <Icon name="user" size={12} /> Join the roster
              </button>
              <button className="btn ghost" onClick={onCancel}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Donate modal ─────────────────────────────────────────────────────────────
const TIERS = [
  { amount: 100,  label: "₹100",  desc: "Funds one meal kit for a family" },
  { amount: 500,  label: "₹500",  desc: "Covers a medical camp visit" },
  { amount: 1000, label: "₹1,000", desc: "Supplies a sanitation drive" },
  { amount: 5000, label: "₹5,000", desc: "Runs an education session for 20 children" },
];

const DonateModal = ({ onClose }) => {
  const [selected, setSelected]   = React.useState(500);
  const [custom,   setCustom]     = React.useState("");
  const [thanked,  setThanked]    = React.useState(false);

  const amount = custom ? parseInt(custom) || 0 : selected;

  const confirm = () => {
    if (amount < 1) return;
    setThanked(true);
  };

  return (
    <div style={OVERLAY_STYLE} onClick={onClose}>
      <div style={MODAL_STYLE} onClick={e => e.stopPropagation()}>
        {thanked ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 40 }}>❤️</div>
            <h3 style={MODAL_TITLE}>Thank you!</h3>
            <p style={{ color: "var(--ink-3)", fontSize: 13.5, margin: "6px 0 20px" }}>
              Your donation of <strong>₹{amount.toLocaleString()}</strong> will go directly to active community needs.
            </p>
            <button className="btn saffron" onClick={onClose} style={{ width: "100%" }}>Close</button>
          </div>
        ) : (
          <>
            <div style={MODAL_HEAD}>
              <h3 style={MODAL_TITLE}>Support the mission</h3>
              <button className="btn tiny ghost" onClick={onClose}><Icon name="x" size={12} /> Close</button>
            </div>
            <p style={{ color: "var(--ink-3)", fontSize: 12.5, margin: "0 0 16px" }}>
              100% of funds go to verified community needs across Mumbai.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              {TIERS.map(t => (
                <button
                  key={t.amount}
                  onClick={() => { setSelected(t.amount); setCustom(""); }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${selected === t.amount && !custom ? "var(--saffron)" : "var(--line)"}`,
                    background: selected === t.amount && !custom ? "var(--saffron-soft)" : "var(--canvas)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "border-color .15s, background .15s",
                  }}
                >
                  <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{t.label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 3 }}>{t.desc}</div>
                </button>
              ))}
            </div>

            <label style={LABEL}>Or enter a custom amount (₹)</label>
            <input
              style={INPUT}
              type="number"
              placeholder="e.g. 2500"
              value={custom}
              onChange={e => { setCustom(e.target.value); setSelected(null); }}
              min="1"
            />

            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button
                className="btn saffron"
                onClick={confirm}
                disabled={amount < 1}
                style={{ flex: 1 }}
              >
                <Icon name="heart" size={12} /> Donate ₹{amount > 0 ? amount.toLocaleString() : "—"}
              </button>
              <button className="btn ghost" onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const OVERLAY_STYLE = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(4px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 9000,
  padding: 20,
};

const MODAL_STYLE = {
  background: "var(--canvas)",
  borderRadius: 18,
  padding: "24px 26px",
  width: "100%",
  maxWidth: 460,
  boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
  border: "1px solid var(--line)",
};

const MODAL_HEAD = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 8,
};

const MODAL_TITLE = {
  margin: 0,
  fontFamily: "'Instrument Serif', serif",
  fontWeight: 400,
  fontSize: 22,
  letterSpacing: "-0.01em",
  color: "var(--ink)",
};

const LABEL = {
  display: "block",
  fontSize: 11.5,
  fontWeight: 600,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "var(--ink-3)",
  marginBottom: 4,
  marginTop: 10,
};

const INPUT = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid var(--line)",
  background: "var(--canvas)",
  fontSize: 13.5,
  color: "var(--ink)",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

Object.assign(window, { SignupModal, DonateModal });
