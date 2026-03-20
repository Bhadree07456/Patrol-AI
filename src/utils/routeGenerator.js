import { getDistance } from "geolib";
import { getBaseLocation } from "./baseLocation";

/* ---------------- HELPERS ---------------- */

function straightLineKm(a, b) {
  return getDistance(
    { latitude: a.lat, longitude: a.lng },
    { latitude: b.lat, longitude: b.lng }
  ) / 1000;
}

function estRoadKm(a, b) {
  return straightLineKm(a, b) * 1.7;
}

/* ---------------- SEEDED RANDOM (daily rotation) ---------------- */
// Different seed each day AND each generation call so routes vary
function getDailySeed() {
  const now = new Date();
  // Combine date + a random salt stored per session so each click differs
  const datePart = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  let salt = sessionStorage.getItem("routeSalt");
  if (!salt) {
    salt = Math.floor(Math.random() * 99999).toString();
    sessionStorage.setItem("routeSalt", salt);
  }
  return datePart + parseInt(salt);
}

function seededRandom(seed) {
  // Simple LCG random number generator
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function shuffleArray(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------- VISIT TRACKING ---------------- */

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7));
}

function getVisitHistory() {
  const saved = localStorage.getItem("zoneVisitHistory");
  if (!saved) return { week: getWeekNumber(), visits: {} };
  const history = JSON.parse(saved);
  if (history.week !== getWeekNumber()) return { week: getWeekNumber(), visits: {} };
  return history;
}

function updateVisitHistory(zoneId) {
  const history = getVisitHistory();
  if (!history.visits[zoneId]) history.visits[zoneId] = 0;
  history.visits[zoneId]++;
  localStorage.setItem("zoneVisitHistory", JSON.stringify(history));
}

function filterZonesByVisitFrequency(zones) {
  const { visits = {} } = getVisitHistory();
  return zones.map(zone => {
    const visitCount = visits[zone.id] || 0;
    const targetVisits = zone.risk >= 8 ? 4 : 3;
    return {
      ...zone,
      visitCount,
      targetVisits,
      needsVisit: visitCount < targetVisits,
      priority: Math.max(0, (zone.risk >= 8 ? 4 : 3) - visitCount)
    };
  });
}

/* ---------------- MAIN FUNCTION ---------------- */

