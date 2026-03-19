const fs = require('fs');
const path = require('path');

const zonesPath = path.join(__dirname, 'src', 'data', 'riskZones.json');
const zones = JSON.parse(fs.readFileSync(zonesPath, 'utf8'));

const cityHQs = {};

zones.forEach(z => {
  if (!z.city || !z.lat || !z.lng) return;
  if (!cityHQs[z.city]) {
    cityHQs[z.city] = { count: 0, lat: 0, lng: 0 };
  }
  cityHQs[z.city].lat += z.lat;
  cityHQs[z.city].lng += z.lng;
  cityHQs[z.city].count++;
});

const hqs = [];
for (const city in cityHQs) {
  const data = cityHQs[city];
  hqs.push({
    name: `${city} Central HQ`,
    lat: data.lat / data.count,
    lng: data.lng / data.count
  });
}

const hqsPath = path.join(__dirname, 'src', 'data', 'hqs.json');
fs.writeFileSync(hqsPath, JSON.stringify(hqs, null, 2));
console.log(`Saved ${hqs.length} HQs to data/hqs.json`);
