import mysql from "mysql2/promise";
import { readFileSync } from "fs";

const db = await mysql.createConnection({
  host: "localhost",
  port: 3306,
  database: "Patrol AI",
  user: "bhadree",
  password: "anime@#26",
});

const zones = JSON.parse(readFileSync("./src/data/riskZones.json", "utf8"));
const hqs   = JSON.parse(readFileSync("./src/data/hqs.json", "utf8"));

// Seed zones
await db.query("DELETE FROM risk_zones");
for (const z of zones) {
  await db.query(
    "INSERT INTO risk_zones (id, city, name, type, lat, lng, risk, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [z.id, z.city, z.name, z.type, z.lat, z.lng, z.risk, z.date || null]
  );
}
console.log(`✅ Seeded ${zones.length} risk zones`);

// Seed HQs
await db.query("DELETE FROM hq_locations");
for (const h of hqs) {
  await db.query(
    "INSERT INTO hq_locations (name, lat, lng) VALUES (?, ?, ?)",
    [h.name, h.lat, h.lng]
  );
}
console.log(`✅ Seeded ${hqs.length} HQ locations`);

await db.end();
console.log("🎉 Database seeded successfully!");
