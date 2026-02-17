import React, { useMemo } from "react";
import zones from "../data/riskZones.json";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Cell 
} from "recharts";
import { 
  BarChart3, 
  AlertOctagon, 
  ShieldCheck, 
  TrendingUp,
  Zap
} from "lucide-react";

export default function Analytics() {
  // Logic to process stats
  const stats = useMemo(() => {
    const total = zones.length;
    const highRisk = zones.filter(z => z.risk >= 8).length;
    const avgRisk = (zones.reduce((acc, z) => acc + z.risk, 0) / total).toFixed(1);
    const safeZones = zones.filter(z => z.risk < 5).length;
    
    return { total, highRisk, avgRisk, safeZones };
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 p-6 text-slate-200 space-y-6 overflow-y-auto">
      
      {/* --- HEADER --- */}
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
          <BarChart3 className="text-blue-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Strategic Intelligence</h1>
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Sector Risk & Resource Allocation</p>
        </div>
      </div>

      {/* --- KPI STATS STRIP --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Total Sectors" value={stats.total} icon={<Zap size={20}/>} color="blue" />
        <KPICard title="Critical Alerts" value={stats.highRisk} icon={<AlertOctagon size={20}/>} color="red" />
        <KPICard title="Average Risk" value={stats.avgRisk} icon={<TrendingUp size={20}/>} color="amber" />
        <KPICard title="Secure Zones" value={stats.safeZones} icon={<ShieldCheck size={20}/>} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- MAIN CHART PANEL --- */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Risk Distribution by Sector</h2>
            <div className="flex gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Critical Threshold</span>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  domain={[0, 10]}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="risk" radius={[4, 4, 0, 0]}>
                  {zones.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.risk >= 8 ? '#ef4444' : entry.risk >= 5 ? '#f59e0b' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- SUMMARY SIDEBAR --- */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Resource Priority</h2>
          
          <div className="space-y-4">
            {zones.sort((a,b) => b.risk - a.risk).slice(0, 5).map((zone, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-600">0{i+1}</span>
                  <span className="text-xs font-bold text-white">{zone.name}</span>
                </div>
                <span className="text-xs font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                  {zone.risk}.0
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5 text-center">
             <button className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors">
               Export Full Audit Report
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Reusable KPI Component
function KPICard({ title, value, icon, color }) {
  const colorMap = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex items-center gap-4 shadow-lg">
      <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}