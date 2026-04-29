// Lightweight inline SVG icons (intentional simple geometric — no slop)
const Icon = ({ name, size = 16, ...rest }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", ...rest };
  switch (name) {
    case "bridge":
      return (<svg {...props}><path d="M2 16c4-7 16-7 20 0" /><path d="M5 16v3M19 16v3M9 16v3M15 16v3M12 16v3" /></svg>);
    case "food":
      return (<svg {...props}><path d="M4 11h16l-1 9H5l-1-9z" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>);
    case "medical":
      return (<svg {...props}><path d="M12 4v16M4 12h16" strokeWidth="2.4" /></svg>);
    case "edu":
      return (<svg {...props}><path d="M2 9l10-5 10 5-10 5L2 9z" /><path d="M6 11v5c0 1 3 2 6 2s6-1 6-2v-5" /></svg>);
    case "sanitation":
      return (<svg {...props}><path d="M12 3c-3 5-5 8-5 11a5 5 0 0 0 10 0c0-3-2-6-5-11z" /></svg>);
    case "shelter":
      return (<svg {...props}><path d="M3 11l9-7 9 7v9H3v-9z" /><path d="M9 20v-6h6v6" /></svg>);
    case "plus":
      return (<svg {...props}><path d="M12 5v14M5 12h14" /></svg>);
    case "filter":
      return (<svg {...props}><path d="M3 5h18M6 12h12M10 19h4" /></svg>);
    case "chevron":
      return (<svg {...props}><path d="M9 6l6 6-6 6" /></svg>);
    case "check":
      return (<svg {...props}><path d="M5 12l5 5L20 7" /></svg>);
    case "spark":
      return (<svg {...props}><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" /></svg>);
    case "user":
      return (<svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>);
    case "pin":
      return (<svg {...props}><path d="M12 22s7-7 7-13a7 7 0 0 0-14 0c0 6 7 13 7 13z" /><circle cx="12" cy="9" r="2.5" /></svg>);
    case "clock":
      return (<svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
    case "people":
      return (<svg {...props}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M15 20c0-2 2-4 5-4" /></svg>);
    case "heart":
      return (<svg {...props}><path d="M12 21s-7-5-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6-7 11-7 11z" /></svg>);
    case "x":
      return (<svg {...props}><path d="M6 6l12 12M18 6L6 18" /></svg>);
    case "send":
      return (<svg {...props}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>);
    default:
      return (<svg {...props}><circle cx="12" cy="12" r="9" /></svg>);
  }
};

// Initial avatar
const Avatar = ({ name, color, size = 36 }) => {
  const initials = (name || "")
    .split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="av" style={{ width: size, height: size, fontSize: size * 0.36, background: color || "var(--ink)" }}>
      {initials}
    </div>
  );
};

Object.assign(window, { Icon, Avatar });
