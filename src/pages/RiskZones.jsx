import { useState, useEffect } from "react";
import defaultZones from "../data/riskZones.json";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { ShieldAlert, Search, PlusCircle, Home, Check, Trash2, MinusCircle, Star, Sun, Moon, Cloud, Map as MapIcon } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  getBaseLocation,
  getAllBases,
  getActiveBaseIndex,
  addBase,
  removeBase,
  setActiveBase,
  subscribeBase,
} from "../utils/baseLocation";
import { reverseGeocode } from "../utils/geocoder";
import { fetchZones, addZone, removeZone as dbRemoveZone, updateZoneRisk, resetZones as dbResetZones } from "../lib/db";

/* ---------------- MAP THEMES ---------------- */
const MAP_THEMES = {
  light: {
    name: "Clean",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    icon: <Sun size={14} />
  },
  dark: {
    name: "Tactical",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    icon: <Moon size={14} />
  },
  satellite: {
    name: "Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    icon: <Cloud size={14} />
  },
  standard: {
    name: "Detailed",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    icon: <MapIcon size={14} />
  }
};

/* ---------------- CLICK HANDLER ---------------- */
function MapClickHandler({ mode, setNewPoint, setNewHQPoint }) {
  useMapEvents({
    click(e) {
      if (mode === "zone") {
        setNewPoint(e.latlng);
      }
      if (mode === "addHQ") {
        setNewHQPoint(e.latlng);
      }
    },
  });
  return null;
}

/* ---------------- FLY TO ANIMATION ---------------- */
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
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
      box-shadow:0 0 15px ${color}, 0 0 8px ${color};
    "></div>`,
    iconSize: [12, 12],
  });

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

