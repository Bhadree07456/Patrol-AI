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
          risk >= 8 ? "bg-red-600" : risk >= 5 ? "bg-orange-500" : "bg-emerald-500"
        } opacity-50"></span>
        <div class="relative h-3 w-3 rounded-full border-2 border-white shadow-lg ${
          risk >= 8 ? "bg-red-700" : risk >= 5 ? "bg-orange-600" : "bg-emerald-600"
        }" style="box-shadow: 0 0 12px ${
          risk >= 8 ? "rgba(185, 28, 28, 0.9)" : risk >= 5 ? "rgba(234, 88, 12, 0.9)" : "rgba(5, 150, 105, 0.9)"
        };"></div>
      </div>`,
    iconSize: [32, 32]
  });

/* ---------------- HQ MARKER ---------------- */

const baseIcon = new L.divIcon({
  className: "custom-base-icon",
  html: `
    <div style="
      position: relative;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background:#3b82f6;
        width:20px;
        height:20px;
        border-radius:50%;
        border:2px solid white;
        box-shadow:0 0 12px #3b82f6;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          color: white;
          font-weight: bold;
          font-size: 12px;
          font-family: Arial, sans-serif;
        ">H</span>
      </div>
    </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
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
    const saved = localStorage.getItem("riskZones_v3");
    return saved ? JSON.parse(saved) : defaultZones;
  });

  /* ---------------- SYNC ZONES ---------------- */
  useEffect(() => {
    const syncZones = () => {
      const saved = localStorage.getItem("riskZones_v3");
      if (saved) setZones(JSON.parse(saved));
    };
    
    // Listen for storage events (cross-tab) and custom events (same-page)
    window.addEventListener("storage", syncZones);
    window.addEventListener("zonesUpdated", syncZones);
    
    // Initial sync
    syncZones();
    
    return () => {
      window.removeEventListener("storage", syncZones);
      window.removeEventListener("zonesUpdated", syncZones);
    };
  }, []);

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
            </div>
          </Popup>
        </Marker>
      ))}

    </MapContainer>
  );
}
