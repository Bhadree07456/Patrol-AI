import { useState, useEffect } from "react";
import MapView from "../components/MapView";
import { Shield, AlertTriangle, Navigation, Activity, Map, Satellite, Moon } from "lucide-react";

import TN_GOV from "../assets/logo/tn_gov_logo.png";
import TNSPS from "../assets/logo/TNSPS-nobg.png";
import TN_POLICE from "../assets/logo/tn_police_logo.png";

import { getBaseLocation, subscribeBase } from "../utils/baseLocation";


export default function Dashboard() {
  const [mapStyle, setMapStyle] = useState(
    localStorage.getItem("mapStyle") || "tactical"
  );
  const [base, setBase] = useState(getBaseLocation());
  useEffect(() => {
    localStorage.setItem("mapStyle", mapStyle);
  }, [mapStyle]);
  useEffect(() => {
    const unsubscribe = subscribeBase(() => {
      setBase(getBaseLocation());
    });
    return unsubscribe;
  }, []);



  return (
    <div className="relative h-[90vh] w-full bg-slate-100 dark:bg-slate-950 overflow-hidden transition-colors duration-300">

      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-[1001] p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-start">

          {/* LEFT SIDE */}
          <div className="flex items-stretch gap-4 pointer-events-auto">

            {/* LOGO BOX */}
            <div className="bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-md">

              <img src={TN_GOV} className="h-10 object-contain" />
              <div className="h-10 w-[1px] bg-slate-300 dark:bg-white/10"></div>
              <img src={TN_POLICE} className="h-10 object-contain" />
            </div>

            {/* TITLE BOX */}
            <div className="bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-700
            px-5 py-2 rounded-2xl shadow-2xl backdrop-blur-md">

              <div className="flex items-center gap-3">
                <div className="h-[60px] w-auto flex items-center justify-center">
                            <img
                              src={TNSPS}
                              alt="TNSPS Logo"
                              className="h-full w-auto object-contain"
                              draggable="false"
                            />
                          </div>

                <div>
                  <h1 className="text-slate-800 dark:text-white font-bold">
                    TNSPS
                  </h1>
                  <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">
                    Active Surveillance
                  </span>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                    HQ: {base.lat.toFixed(4)}, {base.lng.toFixed(4)}
                  </p>

                </div>
              </div>
            </div>
          </div>

          {/* STATS */}
          <div className="hidden md:flex gap-4 pointer-events-auto">
            <div className="hidden md:flex gap-4 pointer-events-auto">
              <StatPill
                icon={<AlertTriangle size={14} className="text-red-500" />}
                label="High Risk"
                value="12"
              />

              <StatPill
                icon={<Navigation size={14} className="text-emerald-500" />}
                label="Units"
                value="04"
              />

              <StatPill
                icon={<Activity size={14} className="text-blue-500" />}
                label="Uptime"
                value="99.9%"
              />

              {/* ✅ NEW HQ CARD */}
              <StatPill
                icon={<Shield size={14} className="text-indigo-500" />}
                label="HQ Location"
                value={`${base.lat.toFixed(3)}, ${base.lng.toFixed(3)}`}
              />
            </div>

          </div>
        </div>
      </header>

      {/* MAP */}
      <div className="absolute inset-0 z-0">
        <MapView mapStyle={mapStyle} base={base}/>
      </div>

      {/* BOTTOM BAR */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] w-full max-w-lg px-4">
        <div className="bg-white/90 dark:bg-slate-900
        border border-slate-200 dark:border-white/10
        p-2 rounded-2xl shadow-2xl flex justify-around backdrop-blur-xl">

          <StyleButton label="Clean" value="clean" mapStyle={mapStyle} setMapStyle={setMapStyle}/>
          <StyleButton label="Detail" value="detail" mapStyle={mapStyle} setMapStyle={setMapStyle}/>
          <StyleButton label="Tactical" value="tactical" mapStyle={mapStyle} setMapStyle={setMapStyle}/>
          <StyleButton label="Imagery" value="imagery" mapStyle={mapStyle} setMapStyle={setMapStyle}/>

        </div>
      </footer>

    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function StatPill({ icon, label, value }) {
  return (
    <div className="bg-white dark:bg-slate-900
    border border-slate-200 dark:border-slate-700
    px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-md">

      {icon}

      <div>
        <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-800 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}
function StyleButton({ label, value, mapStyle, setMapStyle }) {
  const active = mapStyle === value;

  return (
    <button
      onClick={() => setMapStyle(value)}
      className={`flex-1 py-3 text-xs font-bold uppercase rounded-xl transition-all
      ${active
        ? "bg-blue-600 text-white shadow-lg"
        : "text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}
