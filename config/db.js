// db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config({ override: true });

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT),
});

pool.connect()
.then(() => console.log("Postgres connected"))
.catch((err) => console.error("Connection Error:", err.message));

export default pool;