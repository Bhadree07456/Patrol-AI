const BASE = { lat: 13.0827, lng: 80.2707 };

export async function snapToRoad(point) {

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
            [BASE.lng, BASE.lat],
            [point.lng, point.lat]
          ]
        })
      }
    );

    const data = await res.json();

    // ❌ If route not found → invalid road point
    if (!data.features || data.features.length === 0) {
      return null;
    }

    // ⭐ Use last coordinate from road route
    const coords =
      data.features[0].geometry.coordinates;

    const last = coords[coords.length - 1];

    return {
      lat: last[1],
      lng: last[0]
    };

  } catch (err) {
    console.error("snapToRoad error:", err);
    return null;
  }
}
