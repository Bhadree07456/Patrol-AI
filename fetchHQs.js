const fs = require('fs');
const path = require('path');

const zonesPath = path.join(__dirname, 'src', 'data', 'riskZones.json');
const zones = JSON.parse(fs.readFileSync(zonesPath, 'utf8'));

// Extract unique cities
const cities = [...new Set(zones.map(z => z.city))].filter(Boolean);
console.log(`Found ${cities.length} unique cities with risk zones:`, cities);

async function fetchHQs() {
  const hqs = [];
  for (const city of cities) {
    console.log(`Fetching Police HQ for ${city}...`);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=Police+Headquarters+${city}&format=json&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        hqs.push({
          name: `${city} Police HQ`,
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
        console.log(`✓ Found: ${data[0].display_name}`);
      } else {
        // Fallback to "Police City" if "Police Headquarters" fails
        const res2 = await fetch(`https://nominatim.openstreetmap.org/search?q=Police+${city}&format=json&limit=1`);
        const data2 = await res2.json();
        if (data2 && data2.length > 0) {
          hqs.push({
            name: `${city} Police Station`,
            lat: parseFloat(data2[0].lat),
            lng: parseFloat(data2[0].lon)
          });
          console.log(`✓ Found fallback: ${data2[0].display_name}`);
        } else {
          console.log(`✗ Could not find HQ for ${city}`);
        }
      }
    } catch (err) {
      console.error(`Error fetching HQ for ${city}:`, err);
    }
    
    // Rate limit for Nominatim (1 request per second)
    await new Promise(r => setTimeout(r, 1500));
  }
  
  if (hqs.length > 0) {
    fs.writeFileSync(path.join(__dirname, 'hqs.json'), JSON.stringify(hqs, null, 2));
    console.log(`\nSuccessfully saved ${hqs.length} HQs to hqs.json`);
  }
}

fetchHQs();
