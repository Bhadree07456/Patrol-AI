export async function getRoadRoute(coordinates) {

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
          coordinates: coordinates.map(c => [c.lng, c.lat])
        })
      }
    );

    const data = await res.json();

    if (!data.features) return null;

    const coords = data.features[0].geometry.coordinates.map(
      c => [c[1], c[0]]
    );

    const summary = data.features[0].properties.summary;

    return {
      routeCoords: coords,
      distanceKm: (summary.distance / 1000).toFixed(2),
      durationMin: (summary.duration / 60).toFixed(0)
    };

  } catch (err) {
    console.error(err);
    return null;
  }
}