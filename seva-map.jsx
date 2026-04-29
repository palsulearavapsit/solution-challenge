// Real Leaflet map — uses lat/lon from each need, CARTO light tiles (no API key)
const SevaMap = ({ needs, onSelect, selectedId, compact = false }) => {
  const containerRef = React.useRef(null);
  const mapRef       = React.useRef(null);
  const markersRef   = React.useRef({});
  const [lastUpdate, setLastUpdate] = React.useState(new Date());

  // ── Build / rebuild markers whenever needs or selection changes ────────────
  const syncMarkers = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove stale markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    needs.forEach(need => {
      const cls   = URGENCY_CLASS[need.urgency];
      const color = URGENCY_COLOR[need.urgency];
      const pulse = need.urgency === "Critical" || need.urgency === "High";
      const sel   = selectedId === need.id;
      const size  = sel ? 20 : 14;

      const iconHtml = `
        <div class="seva-marker ${cls}${sel ? " sel" : ""}" style="width:${size}px;height:${size}px">
          ${pulse ? `<span class="spulse" style="border-color:${color};color:${color}"></span>` : ""}
          <span class="sdot" style="background:${color};width:${size}px;height:${size}px"></span>
        </div>`;

      const icon = L.divIcon({
        html:       iconHtml,
        className:  "",
        iconSize:   [18, 18],
        iconAnchor: [9, 9],
        tooltipAnchor: [10, -4],
      });

      const pct  = Math.round((need.pledged / need.needed) * 100);
      const tip  = `<b style="font-size:13px">${need.area}</b>
                    <div style="margin:2px 0 4px;font-size:11px;color:var(--ink-3)">${need.type}</div>
                    ${need.title}
                    <div style="margin-top:5px;font-size:11px;color:${URGENCY_COLOR[need.urgency]};font-weight:600">
                      ${need.urgency} · ${pct}% staffed
                    </div>`;

      const marker = L.marker([need.lat, need.lon], { icon })
        .bindTooltip(tip, { direction: "top", offset: [0, -4], opacity: 1 })
        .on("click", () => onSelect(need.id))
        .addTo(map);

      markersRef.current[need.id] = marker;
    });
  }, [needs, selectedId, onSelect]);

  // ── Init map once ──────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center:            [19.07, 72.88],
      zoom:              12,
      zoomControl:       false,
      scrollWheelZoom:   false,
      attributionControl: true,
    });

    // CARTO Positron — clean, warm, free, no key
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>' }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    // Tick "updated X ago"
    const tick = setInterval(() => setLastUpdate(new Date()), 30_000);

    return () => {
      clearInterval(tick);
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // ── Sync markers whenever map or needs/selection changes ──────────────────
  React.useEffect(() => { syncMarkers(); }, [syncMarkers]);

  // Fly to selected need
  React.useEffect(() => {
    const map  = mapRef.current;
    const need = needs.find(n => n.id === selectedId);
    if (map && need) map.flyTo([need.lat, need.lon], 14, { duration: 0.8 });
  }, [selectedId]);

  // Format "X ago"
  const agoLabel = React.useMemo(() => {
    const secs = Math.floor((new Date() - lastUpdate) / 1000);
    return secs < 60 ? `${secs}s ago` : `${Math.floor(secs / 60)}m ago`;
  }, [lastUpdate]);

  const height = compact ? 340 : 420;

  return (
    <div className="map-wrap">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 22, letterSpacing: "-0.01em" }}>
            Live needs across Mumbai
          </h3>
          <div style={{ color: "var(--ink-3)", fontSize: 12, marginTop: 2 }}>
            Tap a marker to focus the need · pulses indicate active urgency
          </div>
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {needs.length} active
        </div>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        style={{ height, borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", zIndex: 0 }}
      />

      {/* Legend */}
      <div className="map-legend">
        <span className="lg"><span className="swatch" style={{ background: "var(--crit)" }} /> Critical</span>
        <span className="lg"><span className="swatch" style={{ background: "var(--high)" }} /> High</span>
        <span className="lg"><span className="swatch" style={{ background: "var(--med)" }} /> Medium</span>
        <span className="lg"><span className="swatch" style={{ background: "var(--low)" }} /> Low</span>
        <span style={{ marginLeft: "auto" }}>Updated {agoLabel}</span>
      </div>
    </div>
  );
};

Object.assign(window, { SevaMap });
