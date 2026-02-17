import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  ShieldAlert,
  Settings2,
  Activity,
  Map as MapIcon,
  Cloud,
  Moon,
  Sun
} from "lucide-react";

import defaultZones from "../data/riskZones.json";
import { generateSmartRoute } from "../utils/routeGenerator";
import { getRoadRoute } from "../utils/roadRouteService";
import { getBaseLocation, subscribeBase } from "../utils/baseLocation";


/* ---------------- LOAD SHARED ZONES ---------------- */

function useSharedZones() {
  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem("riskZones");
    return saved ? JSON.parse(saved) : defaultZones;
  });

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem("riskZones");
      if (saved) setZones(JSON.parse(saved));
    };

    window.addEventListener("storage", sync);
    sync();

    return () => window.removeEventListener("storage", sync);
  }, []);

  return zones;
}

/* ---------------- CUSTOM MARKERS ---------------- */

const createCustomIcon = (color, shadowColor) =>
  new L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};
      width:14px;height:14px;border-radius:50%;
      border:2px solid white;
      box-shadow:0 0 8px ${shadowColor};
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const highRiskIcon = createCustomIcon("#ef4444", "rgba(239,68,68,.6)");
const routineIcon = createCustomIcon("#3b82f6", "rgba(59,130,246,.6)");
const baseIcon = createCustomIcon("#10b981", "rgba(16,185,129,.6)");

/* ---------------- MAP THEMES ---------------- */

const MAP_THEMES = {
  light: {
    name: "Clean",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    icon: <Sun size={14} />,
    routeColor: "#3b82f6"
  },
  dark: {
    name: "Tactical",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    icon: <Moon size={14} />,
    routeColor: "#60a5fa"
  },
  satellite: {
    name: "Imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    icon: <Cloud size={14} />,
    routeColor: "#fbbf24"
  },
  standard: {
    name: "Detailed",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    icon: <MapIcon size={14} />,
    routeColor: "#ef4444"
  }
};

/* ---------------- MAIN COMPONENT ---------------- */

export default function RouteGenerator() {

  const zones = useSharedZones(); // 🔥 dynamic zones

  const [kmLimit, setKmLimit] = useState(20);
  const [radius, setRadius] = useState(10);
  const [routeData, setRouteData] = useState(null);
  const [selectedZones, setSelectedZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTheme, setActiveTheme] = useState("light");

  const [base, setBase] = useState(getBaseLocation());
  const BASE_COORDS = [base.lat, base.lng];


  useEffect(() => {
    const unsubscribe = subscribeBase(() => {
      setBase(getBaseLocation());

      // reset route when HQ changes
      setRouteData(null);
      setSelectedZones([]);
    });

    return unsubscribe;
  }, []);


  /* Clear old routes if zones change */
  useEffect(() => {
    setRouteData(null);
    setSelectedZones([]);
  }, [zones]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const forced = await generateSmartRoute(zones, kmLimit, 2, radius, true);

      let finalRouteData = forced;
      if (forced.totalDistance > kmLimit + 5) {
        const choice = window.confirm(
          "High-risk coverage exceeds distance.\nOK = Prioritize Safety\nCancel = Limit Distance"
        );
        finalRouteData = await generateSmartRoute(zones, kmLimit, 5, radius, choice);
      }

      setSelectedZones(finalRouteData.route);
      const road = await getRoadRoute(finalRouteData.route);
      setRouteData(road);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      
      {/* --- SIDEBAR PANEL --- */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-[1001] shadow-2xl">
        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-blue-400" size={24} />
            <h1 className="text-xl font-bold tracking-tight">TNSPS</h1>
          </div>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1 font-semibold">Generate Route For Today</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-8 text-slate-600">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Settings2 size={16} className="text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Configuration</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Max Distance (KM)</label>
                <input 
                  type="number" value={kmLimit} 
                  onChange={(e) => setKmLimit(Number(e.target.value))}
                  className="w-full bg-slate-100 border-transparent rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Scan Radius (KM)</label>
                <input 
                  type="number" value={radius} 
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full bg-slate-100 border-transparent rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                />
              </div>
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-200 transition-all active:scale-[0.98] mt-2"
              >
                {loading ? "Calculating..." : "Generate Smart Route"}
              </button>
            </div>
          </section>

          {routeData && (
            <section className="pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={16} className="text-slate-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Analytics</h2>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-medium">Est. Distance</span>
                  <span className="text-sm font-bold text-slate-900">{routeData.distanceKm} KM</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-medium">Patrol Duration</span>
                  <span className="text-sm font-bold text-slate-900">{routeData.durationMin} MIN</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-medium">Points Visited</span>
                  <span className="text-sm font-bold text-slate-900">{Math.max(selectedZones.length - 2, 0)} Units</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </aside>

      {/* --- MAP MAIN VIEW --- */}
      <main className="flex-1 relative bg-slate-200">
        
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
          key={`${base.lat}-${base.lng}`}   // forces recenter
          center={BASE_COORDS}
          zoom={13}

          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer url={MAP_THEMES[activeTheme].url} />
          
          <Circle center={BASE_COORDS}
            radius={radius * 1000} 
            pathOptions={{ color: '#3b82f6', weight: 1, fillColor: '#3b82f6', fillOpacity: 0.05 }} 
          />

          {/* HQ MARKER */}
          <Marker position={BASE_COORDS} icon={baseIcon}>
            <Popup>
              <strong>Police HQ</strong><br />
              {base.lat.toFixed(4)}, {base.lng.toFixed(4)}
            </Popup>
          </Marker>


          {/* Zones Logic (Only high risk markers always visible) */}
          {zones.filter(z => z.risk >= 5).map((zone, i) => (
            <Marker key={`zone-${i}`} position={[zone.lat, zone.lng]} icon={highRiskIcon}>
              <Popup className="custom-popup">
                <div className="p-1 leading-tight">
                  <p className="font-bold text-slate-800">{zone.name}</p>
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">High Risk Level: {zone.risk}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Active Patrol Route Markers */}
          {selectedZones.map((zone, index) => {
            const isBase = index === 0 || index === selectedZones.length - 1;
            const isHighRisk = zone.risk && Number(zone.risk) >= 8;
            const icon = isBase ? baseIcon : (isHighRisk ? highRiskIcon : routineIcon);

            return (
              <Marker key={`route-${index}`} position={[zone.lat, zone.lng]} icon={icon}>
                <Popup>
                  <span className="font-bold">{zone.name || "Patrol Point"}</span>
                </Popup>
              </Marker>
            );
          })}

          {/* The Route Path */}
          {routeData && (
            <Polyline 
              positions={routeData.routeCoords} 
              color={MAP_THEMES[activeTheme].routeColor} 
              weight={4} 
              opacity={0.8}
              dashArray="1, 8"
              lineCap="round"
            />
          )}
        </MapContainer>

        {/* --- LEGEND OVERLAY --- */}
        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 z-[1000] flex gap-5">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 tracking-wider">
             <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> HQ
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 tracking-wider">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> CRITICAL
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 tracking-wider">
             <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> ROUTINE
           </div>
        </div>
      </main>
    </div>
  );
}