import { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import defaultZones from "../data/riskZones.json";
import { getBaseLocation, subscribeBase } from "../utils/baseLocation";

/* ---------------- MAP STYLE DEFINITIONS ---------------- */

const tileStyles = {
  clean: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO"
  },
  detail: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap"
  },
  tactical: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; CARTO"
  },
  imagery: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; ESRI"
  }
};

/* ---------------- TILE SWITCHER ---------------- */

function ChangeMapStyle({ mapStyle }) {
  const map = useMap();
  const [layer, setLayer] = useState(null);

  useEffect(() => {
    if (!map) return;

    const safeStyle = tileStyles[mapStyle] ? mapStyle : "tactical";
    const selected = tileStyles[safeStyle];

    if (layer) map.removeLayer(layer);

    const newLayer = L.tileLayer(selected.url, {
      attribution: selected.attribution,
      maxZoom: 20,
    });

    newLayer.addTo(map);
    setLayer(newLayer);

  }, [mapStyle]);

  return null;
}

/* ---------------- TACTICAL MARKER ---------------- */

const tacticalIcon = (risk) =>
  new L.divIcon({
    className: "custom-tactical-icon",
    html: `
      <div class="relative flex items-center justify-center">
        <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full ${
          risk >= 8 ? "bg-red-400" : risk >= 5 ? "bg-amber-400" : "bg-emerald-400"
        } opacity-20"></span>
        <div class="relative h-3 w-3 rounded-full border-2 border-white shadow-lg ${
          risk >= 8 ? "bg-red-500" : risk >= 5 ? "bg-amber-500" : "bg-emerald-500"
        }"></div>
      </div>`,
    iconSize: [32, 32]
  });

/* ---------------- HQ MARKER ---------------- */

const baseIcon = new L.divIcon({
  className: "custom-base-icon",
  html: `
    <div style="
      background:#3b82f6;
      width:14px;height:14px;
      border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 12px #3b82f6;
    "></div>`,
  iconSize: [14, 14],
});

/* ---------------- MAIN MAP ---------------- */

export default function MapView({ mapStyle = "tactical" }) {

  /* ---------------- LOAD HQ ---------------- */
  const [base, setBase] = useState(getBaseLocation());

  useEffect(() => {
    const unsubscribe = subscribeBase(() => {
      setBase(getBaseLocation());
    });
    return unsubscribe;
  }, []);

  /* ---------------- LOAD ZONES ---------------- */
  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem("riskZones");
    return saved ? JSON.parse(saved) : defaultZones;
  });

  /* ---------------- SYNC ZONES ---------------- */
  useEffect(() => {
    const syncZones = () => {
      const saved = localStorage.getItem("riskZones");
      if (saved) setZones(JSON.parse(saved));
    };
    window.addEventListener("storage", syncZones);
    syncZones();
    return () => window.removeEventListener("storage", syncZones);
  }, []);

  /* ---------------- REMOVE ZONE ---------------- */
  const removeZone = (id) => {
    const updated = zones.filter((z) => z.id !== id);
    setZones(updated);
    localStorage.setItem("riskZones", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <MapContainer
      key={`${base.lat}-${base.lng}`}
      center={[base.lat, base.lng]}
      zoom={13}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <ZoomControl position="bottomright" />

      <ChangeMapStyle mapStyle={mapStyle} />

      {/* HQ MARKER */}
      <Marker position={[base.lat, base.lng]} icon={baseIcon}>
        <Popup>
          <strong>Police HQ</strong><br />
          {base.lat.toFixed(4)}, {base.lng.toFixed(4)}
        </Popup>
      </Marker>

      {/* RISK ZONES */}
      {zones.map((zone) => (
        <Marker
          key={zone.id}
          position={[zone.lat, zone.lng]}
          icon={tacticalIcon(zone.risk)}
        >
          <Popup>
            <div style={{ minWidth: "160px", padding: "4px" }}>
              <h3 style={{ fontWeight: "bold", marginBottom: "6px" }}>{zone.name}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "bold" }}>
                  Risk Index
                </span>
                <span style={{ fontWeight: "900", color: zone.risk >= 8 ? "#ef4444" : zone.risk >= 5 ? "#f59e0b" : "#10b981" }}>
                  {zone.risk}/10
                </span>
              </div>
              <button
                onClick={() => removeZone(zone.id)}
                style={{
                  width: "100%",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 8px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                🗑 Remove Zone
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

    </MapContainer>
  );
}
