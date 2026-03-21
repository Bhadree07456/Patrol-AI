import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const app = express();
app.use(cors());
app.use(express.json());

// ── MySQL Connection Pool ──────────────────────────────────
const db = mysql.createPool({
  host: "localhost",
  port: 3306,
  database: "Patrol AI",
  user: "bhadree",
  password: "anime@#26",
  waitForConnections: true,
  connectionLimit: 10,
});

// Test connection on startup
db.getConnection()
  .then(conn => { console.log("✅ MySQL connected"); conn.release(); })
  .catch(err => console.error("❌ MySQL error:", err.message));

// ── ZONES ─────────────────────────────────────────────────
app.get("/api/zones", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM risk_zones ORDER BY id");
  res.json(rows);
});

app.post("/api/zones", async (req, res) => {
  const { city, name, type, lat, lng, risk, date } = req.body;
  const [result] = await db.query(
    "INSERT INTO risk_zones (city, name, type, lat, lng, risk, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [city, name, type, lat, lng, risk, date]
  );
  const [rows] = await db.query("SELECT * FROM risk_zones WHERE id = ?", [result.insertId]);
  res.json(rows[0]);
});

app.delete("/api/zones/:id", async (req, res) => {
  await db.query("DELETE FROM risk_zones WHERE id = ?", [req.params.id]);
  // Renumber IDs
  const [rows] = await db.query("SELECT id FROM risk_zones ORDER BY id");
  for (let i = 0; i < rows.length; i++) {
    await db.query("UPDATE risk_zones SET id = ? WHERE id = ?", [i + 1, rows[i].id]);
  }
  res.json({ ok: true });
});

app.patch("/api/zones/:id", async (req, res) => {
  await db.query("UPDATE risk_zones SET risk = ? WHERE id = ?", [req.body.risk, req.params.id]);
  res.json({ ok: true });
});

app.post("/api/zones/reset", async (req, res) => {
  await db.query("DELETE FROM risk_zones");
  const zones = req.body;
  for (const z of zones) {
    await db.query(
      "INSERT INTO risk_zones (id, city, name, type, lat, lng, risk, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [z.id, z.city, z.name, z.type, z.lat, z.lng, z.risk, z.date || null]
    );
  }
  res.json({ ok: true });
});

// ── HQs ───────────────────────────────────────────────────
app.get("/api/hqs", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM hq_locations");
  res.json(rows);
});

app.post("/api/hqs", async (req, res) => {
  const { name, lat, lng } = req.body;
  const [result] = await db.query(
    "INSERT INTO hq_locations (name, lat, lng) VALUES (?, ?, ?)",
    [name, lat, lng]
  );
  res.json({ id: result.insertId, name, lat, lng });
});

app.delete("/api/hqs/:id", async (req, res) => {
  await db.query("DELETE FROM hq_locations WHERE id = ?", [req.params.id]);
  res.json({ ok: true });
});

// ── START ──────────────────────────────────────────────────
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
