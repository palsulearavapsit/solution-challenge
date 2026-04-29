// Volunteer card — draggable, with skill match indication
const VolunteerCard = ({ vol, assigned, onDragStart, onDragEnd, isDragging, isCompatibleHover }) => {
  return (
    <div
      className={`vol-card ${assigned ? "assigned" : ""} ${isDragging ? "dragging" : ""}`}
      draggable={!assigned}
      onDragStart={(e) => {
        if (assigned) { e.preventDefault(); return; }
        e.dataTransfer.setData("text/plain", vol.id);
        e.dataTransfer.effectAllowed = "move";
        // Make a transparent drag image so we can render our own ghost
        const img = new Image();
        img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
        e.dataTransfer.setDragImage(img, 0, 0);
        onDragStart(vol);
      }}
      onDragEnd={onDragEnd}
      style={isCompatibleHover ? { background: "var(--saffron-soft)", borderColor: "oklch(0.85 0.10 60)" } : {}}
    >
      <Avatar name={vol.name} color={vol.color} size={36} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="name">{vol.name}</div>
        <div className="skill">{vol.skillShort || vol.skill} · {vol.location}</div>
      </div>
      <div className={`status ${assigned ? "busy" : "avail"}`}>
        {assigned ? "Assigned" : "Available"}
      </div>
    </div>
  );
};

// Activity feed
const ActivityFeed = ({ items }) => (
  <div className="panel">
    <h3>Live activity</h3>
    <div className="sub">What's happening across the city right now</div>
    <div>
      {items.map((f, i) => (
        <div key={i} className="feed-item">
          <span className="time">{f.time}</span>
          <span className="dot" style={{ background: f.color }} />
          <span className="text" dangerouslySetInnerHTML={{ __html: f.text }} />
        </div>
      ))}
    </div>
  </div>
);

Object.assign(window, { VolunteerCard, ActivityFeed });
