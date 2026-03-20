import React, { useMemo, useState, useEffect } from "react";
import defaultZones from "../data/riskZones.json";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Cell,
  LineChart, Line
} from "recharts";
import { 
  BarChart3, 
  AlertOctagon, 
  ShieldCheck, 
  TrendingUp,
  Zap,
  Download
} from "lucide-react";
import { exportAuditReport } from "../utils/auditReportExporter";

export default function Analytics() {
  const [isExporting, setIsExporting] = useState(false);
  
  // Load zones from localStorage with sync
  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem("riskZones_v3");
    return saved ? JSON.parse(saved) : defaultZones;
  });

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem("riskZones_v3");
      if (saved) setZones(JSON.parse(saved));
    };

    // Listen for storage events (cross-tab) and custom events (same-page)
    window.addEventListener("storage", sync);
    window.addEventListener("zonesUpdated", sync);
    
    // Initial sync
    sync();

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("zonesUpdated", sync);
    };
  }, []);
  
  // Logic to process stats
  const { stats, dateStats } = useMemo(() => {
    const total = zones.length;
    const highRisk = zones.filter(z => z.risk >= 8).length;
    const avgRisk = total > 0 ? (zones.reduce((acc, z) => acc + z.risk, 0) / total).toFixed(1) : 0;
    const safeZones = zones.filter(z => z.risk < 5).length;
    
    // Group zones by date
    const dateMap = {};
    zones.forEach(z => {
      // Default to today if older zones don't have a date property
      const d = z.date || new Date().toISOString().split("T")[0];
      dateMap[d] = (dateMap[d] || 0) + 1;
    });

    // Convert map to sorted array for the line chart
    const dateStats = Object.keys(dateMap).sort().map(date => ({
      date,
      count: dateMap[date]
    }));
    
    return { 
      stats: { total, highRisk, avgRisk, safeZones },
      dateStats
    };
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
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Risk Distribution by Sector Volume</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Secure (0-4)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Elevated (5-7)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Critical (8-10)</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[
                  {
                    name: "Secure", 
                    count: zones.filter(z => z.risk < 5).length,
                    fill: "#10b981"
                  },
                  {
                    name: "Elevated", 
                    count: zones.filter(z => z.risk >= 5 && z.risk < 8).length,
                    fill: "#f59e0b"
                  },
                  {
                    name: "Critical", 
                    count: zones.filter(z => z.risk >= 8).length,
                    fill: "#ef4444"
                  }
                ]} 
                margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={12}
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{
                    color: '#e2e8f0'
                  }}
                  formatter={(value) => [`${value} Zones`, 'Total Volume']}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={80}>
                  { /* We use the cell logic mapping from the data directly for cleaner styling */ }
                  {
                    [0, 1, 2].map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#10b981' : index === 1 ? '#f59e0b' : '#ef4444'} 
                      />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- TIMELINE CHART PANEL --- */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Risk Timeline</h2>
          </div>
          
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={dateStats} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false} 
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value) => [`${value} Zones Recorded`, 'Incidents']}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#0f172a', stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="pt-2 border-t border-white/5 text-center">
             <button 
               onClick={async () => {
                 setIsExporting(true);
                 try {
                   await new Promise(resolve => {
                     exportAuditReport(zones, dateStats, stats);
                     resolve();
                   });
               setTimeout(() => setIsExporting(false), 500);
                 } catch (error) {
                   console.error('Export failed:', error);
                   setIsExporting(false);
                 }
               }}
               disabled={isExporting}
               className={`flex items-center justify-center gap-1.5 mx-auto px-3 py-1.5 text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 rounded transition-all duration-200 border border-blue-500/30 ${
                 isExporting 
                   ? 'opacity-60 cursor-not-allowed' 
                   : 'hover:text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/50'
               }`}
             >
               <Download size={12} />
               {isExporting ? 'Generating Report...' : 'Export Full Audit Report'}
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
