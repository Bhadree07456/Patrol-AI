export async function getRoadRoute(coordinates) {

  const API_KEY = "5b3ce3597851110001cf62487243b358f4c9427986c9ac997c5c079c";
  const CHUNK_SIZE = 40;

  console.log("🛣️ Fetching road route for", coordinates.length, "points");

  try {
    let allRouteCoords = [];
    let totalDistanceKm = 0;
    let totalDurationMin = 0;

    for (let i = 0; i < coordinates.length - 1; i += CHUNK_SIZE - 1) {
      const chunk = coordinates.slice(i, i + CHUNK_SIZE);

      console.log(`📍 Processing chunk ${Math.floor(i / (CHUNK_SIZE - 1)) + 1}, points: ${chunk.length}`);

      const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
        {
          method: "POST",
          headers: {
            Authorization: API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            coordinates: chunk.map(c => [c.lng, c.lat])
          })
        }
      );

      if (!res.ok) {
        console.error("❌ ORS API error:", res.status, res.statusText);
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();

      if (!data.features || !data.features[0]) {
        console.error("❌ ORS Route failure: ", data);
        throw new Error("No route features in response");
      }

      const coords = data.features[0].geometry.coordinates.map(
        c => [c[1], c[0]]
      );

      const summary = data.features[0].properties.summary;

      // Avoid duplicating the connecting point
      if (i > 0) {
        coords.shift();
      }

      allRouteCoords.push(...coords);
      totalDistanceKm += summary.distance / 1000;
      totalDurationMin += summary.duration / 60;

      console.log(`✅ Chunk processed: ${coords.length} coords, ${(summary.distance / 1000).toFixed(2)} km`);

      // Avoid strict rate limits on public ORS
      if (i + CHUNK_SIZE - 1 < coordinates.length - 1) {
        await new Promise(r => setTimeout(r, 600));
      }
    }

    console.log("✅ Road route complete:", allRouteCoords.length, "points,", totalDistanceKm.toFixed(2), "km");

    return {
      routeCoords: allRouteCoords,
      distanceKm: totalDistanceKm.toFixed(2),
      durationMin: totalDurationMin.toFixed(0)
    };

  } catch (err) {
    console.error("❌ Road routing failed:", err);
    
    // FALLBACK: Return straight-line route
    console.log("⚠️ Using fallback: straight-line route");
    
    const straightLineCoords = coordinates.map(c => [c.lat, c.lng]);
    
    // Calculate approximate distance
    let totalDist = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const lat1 = coordinates[i].lat;
      const lon1 = coordinates[i].lng;
      const lat2 = coordinates[i + 1].lat;
      const lon2 = coordinates[i + 1].lng;
      
      const R = 6371; // Earth radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalDist += R * c;
    }
    
    return {
      routeCoords: straightLineCoords,
      distanceKm: (totalDist * 1.7).toFixed(2), // Apply road factor
      durationMin: Math.round(totalDist * 1.7 * 2), // Rough estimate: 30 km/h average
      isFallback: true
    };
  }
}