export async function generateSmartRoute(
  zones,
  maxKm = 25,
  tolerance = 0,
  radius = 5,
  forceCoverAll = true,
  base = null
) {
  const BASE = base ?? getBaseLocation();
  const safeMaxKm = maxKm * 0.80;

  // New salt each click so every generation is different
  sessionStorage.setItem("routeSalt", Math.floor(Math.random() * 99999).toString());
  const rng = seededRandom(getDailySeed());

  console.log("=== ROUTE GENERATION START ===");
  console.log("Base:", BASE, "| Max:", maxKm, "km | Safe:", safeMaxKm.toFixed(1), "km | Radius:", radius, "km");

  let route = [];
  let total = 0;
  let current = BASE;
  const visited = new Set();
  const key = (p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;
  const isVisited = (z) => visited.has(key(z));
  const markVisited = (z) => visited.add(key(z));

  // Deduplicate
  const seen = new Set();
  const uniqueZones = zones.filter(z => {
    const k = key(z);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Filter by radius
  const zonesInRadius = uniqueZones.filter(z => straightLineKm(BASE, z) <= radius);
  console.log("Zones in Radius:", zonesInRadius.length);

  if (zonesInRadius.length === 0) {
    let nearestDist = Infinity, nearestZone = null;
    for (const z of uniqueZones) {
      const d = straightLineKm(BASE, z);
      if (d < nearestDist) { nearestDist = d; nearestZone = z; }
    }
    alert(`No zones within ${radius}km.\nNearest: "${nearestZone?.name}" is ${nearestDist.toFixed(1)}km away.\nIncrease scan radius to at least ${Math.ceil(nearestDist + 2)}km.`);
    return { route: [BASE, BASE], totalDistance: 0, zonesVisited: 0, weeklyProgress: { critical: [], elevated: [], secure: [] } };
  }

  // Visit frequency info
  const zonesWithInfo = filterZonesByVisitFrequency(zonesInRadius);
  let pool = zonesWithInfo.filter(z => z.needsVisit);

  // If all zones hit weekly target, reset pool to all zones (least visited first)
  if (pool.length === 0) {
    console.warn("All zones hit weekly target — using full pool");
    pool = [...zonesWithInfo].sort((a, b) => a.visitCount - b.visitCount);
  }

  // Split by risk level
  const critical = pool.filter(z => z.risk >= 8);
  const elevated = pool.filter(z => z.risk >= 5 && z.risk < 8);
  const secure   = pool.filter(z => z.risk > 0 && z.risk < 5);

  console.log(`Pool — Critical: ${critical.length}, Elevated: ${elevated.length}, Secure: ${secure.length}`);

  // Shuffle each group independently using seeded RNG for variety
  const shuffledCritical = shuffleArray(critical, rng);
  const shuffledElevated = shuffleArray(elevated, rng);
  const shuffledSecure   = shuffleArray(secure, rng);

  // Calculate how many zones we can fit with slightly random mix
  const maxZones = Math.max(6, Math.floor(safeMaxKm / 1.7));
  
  // Randomize the mix slightly (e.g. 35-55% critical, 25-45% elevated)
  const cRatio = 0.35 + rng() * 0.20; 
  const eRatio = 0.25 + rng() * 0.20;
  const sRatio = Math.max(0.1, 1.0 - cRatio - eRatio);

  const cCount = Math.min(shuffledCritical.length, Math.ceil(maxZones * cRatio));
  const eCount = Math.min(shuffledElevated.length, Math.ceil(maxZones * eRatio));
  const sCount = Math.min(shuffledSecure.length,   Math.ceil(maxZones * sRatio));

  // Build candidate list: critical first, then elevated, then secure
  let candidates = [
    ...shuffledCritical.slice(0, cCount),
    ...shuffledElevated.slice(0, eCount),
    ...shuffledSecure.slice(0, sCount)
  ];

  console.log("Candidates selected:", candidates.length);

  // Nearest-neighbour with jitter to vary the path
  let zonesAdded = 0;
  while (candidates.length > 0) {
    const unvisited = candidates.filter(z => !isVisited(z));
    if (unvisited.length === 0) break;

    // Calculate distance to all potential points with jitter
    const options = unvisited.map(z => ({
      zone: z,
      dist: estRoadKm(current, z) * (0.75 + rng() * 0.5), // Increased jitter (75% to 125%)
      trueDist: estRoadKm(current, z)
    })).sort((a, b) => a.dist - b.dist);

    // Pick from the top 3 closest (or top 5 if starting from HQ) to ensure different directions
    const selectionWindow = (current === BASE) ? 5 : 3;
    const pickIdx = Math.floor(rng() * Math.min(selectionWindow, options.length));
    const selected = options[pickIdx];
    
    const bestZone = selected.zone;
    const travel = selected.trueDist;
    const returnDist = estRoadKm(bestZone, BASE);

    // Get original index in candidates
    const candIdx = candidates.findIndex(c => c.id === bestZone.id);

    if (total + travel + returnDist > safeMaxKm) {
      candidates.splice(candIdx, 1);
      continue;
    }

    route.push(bestZone);
    markVisited(bestZone);
    // Note: We keep updateVisitHistory here to ensure variety across clicks 
    // because it will make these zones less likely to appear in the next 'pool' selection.
    updateVisitHistory(bestZone.id); 
    
    total += travel;
    current = bestZone;
    candidates.splice(candIdx, 1);
    zonesAdded++;
  }

  total += estRoadKm(current, BASE);

  console.log(`Route complete — ${zonesAdded} zones, ${total.toFixed(2)} km`);

  return {
    route: [BASE, ...route, BASE],
    totalDistance: total,
    zonesVisited: zonesAdded,
    weeklyProgress: {
      critical: zonesWithInfo.filter(z => z.risk >= 8).map(z => ({ name: z.name, visits: z.visitCount, target: z.targetVisits })),
      elevated: zonesWithInfo.filter(z => z.risk >= 5 && z.risk < 8).map(z => ({ name: z.name, visits: z.visitCount, target: z.targetVisits })),
      secure:   zonesWithInfo.filter(z => z.risk < 5).map(z => ({ name: z.name, visits: z.visitCount, target: z.targetVisits }))
    }
  };
}
