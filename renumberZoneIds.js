import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the riskZones.json file
const filePath = path.join(__dirname, 'src', 'data', 'riskZones.json');

// Read the file
const data = fs.readFileSync(filePath, 'utf8');
const zones = JSON.parse(data);

// Renumber IDs sequentially starting from 1
const renumberedZones = zones.map((zone, index) => {
  // Create new object with id first, then other properties
  const { id, ...rest } = zone;
  return {
    id: index + 1,
    ...rest
  };
});

// Write back to file with each zone on its own line
const formattedJson = '[\n' + 
  renumberedZones.map(zone => '  ' + JSON.stringify(zone)).join(',\n') + 
'\n]';
fs.writeFileSync(filePath, formattedJson, 'utf8');

console.log(`✅ Successfully renumbered ${renumberedZones.length} zones!`);
console.log(`   IDs now range from 1 to ${renumberedZones.length}`);
