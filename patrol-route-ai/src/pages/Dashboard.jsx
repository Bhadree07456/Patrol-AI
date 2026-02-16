import MapView from "../components/MapView";
import { Shield, AlertTriangle, Navigation, Activity } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden">
      {/* 1. Top HUD (Heads-Up Display) */}
      <header className="absolute top-0 left-0 right-0 z-[1001] p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-2xl pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Shield className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-white font-bold tracking-tight leading-none">Patrol AI</h1>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Active Surveillance</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Overlay */}
          <div className="hidden md:flex gap-4 pointer-events-auto">
            <StatPill icon={<AlertTriangle size={14} className="text-red-400"/>} label="High Risk" value="12" />
            <StatPill icon={<Navigation size={14} className="text-emerald-400"/>} label="Units" value="04" />
            <StatPill icon={<Activity size={14} className="text-blue-400"/>} label="Uptime" value="99.9%" />
          </div>
        </div>
      </header>

      {/* 2. Map Container (Full Screen) */}
      <div className="absolute inset-0 z-0">
        <MapView />
      </div>

      {/* 3. Bottom Utility Bar */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1001] w-full max-w-lg px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex justify-around">
          <button className="flex-1 py-3 text-white text-xs font-bold uppercase hover:bg-white/5 rounded-xl transition-all">Overview</button>
          <button className="flex-1 py-3 text-blue-400 text-xs font-bold uppercase bg-blue-500/10 rounded-xl border border-blue-500/20">Live Intelligence</button>
          <button className="flex-1 py-3 text-white text-xs font-bold uppercase hover:bg-white/5 rounded-xl transition-all">Reporting</button>
        </div>
      </footer>
    </div>
  );
}

function StatPill({ icon, label, value }) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
      <div className="opacity-80">{icon}</div>
      <div>
        <p className="text-[9px] text-slate-400 font-bold uppercase">{label}</p>
        <p className="text-sm font-bold text-white leading-none">{value}</p>
      </div>
    </div>
  );
}