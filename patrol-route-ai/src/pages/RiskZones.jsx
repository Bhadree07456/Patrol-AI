import { useState } from "react";
import zonesData from "../data/riskZones.json";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { ShieldAlert, MapPin, Filter, Activity, Search } from "lucide-react";
import L from "leaflet";

// Custom Marker Icons for Tactical look
const createMarker = (color) => new L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
  iconSize: [12, 12],
});

export default function RiskZones() {
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredZones = zonesData.filter((zone) => {
    const matchesSearch = zone.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "ALL") return true;
    if (filter === "HIGH") return zone.risk >= 8;
    if (filter === "MEDIUM") return zone.risk >= 5 && zone.risk < 8;
    if (filter === "LOW") return zone.risk < 5;
    return true;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-slate-200">
      
      {/* --- SUB-HEADER / FILTERS --- */}
      <div className="p-4 bg-slate-900/50 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-blue-500" size={24} />
          <h1 className="text-xl font-bold tracking-tight text-white">Zone Intelligence</h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-white/10">
          {[
            { id: "ALL", label: "All Sectors", color: "bg-slate-700" },
            { id: "HIGH", label: "Critical", color: "bg-red-600" },
            { id: "MEDIUM", label: "Elevated", color: "bg-amber-500" },
            { id: "LOW", label: "Secure", color: "bg-emerald-600" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === btn.id ? `${btn.color} text-white shadow-lg` : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text"
            placeholder="Search Sector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
          />
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: Zone List */}
        <div className="w-1/3 border-r border-white/5 flex flex-col bg-slate-900/20">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sector List</span>
            <span className="text-[10px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">
              {filteredZones.length} Nodes Found
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredZones.map((zone) => (
              <div
                key={zone.id}
                className="group p-4 border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className={zone.risk >= 8 ? "text-red-500" : "text-blue-400"} />
                    <span className="font-bold text-white tracking-tight">{zone.name}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                    zone.risk >= 8 ? "bg-red-500/10 text-red-500" : 
                    zone.risk >= 5 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                  }`}>
                    Risk {zone.risk}.0
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Activity size={12} />
                    <span>LAT: {zone.lat.toFixed(3)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Filter size={12} />
                    <span>LNG: {zone.lng.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Tactical Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={[13.0827, 80.2707]}
            zoom={13}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {filteredZones.map((zone) => (
              <Marker
                key={zone.id}
                position={[zone.lat, zone.lng]}
                icon={createMarker(zone.risk >= 8 ? "#ef4444" : zone.risk >= 5 ? "#f59e0b" : "#10b981")}
              >
                <Popup className="tactical-popup">
                  <div className="bg-slate-900 text-white p-1 rounded-lg">
                    <p className="font-bold border-b border-white/10 pb-1 mb-1">{zone.name}</p>
                    <p className="text-[10px] uppercase text-slate-400">Risk Severity: {zone.risk}/10</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          
          {/* Map Overlay Legend */}
          <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/80 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl space-y-2">
            <LegendItem color="bg-red-500" label="Critical Area" />
            <LegendItem color="bg-amber-500" label="Elevated Monitoring" />
            <LegendItem color="bg-emerald-500" label="Secure Sector" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}