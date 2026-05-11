// db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config({ override: true });

const { Pool } = pkg;

// This logic allows the app to work on Render (using a string) 
// and locally (using individual PG_ variables)
const isProduction = process.env.NODE_ENV === "production";


const poolConfig = process.env.DATABASE_URL 
  ? {
      // Production: Use the Supabase connection string
      connectionString: process.env.DATABASE_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
    }
  : {
      // Local: Use your existing individual variables
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: Number(process.env.PG_PORT),
      ssl: false,
    };

const pool = new Pool(poolConfig);

pool.connect()
  .then(() => console.log(`Postgres connected (${isProduction ? 'Production/Supabase' : 'Local'})`))
  .catch((err) => console.error("Connection Error:", err.message));

export default pool;