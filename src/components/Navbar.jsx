import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Route as RouteIcon,
  ShieldAlert,
  BarChart3,
  Sun,
  Moon,
} from "lucide-react";
import { useEffect, useState } from "react";

import TN_GOV from "../assets/logo/tn_gov_logo.png";
import TN_POLICE from "../assets/logo/tn_police_logo.png";
import TNSPS from "../assets/logo/TNSPS-nobg.png";

export default function Navbar() {
  const location = useLocation();
  const [dark, setDark] = useState(true);

  /* ---------------- THEME INIT ---------------- */
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  /* ---------------- TOGGLE THEME ---------------- */
  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDark(!dark);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
    { name: "Route Generator", path: "/route", icon: <RouteIcon size={18} /> },
    { name: "Risk Zones", path: "/zones", icon: <ShieldAlert size={18} /> },
    { name: "Analytics", path: "/analytics", icon: <BarChart3 size={18} /> },
  ];

  return (
    <nav className="sticky top-0 w-full z-[2000]
      bg-white dark:bg-slate-900
      border-b border-slate-200 dark:border-white/10
      px-6 py-[1vh] backdrop-blur-lg transition-all duration-300">

      <div className="max-w-[1600px] h-[8vh] mx-auto flex items-center justify-between">

        {/* ---------------- BRAND ---------------- */}
        <div className="flex items-center gap-3">

          {/* LOGO CONTAINER */}
          <div className="h-[60px] w-auto flex items-center justify-center">
            <img
              src={TNSPS}
              alt="TNSPS Logo"
              className="h-full w-auto object-contain"
              draggable="false"
            />
          </div>

          {/* TEXT */}
          <div className="leading-tight">
            <p className="font-black text-lg tracking-tight text-slate-800 dark:text-white">
              TNSPS
            </p>
            <p className="text-[10px] uppercase tracking-[0.25em] text-blue-600 font-bold">
              Tamil Nadu Smart Patrol System
            </p>
          </div>
        </div>


        {/* ---------------- NAV LINKS ---------------- */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="relative flex items-center gap-2 text-sm font-semibold
              text-slate-600 dark:text-slate-300
              hover:text-blue-600 dark:hover:text-white transition"
            >
              {link.icon}
              {link.name}

              {isActive(link.path) && (
                <span className="absolute -bottom-4 left-0 w-full h-[2px] bg-blue-600 rounded-full"></span>
              )}
            </Link>
          ))}
        </div>

        {/* ---------------- RIGHT SECTION ---------------- */}
        <div className="flex items-center gap-5">

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg
            bg-slate-100 dark:bg-white/5
            hover:bg-slate-200 dark:hover:bg-white/10
            transition"
          >
            {dark ? (
              <Sun size={18} className="text-yellow-500" />
            ) : (
              <Moon size={18} className="text-slate-700" />
            )}
          </button>

          <div className="h-8 w-[1px] bg-slate-300 dark:bg-white/10"></div>

          {/* GOV LOGOS */}
          <img
            src={TN_GOV}
            alt="Tamil Nadu Government"
            className="h-10 object-contain"
          />

          <img
            src={TN_POLICE}
            alt="Tamil Nadu Police"
            className="h-10 object-contain"
          />
        </div>
      </div>
    </nav>
  );
}
