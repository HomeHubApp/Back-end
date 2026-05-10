import bcrypt from "bcrypt";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  const client = await pool.connect();

  try {
    const schemaPath = path.resolve(__dirname, "../sql.sql");
    const schemaSql = await fs.readFile(schemaPath, "utf8");

    await client.query("CREATE SCHEMA IF NOT EXISTS public");
    await client.query("SET search_path TO public");

    // Ensure a fresh database has the required tables before we seed rows.
    await client.query(schemaSql);

    await client.query("BEGIN");

    await client.query("TRUNCATE TABLE device_status, devices, homes, users RESTART IDENTITY CASCADE");

    const passwordHash = await bcrypt.hash("password123", 12);

    const userResult = await client.query(
      `INSERT INTO users (fullname, username, email, password, is_mfa_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, fullname, email`,
      ["Demo User", "demouser", "demo@homehub.com", passwordHash, false],
    );

    const user = userResult.rows[0];

    const homeResult = await client.query(
      `INSERT INTO homes (user_id, name, type, address, city, country, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name`,
      [user.id, "Demo Home", "residential", "12 Sunset Avenue", "Lagos", "Nigeria", true],
    );

    const home = homeResult.rows[0];

    const devicesResult = await client.query(
      `INSERT INTO devices (home_id, name, category, mac_address, ip_address, is_online, is_active)
       VALUES
       ($1, $2, $3, $4, $5, $6, $7),
       ($1, $8, $9, $10, $11, $12, $13),
       ($1, $14, $15, $16, $17, $18, $19)
       RETURNING id, name, category`,
      [
        home.id,
        "Living Room Light",
        "light",
        "AA:BB:CC:DD:EE:01",
        "192.168.1.10",
        true,
        true,
        "Front Door Lock",
        "door",
        "AA:BB:CC:DD:EE:02",
        "192.168.1.11",
        true,
        true,
        "Bedroom AC",
        "ac",
        "AA:BB:CC:DD:EE:03",
        "192.168.1.12",
        false,
        true,
      ],
    );

    const [light, door, ac] = devicesResult.rows;

    await client.query(
      `INSERT INTO device_status (device_id, status_type, status_value, status_unit)
       VALUES
       ($1, 'on_off', '1', NULL),
       ($1, 'brightness', '75', '%'),
       ($2, 'locked', 'locked', NULL),
       ($3, 'on_off', '0', NULL),
       ($3, 'temperature', '22', 'C')`,
      [light.id, door.id, ac.id],
    );

    await client.query("COMMIT");

    console.log("Seed completed successfully.");
    console.log(`User: ${user.email} / password123`);
    console.log(`Home: ${home.name}`);
    console.log(`Devices created: ${devicesResult.rows.map((device) => device.name).join(", ")}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
