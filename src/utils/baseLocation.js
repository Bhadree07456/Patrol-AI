import defaultHQs from "../data/hqs.json";

const BASES_KEY   = "tnsps_bases_v3";
const ACTIVE_KEY  = "tnsps_active_base";

/* ─── INTERNAL HELPERS ─── */

function loadBases() {
  const saved = localStorage.getItem(BASES_KEY);
  return saved ? JSON.parse(saved) : defaultHQs;
}

function saveBases(bases) {
  localStorage.setItem(BASES_KEY, JSON.stringify(bases));
}

function loadActiveIdx() {
  const saved = localStorage.getItem(ACTIVE_KEY);
  const idx = saved !== null ? Number(saved) : 0;
  const bases = loadBases();
  return Math.max(0, Math.min(idx, bases.length - 1));
}

/* ─── PUBLIC API ─── */

/** Returns the currently active HQ (backwards-compatible). */
export function getBaseLocation() {
  const bases = loadBases();
  return bases[loadActiveIdx()];
}

/** Returns all saved HQs as an array. */
export function getAllBases() {
  return loadBases();
}

/** Returns the index of the currently active HQ. */
export function getActiveBaseIndex() {
  return loadActiveIdx();
}

/** Adds a new HQ to the list and makes it active. */
export function addBase(base) {
  const bases = loadBases();
  bases.push(base);
  saveBases(bases);
  localStorage.setItem(ACTIVE_KEY, String(bases.length - 1));
  window.dispatchEvent(new Event("baseUpdated"));
}

/** Removes the HQ at `idx`. Won't remove if it's the last one. */
export function removeBase(idx) {
  const bases = loadBases();
  if (bases.length <= 1) return;
  bases.splice(idx, 1);
  saveBases(bases);
  // If removed index was active or beyond the new length, reset to 0
  const activeIdx = loadActiveIdx();
  const newActive = activeIdx >= bases.length ? 0 : activeIdx === idx ? 0 : activeIdx > idx ? activeIdx - 1 : activeIdx;
  localStorage.setItem(ACTIVE_KEY, String(newActive));
  window.dispatchEvent(new Event("baseUpdated"));
}

/** Sets the HQ at `idx` as the active one. */
export function setActiveBase(idx) {
  const bases = loadBases();
  const clamped = Math.max(0, Math.min(idx, bases.length - 1));
  localStorage.setItem(ACTIVE_KEY, String(clamped));
  window.dispatchEvent(new Event("baseUpdated"));
}

/**
 * Legacy: set the single active base (replaces it in the list).
 * Kept so Dashboard/MapView setBaseLocation calls still work.
 */
export function setBaseLocation(base) {
  const bases = loadBases();
  const idx = loadActiveIdx();
  bases[idx] = base;
  saveBases(bases);
  window.dispatchEvent(new Event("baseUpdated"));
}

/* ─── LISTENER HOOK ─── */
export function subscribeBase(callback) {
  window.addEventListener("baseUpdated", callback);
  return () => window.removeEventListener("baseUpdated", callback);
}
