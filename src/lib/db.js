/**
 * db.js — MySQL API client
 * Talks to Express/MySQL backend at localhost:5000.
 * Falls back to localStorage if backend is unreachable.
 */

import defaultZones from "../data/riskZones.json";
import defaultHQs   from "../data/hqs.json";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const LS_ZONES = "riskZones_v2";
const LS_HQS   = "tnsps_bases_v2";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

// ── ZONES ──────────────────────────────────────────────────

export async function fetchZones() {
  try {
    const data = await apiFetch("/api/zones");
    localStorage.setItem(LS_ZONES, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("zonesUpdated"));
    return data;
  } catch {
    console.warn("Backend unreachable — using localStorage");
    const saved = localStorage.getItem(LS_ZONES);
    return saved ? JSON.parse(saved) : defaultZones;
  }
}

export async function addZone(zone) {
  try {
    await apiFetch("/api/zones", { method: "POST", body: JSON.stringify(zone) });
    return await fetchZones();
  } catch {
    const zones = JSON.parse(localStorage.getItem(LS_ZONES) || "[]");
    const newZone = { ...zone, id: zones.length + 1 };
    const updated = [...zones, newZone];
    localStorage.setItem(LS_ZONES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("zonesUpdated"));
    return updated;
  }
}

export async function removeZone(id) {
  try {
    await apiFetch(`/api/zones/${id}`, { method: "DELETE" });
    return await fetchZones();
  } catch {
    const zones = JSON.parse(localStorage.getItem(LS_ZONES) || "[]");
    const updated = zones.filter(z => z.id !== id).map((z, i) => ({ ...z, id: i + 1 }));
    localStorage.setItem(LS_ZONES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("zonesUpdated"));
    return updated;
  }
}

export async function updateZoneRisk(id, risk) {
  try {
    await apiFetch(`/api/zones/${id}`, { method: "PATCH", body: JSON.stringify({ risk }) });
    return await fetchZones();
  } catch {
    const zones = JSON.parse(localStorage.getItem(LS_ZONES) || "[]");
    const updated = zones.map(z => z.id === id ? { ...z, risk } : z);
    localStorage.setItem(LS_ZONES, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("zonesUpdated"));
    return updated;
  }
}

export async function resetZones() {
  try {
    await apiFetch("/api/zones/reset", { method: "POST", body: JSON.stringify(defaultZones) });
    return await fetchZones();
  } catch {
    localStorage.setItem(LS_ZONES, JSON.stringify(defaultZones));
    window.dispatchEvent(new CustomEvent("zonesUpdated"));
    return defaultZones;
  }
}

// ── HQs ────────────────────────────────────────────────────

export async function fetchHQs() {
  try {
    const data = await apiFetch("/api/hqs");
    if (data?.length) {
      localStorage.setItem(LS_HQS, JSON.stringify(data));
      return data;
    }
  } catch {
    console.warn("Backend unreachable — using localStorage for HQs");
  }
  const saved = localStorage.getItem(LS_HQS);
  return saved ? JSON.parse(saved) : defaultHQs;
}

export async function addHQ(hq) {
  try {
    const data = await apiFetch("/api/hqs", { method: "POST", body: JSON.stringify(hq) });
    window.dispatchEvent(new Event("baseUpdated"));
    return data;
  } catch {
    const hqs = JSON.parse(localStorage.getItem(LS_HQS) || "[]");
    const updated = [...hqs, hq];
    localStorage.setItem(LS_HQS, JSON.stringify(updated));
    window.dispatchEvent(new Event("baseUpdated"));
    return hq;
  }
}

export async function removeHQ(id) {
  try {
    await apiFetch(`/api/hqs/${id}`, { method: "DELETE" });
    window.dispatchEvent(new Event("baseUpdated"));
  } catch {
    console.warn("removeHQ fallback to localStorage");
  }
}