/* ---------------- COMPONENT ---------------- */
export default function RiskZones() {
  /* ---------------- LOAD ZONES (DB + localStorage fallback) ---------------- */
  const [zones, setZonesState] = useState(() => {
    const saved = localStorage.getItem("riskZones_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && parsed[0].city === undefined) {
        localStorage.setItem("riskZones_v2", JSON.stringify(defaultZones));
        return defaultZones;
      }
      return parsed;
    }
    return defaultZones;
  });

  // Load from MySQL on mount (falls back to localStorage if backend is down)
  useEffect(() => {
    fetchZones().then(data => setZonesState(data));
  }, []);



  // Helper: renumber IDs with id first
  const renumberZoneIds = (zoneList) =>
    zoneList.map((zone, index) => {
      const { id, ...rest } = zone;
      return { id: index + 1, ...rest };
    });

  // Sync to localStorage + dispatch event whenever zones change
  useEffect(() => {
    const renumbered = renumberZoneIds(zones);
    localStorage.setItem("riskZones_v2", JSON.stringify(renumbered));
    window.dispatchEvent(new CustomEvent("zonesUpdated"));
  }, [zones]);

  /* ---------------- BASE / HQ STATE ---------------- */
  const [bases, setBases] = useState(getAllBases());
  const [activeIdx, setActiveIdx] = useState(getActiveBaseIndex());
  const [base, setBase] = useState(getBaseLocation());

  // keep in sync when another page changes the active HQ
  useEffect(() => {
    const unsub = subscribeBase(() => {
      setBases(getAllBases());
      setActiveIdx(getActiveBaseIndex());
      setBase(getBaseLocation());
    });
    return unsub;
  }, []);

  /* HQ add flow */
  const [pendingHQName, setPendingHQName] = useState("");
  const [newHQPoint, setNewHQPoint] = useState(null);

  useEffect(() => {
    if (newHQPoint) {
      setPendingHQName("Locating HQ...");
      reverseGeocode(newHQPoint.lat, newHQPoint.lng)
        .then(({ district, place }) => {
          setPendingHQName(`${district} - ${place} HQ`);
        })
        .catch(() => setPendingHQName("New HQ"));
    }
  }, [newHQPoint]);

  const startAddHQ = () => {
    setPendingHQName("");
    setNewHQPoint(null);
    setMode(mode === "addHQ" ? null : "addHQ");
  };

  const handleSaveHQ = () => {
    if (!pendingHQName.trim() || !newHQPoint) return;
    addBase({ lat: newHQPoint.lat, lng: newHQPoint.lng, name: pendingHQName.trim() });
    setBases(getAllBases());
    setActiveIdx(getActiveBaseIndex());
    setBase(getBaseLocation());
    setNewHQPoint(null);
    setPendingHQName("");
    setMode(null);
  };

  const handleSwitchHQ = (idx) => {
    setActiveBase(idx);
    setBases(getAllBases());
    setActiveIdx(getActiveBaseIndex());
    setBase(getBaseLocation());
  };

  const handleDeleteHQ = (idx) => {
    removeBase(idx);
    setBases(getAllBases());
    setActiveIdx(getActiveBaseIndex());
    setBase(getBaseLocation());
  };

  /* ---------------- MODE CONTROL ---------------- */
  const [mode, setMode] = useState(null); // "zone" | "addHQ" | "remove" | null
  const [sidebarTab, setSidebarTab] = useState("zones"); // "zones" | "hqs"
  const [activeTheme, setActiveTheme] = useState("dark"); // Map theme

  /* ---------------- NEW ZONE STATE ---------------- */
  const [newPoint, setNewPoint] = useState(null);
  const [zonePlace, setZonePlace] = useState("");
  const [zoneCity, setZoneCity] = useState("");
  const [zoneType, setZoneType] = useState("");
  const [zoneRisk, setZoneRisk] = useState(8);
  const [zoneDate, setZoneDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (newPoint) {
      setZonePlace("Locating place...");
      setZoneCity("Locating district...");
      reverseGeocode(newPoint.lat, newPoint.lng)
        .then(({ district, place }) => {
          setZoneCity(district);  // district name first (e.g. "Kanyakumari")
          setZonePlace(place);    // place name second (e.g. "Nagercoil")
        })
        .catch(() => {
          setZonePlace("Unknown Place");
          setZoneCity("Unknown District");
        });
    }
  }, [newPoint]);

  /* ---------------- EDIT RISK STATE ---------------- */
  const [editingId, setEditingId] = useState(null); // id of zone being edited
  const [editRisk, setEditRisk] = useState(8);

  const startEdit = (zone) => {
    setEditingId(zone.id);
    setEditRisk(zone.risk);
  };

  const confirmEdit = (id) => {
    updateZoneRisk(id, editRisk).then(data => setZonesState(data));
    setEditingId(null);
  };

  const handleAddZone = () => {
    if (!zoneType || !zoneDate) return;
    const newZone = {
      city: zoneCity, name: zonePlace, type: zoneType,
      lat: newPoint.lat, lng: newPoint.lng, risk: zoneRisk, date: zoneDate,
    };
    addZone(newZone).then(data => setZonesState(data));
    setNewPoint(null);
    setZoneType("");
    setZoneDate(new Date().toISOString().split("T")[0]);
    setMode(null);
  };

  const resetZones = () => {
    dbResetZones().then(data => setZonesState(data));
  };

  const handleRemoveZone = (id) => {
    dbRemoveZone(id).then(data => setZonesState(data));
  };

  /* ---------------- SEARCH ---------------- */
  const [searchQuery, setSearchQuery] = useState("");

  const filteredZones = zones.filter((zone) => {
    const q = searchQuery.toLowerCase();
    const matchName = zone.name && zone.name.toLowerCase().includes(q);
    const matchType = zone.type && zone.type.toLowerCase().includes(q);
    const matchCity = zone.city && zone.city.toLowerCase().includes(q);
    return matchName || matchType || matchCity;
  });

  const filteredBases = bases.filter((hq) => {
    const q = searchQuery.toLowerCase();
    return hq.name.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-slate-200">

      {/* HEADER */}
      <div className="p-4 bg-slate-900 border-b border-white/10 flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder={sidebarTab === "zones" ? "Search Zone..." : "Search HQ..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm w-full"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setMode(mode === "zone" ? null : "zone")}
            className={`px-3 py-1 text-xs rounded font-bold flex items-center gap-1 ${mode === "zone" ? "bg-blue-600" : "bg-slate-700"
              }`}
          >
            <PlusCircle size={14} />
            Add Zone
          </button>

          <button
            onClick={() => setMode(mode === "remove" ? null : "remove")}
            className={`px-3 py-1 text-xs rounded font-bold flex items-center gap-1 ${mode === "remove" ? "bg-red-600" : "bg-slate-700"
              }`}
          >
            <MinusCircle size={14} />
            Remove Zone
          </button>

          <button
            onClick={startAddHQ}
            className={`px-3 py-1 text-xs rounded font-bold flex items-center gap-1 ${mode === "addHQ" ? "bg-indigo-600" : "bg-slate-700"
              }`}
          >
            <Home size={14} />
            Add HQ
          </button>

          <button
            onClick={resetZones}
            className="text-xs bg-red-600 px-3 py-1 rounded font-bold"
          >
            Reset
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 overflow-hidden">

        {/* LIST PANEL */}
        <div className="w-1/3 border-r border-white/10 overflow-y-auto flex flex-col">
          
          {/* TAB SWITCHER */}
          <div className="flex border-b border-white/10 bg-slate-900/50">
            <button
              onClick={() => setSidebarTab("zones")}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                sidebarTab === "zones" 
                ? "text-blue-400 border-b-2 border-blue-500 bg-blue-500/5" 
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              Risk Zones
            </button>
            <button
              onClick={() => setSidebarTab("hqs")}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                sidebarTab === "hqs" 
                ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5" 
                : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              HQ Locations
            </button>
          </div>

          {/* ── HQ MANAGER ── */}
          {sidebarTab === "hqs" && (
            <div className="p-3 border-b border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Manage Headquarters</span>
              </div>

              {mode === "addHQ" && !newHQPoint && (
                <p className="text-[10px] text-indigo-400 font-semibold mb-2 animate-pulse">📍 Click on the map to place the new HQ</p>
              )}

              {/* HQ list */}
              <div className="space-y-1">
                {filteredBases.map((hq, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSwitchHQ(idx)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      idx === activeIdx
                        ? "bg-indigo-600/20 border border-indigo-500/40"
                        : "bg-slate-800/50 border border-white/5 hover:bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {idx === activeIdx
                        ? <Star size={10} className="text-indigo-400 shrink-0" fill="currentColor" />
                        : <Star size={10} className="text-slate-600 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{hq.name}</p>
                        <p className="text-[9px] text-slate-500">{hq.lat.toFixed(3)}, {hq.lng.toFixed(3)}</p>
                      </div>
                    </div>
                    {bases.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteHQ(idx); }}
                        className="text-slate-600 hover:text-red-400 ml-1 shrink-0 transition"
                        title="Delete HQ"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── RISK ZONE LIST ── */}
          {sidebarTab === "zones" && (
            <div className="flex-1 overflow-y-auto">
              {filteredZones.map((zone) => (
                <div key={zone.id} className="p-4 border-b border-white/5">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      {zone.city && <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">{zone.city}</span>}
                      {zone.city && <span className="text-slate-600 text-[10px]">·</span>}
                      <span className="text-white text-sm" style={{fontFamily: "Times New Roman, serif"}}>{zone.name}</span>
                      {zone.type && <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${zone.risk >= 8 ? "bg-red-500/20 text-red-400" : zone.risk >= 5 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"}`}>{zone.type}</span>}
                    </div>

                    {editingId === zone.id ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={editRisk}
                          onChange={(e) => setEditRisk(Number(e.target.value))}
                          className="bg-slate-800 border border-white/20 rounded px-1 py-0.5 text-xs text-white"
                        >
                          <option value={9}>Critical (9)</option>
                          <option value={6}>Elevated (6)</option>
                          <option value={3}>Secure (3)</option>
                        </select>
                        <button
                          onClick={() => confirmEdit(zone.id)}
                          className="bg-green-600 hover:bg-green-500 rounded p-0.5"
                          title="Confirm"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-slate-700 hover:bg-slate-600 rounded p-0.5 text-xs text-slate-300"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(zone)}
                        title="Click to change risk level"
                        className={`text-xs px-2 py-0.5 rounded font-semibold cursor-pointer hover:opacity-80 transition ${zone.risk >= 8
                          ? "bg-red-500/20 text-red-400"
                          : zone.risk >= 5
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                          }`}
                      >
                        Risk {zone.risk}
                      </button>
                    )}
                    {mode === "remove" && (
                      <button
                        onClick={() => handleRemoveZone(zone.id)}
                        className="ml-2 text-red-500 hover:text-red-400 transition"
                        title="Remove this zone"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MAP */}
        <div className="flex-1 relative">
          
          {/* --- FLOATING THEME PICKER --- */}
          <div className="absolute top-6 right-6 z-[1000] flex flex-col items-end gap-3">
            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-white flex flex-col gap-1">
              {Object.keys(MAP_THEMES).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTheme(key)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                    activeTheme === key 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "text-slate-600 hover:bg-slate-200/50"
                  }`}
                >
                  {MAP_THEMES[key].icon}
                  <span className={activeTheme === key ? "block" : "hidden lg:block"}>
                    {MAP_THEMES[key].name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <MapContainer
            center={[base.lat, base.lng]}
            zoom={13}
            className="h-full w-full"
          >
            <MapRecenter center={[base.lat, base.lng]} />
            <MapClickHandler
              mode={mode}
              setNewPoint={setNewPoint}
              setNewHQPoint={setNewHQPoint}
            />

            <TileLayer url={MAP_THEMES[activeTheme].url} />

            {/* ALL HQ MARKERS */}
            {bases.map((hq, idx) => (
              <Marker key={`hq-${idx}`} position={[hq.lat, hq.lng]} icon={baseIcon}>
                <Popup>
                  <b>{hq.name}</b>
                  {idx === activeIdx && <span className="ml-1 text-indigo-500 font-bold">(Active)</span>}
                </Popup>
              </Marker>
            ))}

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
                  <div className="flex flex-col gap-1.5 min-w-[120px]">
                    {zone.city && <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">{zone.city}</div>}
                    <div className="font-black text-slate-800 text-sm">{zone.name}</div>
                    {zone.type && <div className="text-[10px] text-slate-500 italic border-b border-slate-100 pb-1">{zone.type}</div>}
                    <div className={`mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded w-fit ${zone.risk >= 8 ? "bg-red-950 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                      zone.risk >= 5 ? "bg-amber-950 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]" :
                        "bg-emerald-950 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      }`}>
                      Risk Level: {zone.risk}
                    </div>
                    {zone.date && (
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Added: {zone.date}
                      </div>
                    )}
                    {mode === "remove" && (
                      <button
                        onClick={() => handleRemoveZone(zone.id)}
                        className="mt-2 bg-red-600 hover:bg-red-500 text-white px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider w-full shadow-sm shadow-red-500/30 transition-all active:scale-95"
                      >
                        Remove Zone
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
            {/* NEW HQ FORM */}
            {newHQPoint && (
              <Popup position={newHQPoint} onClose={() => setNewHQPoint(null)}>
                <div className="space-y-2 w-44">
                  <input
                    autoFocus
                    placeholder="HQ Name"
                    value={pendingHQName}
                    onChange={(e) => setPendingHQName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveHQ()}
                    className="w-full border p-1 text-sm text-slate-900"
                  />
                  <button
                    onClick={handleSaveHQ}
                    className="bg-indigo-600 text-white px-2 py-1 rounded text-sm w-full font-bold"
                  >
                    Save HQ
                  </button>
                </div>
              </Popup>
            )}

            {/* NEW ZONE FORM */}
            {newPoint && (
              <Popup position={newPoint} onClose={() => setNewPoint(null)}>
                <div className="space-y-2 w-52">

                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider px-1">{zoneCity}</p>

                  <input
                    placeholder="Place / Location Name"
                    value={zonePlace}
                    onChange={(e) => setZonePlace(e.target.value)}
                    className="w-full border border-slate-300 p-1 text-sm text-slate-900 font-semibold rounded focus:outline-none focus:border-blue-500"
                  />

                  <input
                    placeholder="Crime Type (e.g. Theft)"
                    value={zoneType}
                    onChange={(e) => setZoneType(e.target.value)}
                    className="w-full border border-slate-300 p-1 text-sm text-slate-900 rounded focus:outline-none focus:border-blue-500"
                    autoFocus
                  />

                  <input
                    type="date"
                    value={zoneDate}
                    onChange={(e) => setZoneDate(e.target.value)}
                    className="w-full border border-slate-300 p-1 text-sm text-slate-900 rounded"
                  />

                  <select
                    value={zoneRisk}
                    onChange={(e) => setZoneRisk(Number(e.target.value))}
                    className="w-full border border-slate-300 p-1 text-sm text-slate-900 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value={9}>Critical (9)</option>
                    <option value={6}>Elevated (6)</option>
                    <option value={3}>Secure (3)</option>
                  </select>

                  <button
                    onClick={handleAddZone}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded text-sm w-full font-bold transition-colors"
                  >
                    Add Risk Zone
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
