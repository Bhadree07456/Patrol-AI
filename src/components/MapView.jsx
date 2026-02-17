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
          risk >= 8 ? "bg-red-400" : "bg-blue-400"
        } opacity-20"></span>
        <div class="relative h-3 w-3 rounded-full border-2 border-white shadow-lg ${
          risk >= 8 ? "bg-red-500" : "bg-blue-500"
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

  return (
    <MapContainer
      key={`${base.lat}-${base.lng}`}   // 🔥 forces recenter when HQ changes
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
            <div className="p-1 min-w-[160px]">
              <h3 className="text-sm font-bold">{zone.name}</h3>

              <div className="mt-2 flex justify-between">
                <span className="text-[10px] uppercase text-slate-400 font-bold">
                  Risk Index
                </span>
                <span className={`font-black ${
                  zone.risk >= 8 ? "text-red-500" : "text-blue-500"
                }`}>
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
