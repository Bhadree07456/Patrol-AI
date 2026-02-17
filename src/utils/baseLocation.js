const DEFAULT_BASE = { lat: 13.0827, lng: 80.2707, name: "HQ (Default)" };

const STORAGE_KEY = "tnsps_base";

/* ---------------- GET BASE ---------------- */
export function getBaseLocation() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : DEFAULT_BASE;
}

/* ---------------- SET BASE ---------------- */
export function setBaseLocation(base) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
  window.dispatchEvent(new Event("baseUpdated")); // notify UI
}

/* ---------------- LISTENER HOOK ---------------- */
export function subscribeBase(callback) {
  window.addEventListener("baseUpdated", callback);
  return () => window.removeEventListener("baseUpdated", callback);
}
