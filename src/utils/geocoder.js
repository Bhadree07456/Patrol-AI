// Reverse geocoder — returns { district, place }
// Queries both Nominatim + Photon and picks the most specific result

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

// Score how specific a place name is (higher = better)
function specificity(name) {
  if (!name || name === "Unknown Place") return 0;
  if (name.length < 3) return 1;
  return name.length; // longer names tend to be more specific
}

export async function reverseGeocode(lat, lng) {

  // ── Google Maps (best accuracy, needs real API key) ────────────
  if (GOOGLE_API_KEY && !GOOGLE_API_KEY.includes("YOUR_")) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}&language=en`
      );
      const data = await res.json();
      if (data.status === "OK" && data.results.length > 0) {
        let district = "", place = "";
        for (const result of data.results) {
          for (const comp of result.address_components) {
            if (!district && comp.types.includes("administrative_area_level_2"))
              district = comp.long_name.replace(/ District$/i, "").trim();
            if (!district && comp.types.includes("administrative_area_level_3"))
              district = comp.long_name;
            if (!place && comp.types.includes("sublocality_level_1"))
              place = comp.long_name;
            if (!place && comp.types.includes("sublocality"))
              place = comp.long_name;
            if (!place && comp.types.includes("locality"))
              place = comp.long_name;
          }
          if (district && place) break;
        }
        return {
          district: district || "Unknown District",
          place: place || district || "Unknown Place",
        };
      }
    } catch (err) {
      console.warn("Google Geocoding failed:", err);
    }
  }

  // ── Run Nominatim + Photon in parallel ─────────────────────────
  const [nominatim, photon] = await Promise.allSettled([
    fetchNominatim(lat, lng),
    fetchPhoton(lat, lng),
  ]);

  const n = nominatim.status === "fulfilled" ? nominatim.value : null;
  const p = photon.status === "fulfilled" ? photon.value : null;

  // Pick best district
  const district =
    n?.district && n.district !== "Unknown District" ? n.district :
    p?.district && p.district !== "Unknown District" ? p.district :
    "Unknown District";

  // Pick most specific place name
  const nPlace = n?.place || "";
  const pPlace = p?.place || "";
  const place = specificity(nPlace) >= specificity(pPlace) ? nPlace || pPlace : pPlace || nPlace;

  return {
    district: district.replace(/ District$/i, "").trim(),
    place: place || district || "Unknown Place",
  };
}

// ── Nominatim ──────────────────────────────────────────────────
async function fetchNominatim(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18&accept-language=en`,
    { headers: { "User-Agent": "PatrolAI/1.0 patrol-ai@local", "Accept-Language": "en" } }
  );
  const data = await res.json();
  const addr = data.address || {};

  const district =
    addr.state_district || addr.county || addr.city || addr.town || "";

  // zoom=18 gives very specific results — road/amenity level
  const place =
    addr.amenity ||
    addr.shop ||
    addr.building ||
    addr.tourism ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.city_district ||
    addr.quarter ||
    addr.village ||
    addr.hamlet ||
    addr.road ||
    addr.town ||
    addr.city ||
    data.display_name?.split(",")[0] ||
    "";

  return { district, place };
}

// ── Photon (Komoot) ────────────────────────────────────────────
async function fetchPhoton(lat, lng) {
  const res = await fetch(
    `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`
  );
  const data = await res.json();
  const props = data.features?.[0]?.properties || {};

  const district = props.county || props.city || props.state || "";

  const place =
    props.name ||
    props.street ||
    props.district ||
    props.city ||
    "";

  return { district, place };
}
