import { getDistance } from "geolib";
import { snapToRoad } from "./snapToRoad";

const BASE = { lat: 13.0827, lng: 80.2707 };

function distanceKm(a, b) {
  return getDistance(
    { latitude: a.lat, longitude: a.lng },
    { latitude: b.lat, longitude: b.lng }
  ) / 1000;
}

function insideRadius(point, base, radius) {
  return distanceKm(base, point) <= radius;
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
  targetKm = 20,
  tolerance = 5,
  radius = 10,
  forceCoverAll = true
) {

  const minKm = targetKm - tolerance;
  const maxKm = targetKm + tolerance;

  let route = [];
  let total = 0;
  let current = BASE;

  // 🔥 High Risk Zones
  const highRiskZones = zones
    .filter(z => z.risk && Number(z.risk) >= 8)
    .filter(z => insideRadius(z, BASE, radius));

  for (let zone of highRiskZones) {

    const travel = distanceKm(current, zone);
    const returnDist = distanceKm(zone, BASE);

    // Skip only if user chooses KM priority
    if (!forceCoverAll && total + travel + returnDist > maxKm) {
      continue;
    }

    route.push(zone);
    total += travel;
    current = zone;
  }

  // Routine Patrol
  let safetyCounter = 0;

  while (total < minKm && safetyCounter < 25) {

    safetyCounter++;

    let randomPoint = randomPointAround(BASE, radius);
    const patrolPoint = await snapToRoad(randomPoint);

    if (!patrolPoint) continue;
    if (!insideRadius(patrolPoint, BASE, radius)) continue;

    const travel = distanceKm(current, patrolPoint);
    const returnDist = distanceKm(patrolPoint, BASE);

    if (total + travel + returnDist > maxKm) continue;

    route.push({
      id: "routine-" + Math.random(),
      ...patrolPoint,
      risk: null,
      name: "Routine Patrol"
    });

    total += travel;
    current = patrolPoint;
  }

  return {
    route: [BASE, ...route, BASE],
    totalDistance: total
  };
}
