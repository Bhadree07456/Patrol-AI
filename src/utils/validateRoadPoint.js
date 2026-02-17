import { getBaseLocation } from "./baseLocation";

const BASE = getBaseLocation();


export async function isRoadReachable(point) {

  const API_KEY = "5b3ce3597851110001cf62487243b358f4c9427986c9ac997c5c079c";

  try {

    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          Authorization: API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          coordinates: [
            [BASE.lng, BASE.lat], // BASE
            [point.lng, point.lat]
          ]
        })
      }
    );

    const data = await res.json();

    return !!data.features;

  } catch {
    return false;
  }
}
