import { useState, useEffect } from "react";
import defaultZones from "../data/riskZones.json";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { ShieldAlert, Search, PlusCircle, Home } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { setBaseLocation, getBaseLocation } from "../utils/baseLocation";

/* ---------------- CLICK HANDLER ---------------- */
function MapClickHandler({ mode, setNewPoint, setBase }) {
  useMapEvents({
    click(e) {
      if (mode === "zone") {
        setNewPoint(e.latlng);
      }

      if (mode === "base") {
        const newBase = {
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          name: "Police HQ",
        };

        setBaseLocation(newBase);
        setBase(newBase);
      }
    },
  });

  return null;
}

/* ---------------- MARKERS ---------------- */
const createMarker = (color) =>
  new L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};
      width:12px;height:12px;border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 10px ${color};
    "></div>`,
    iconSize: [12, 12],
  });

const baseIcon = createMarker("#3b82f6");

/* ---------------- COMPONENT ---------------- */
export default function RiskZones() {
  /* ---------------- LOAD LOCAL ZONES ---------------- */
  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem("riskZones");
    return saved ? JSON.parse(saved) : defaultZones;
  });

  useEffect(() => {
    localStorage.setItem("riskZones", JSON.stringify(zones));
  }, [zones]);

  /* ---------------- BASE LOCATION ---------------- */
  const [base, setBase] = useState(getBaseLocation());

  /* ---------------- MODE CONTROL ---------------- */
  const [mode, setMode] = useState(null); // "zone" | "base" | null

  /* ---------------- NEW ZONE STATE ---------------- */
  const [newPoint, setNewPoint] = useState(null);
  const [zoneName, setZoneName] = useState("");
  const [zoneRisk, setZoneRisk] = useState(8);

  const handleAddZone = () => {
    if (!zoneName) return;

    const newZone = {
      id: Date.now(),
      name: zoneName,
      lat: newPoint.lat,
      lng: newPoint.lng,
      risk: zoneRisk,
    };

    setZones((prev) => [...prev, newZone]);

    setNewPoint(null);
    setZoneName("");
    setMode(null);
  };

  const resetZones = () => {
    localStorage.removeItem("riskZones");
    setZones(defaultZones);
  };

  /* ---------------- SEARCH ---------------- */
  const [searchQuery, setSearchQuery] = useState("");

  const filteredZones = zones.filter((zone) =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-slate-200">

      {/* HEADER */}
      <div className="p-4 bg-slate-900 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-blue-500" size={24} />
          <h1 className="text-xl font-bold text-white">Zone Intelligence</h1>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMode("zone")}
            className={`px-3 py-1 text-xs rounded font-bold flex items-center gap-1 ${
              mode === "zone" ? "bg-blue-600" : "bg-slate-700"
            }`}
          >
            <PlusCircle size={14} />
            Add Zone
          </button>

          <button
            onClick={() => setMode("base")}
            className={`px-3 py-1 text-xs rounded font-bold flex items-center gap-1 ${
              mode === "base" ? "bg-indigo-600" : "bg-slate-700"
            }`}
          >
            <Home size={14} />
            Set HQ
          </button>

          <button
            onClick={resetZones}
            className="text-xs bg-red-600 px-3 py-1 rounded font-bold"
          >
            Reset
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="p-3 bg-slate-900 border-b border-white/10">
        <div className="relative w-64">
          <Search className="absolute left-3 top-2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search Zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm w-full"
          />
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">

        {/* LIST PANEL */}
        <div className="w-1/3 border-r border-white/10 overflow-y-auto">
          {filteredZones.map((zone) => (
            <div key={zone.id} className="p-4 border-b border-white/5">
              <div className="flex justify-between">
                <span className="font-bold text-white">{zone.name}</span>
                <span className="text-xs text-slate-400">Risk {zone.risk}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
              </div>
            </div>
          ))}
        </div>

        {/* MAP */}
        <div className="flex-1 relative">
          <MapContainer
            center={[base.lat, base.lng]}
            zoom={13}
            className="h-full w-full"
          >
            <MapClickHandler
              mode={mode}
              setNewPoint={setNewPoint}
              setBase={setBase}
            />

            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

            {/* HQ MARKER */}
            <Marker position={[base.lat, base.lng]} icon={baseIcon}>
              <Popup>
                <b>Police Headquarters</b>
              </Popup>
            </Marker>

            {/* EXISTING ZONES */}
            {zones.map((zone) => (
              <Marker
                key={zone.id}
                position={[zone.lat, zone.lng]}
                icon={createMarker(
                  zone.risk >= 8 ? "#ef4444" :
                  zone.risk >= 5 ? "#f59e0b" :
                  "#10b981"
                )}
              >
                <Popup>
                  <b>{zone.name}</b><br />
                  Risk Level: {zone.risk}
                </Popup>
              </Marker>
            ))}

            {/* NEW ZONE FORM */}
            {newPoint && (
              <Popup position={newPoint} onClose={() => setNewPoint(null)}>
                <div className="space-y-2 w-44">
                  <input
                    placeholder="Zone Name"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    className="w-full border p-1 text-sm"
                  />

                  <select
                    value={zoneRisk}
                    onChange={(e) => setZoneRisk(Number(e.target.value))}
                    className="w-full border p-1 text-sm"
                  >
                    <option value={9}>Critical</option>
                    <option value={6}>Elevated</option>
                    <option value={3}>Secure</option>
                  </select>

                  <button
                    onClick={handleAddZone}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-sm w-full"
                  >
                    Save Zone
                  </button>
                </div>
              </Popup>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
