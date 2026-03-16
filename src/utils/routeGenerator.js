import { getDistance } from "geolib";
import { getBaseLocation } from "./baseLocation";

const BASE = getBaseLocation();

function straightLineKm(a, b) {
  return getDistance(
    { latitude: a.lat, longitude: a.lng },
    { latitude: b.lat, longitude: b.lng }
  ) / 1000;
}

// Detour multiplier ~ 1.5 provides much closer road driving distance estimation
function estRoadKm(a, b) {
  return straightLineKm(a, b) * 1.5;
}

function insideRadius(point, base, radius) {
  return straightLineKm(base, point) <= radius;
}

function randomPointAround(base, radiusKm) {
  const r = radiusKm / 111;
  const u = Math.random();
  const v = Math.random();

  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;

  return {
    lat: base.lat + w * Math.cos(t),
    lng: base.lng + w * Math.sin(t)
  };
}

export async function generateSmartRoute(
  zones,
  maxKm = 20, // This is now a hard limit
  tolerance = 0, // Ignored entirely
  radius = 10,
  forceCoverAll = true
) {

  let route = [];
  let total = 0;
  let current = BASE;

  // Apply a safety margin so real-road distances stay under maxKm
  const safeMaxKm = maxKm * 0.90;

  // 🔥 High Risk Zones
  let highRiskZones = zones
    .filter(z => z.risk && Number(z.risk) >= 8)
    .filter(z => insideRadius(z, BASE, radius));

  while (highRiskZones.length > 0) {
    // Nearest neighbor algorithm for efficiency
    highRiskZones.sort((a, b) => estRoadKm(current, a) - estRoadKm(current, b));
    const zone = highRiskZones.shift();

    const travel = estRoadKm(current, zone);
    const returnDist = estRoadKm(zone, BASE);

    // If adding this zone plus returning to base exceeds safeMaxKm
    if (total + travel + returnDist > safeMaxKm) {
      if (!forceCoverAll) {
        continue;
      }
      // If forceCoverAll is true, we STILL add it, but this means we will
      // exceed maxKm. The frontend warns the user about this.
    }

    route.push(zone);
    total += travel;
    current = zone;
  }

  // Routine Patrol (Fill the gap up to safeMaxKm)
  let safetyCounter = 0;

  // We want to generate extra steps as long as there is room.
  // We stop once the distance + return trip gets very close to safeMaxKm.
  while (safetyCounter < 200) {
    safetyCounter++;

    let patrolPoint = randomPointAround(BASE, radius);
    if (!insideRadius(patrolPoint, BASE, radius)) continue;

    const travel = estRoadKm(current, patrolPoint);
    const returnDist = estRoadKm(patrolPoint, BASE);

    // Hard limit: only add the point if we can go there AND return to BASE without exceeding safeMaxKm.
    // Also, don't add points that barely move us (e.g. minimum travel dist)
    if (total + travel + returnDist <= safeMaxKm && travel > 0.5) {
      route.push({
        id: "routine-" + Math.random(),
        ...patrolPoint,
        risk: null,
        name: "Routine Patrol"
      });

      total += travel;
      current = patrolPoint;
    }
  }

  return {
    route: [BASE, ...route, BASE],
    totalDistance: total
  };
}
