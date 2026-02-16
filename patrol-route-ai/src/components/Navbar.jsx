import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Route as RouteIcon, 
  ShieldAlert, 
  BarChart3, 
  User, 
  Bell 
} from "lucide-react";

export default function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
    { name: "Route Generator", path: "/route", icon: <RouteIcon size={18} /> },
    { name: "Risk Zones", path: "/zones", icon: <ShieldAlert size={18} /> },
    { name: "Analytics", path: "/analytics", icon: <BarChart3 size={18} /> },
  ];

  return (
    /* Changed fixed to sticky and added top-0 */
    <nav className="sticky top-0 w-full z-[2000] bg-slate-900 border-b border-white/10 px-6 py-3 shadow-2xl">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between">
        
        {/* BRANDING */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <ShieldAlert className="text-white" size={22} />
          </div>
          <div>
            <span className="text-white font-black tracking-tighter text-lg block leading-none">PATROL AI</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] leading-none text-nowrap">v1.0</span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 uppercase tracking-wide ${
                isActive(link.path)
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </div>

        {/* USER SECTION */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
          </button>
          
          <div className="h-8 w-[1px] bg-white/10 mx-1"></div>

          <button className="flex items-center gap-3 p-1 pr-3 rounded-full bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
              <User size={18} />
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-[11px] font-bold text-white leading-none">Officer J. Doe</p>
              <p className="text-[9px] text-slate-500 font-medium">Duty Commander</p>
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}