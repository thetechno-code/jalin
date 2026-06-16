// src/db/index.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

export const isDbConfigured = !!(
  process.env.DATABASE_URL || 
  (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_DB_NAME)
);

// Function to create a new connection pool.
export const createPool = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
    console.log("Database Connection: Connecting using DATABASE_URL (Supabase/PostgreURI)...");
    return new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: isDbConfigured ? 3000 : 1000,
    });
  }

  if (dbUrl) {
    console.error("WARNING: DATABASE_URL is set but is NOT a valid PostgreSQL connection string. It must start with 'postgres://' or 'postgresql://'. Received:", dbUrl);
    console.log("Database Connection: Falling back to Google Cloud SQL because DATABASE_URL is invalid.");
  } else {
    console.log("Database Connection: Connecting using Google Cloud SQL credentials...");
  }

  return new Pool({
    host: process.env.SQL_HOST || "127.0.0.1",
    user: process.env.SQL_USER || "postgres",
    password: process.env.SQL_PASSWORD || "",
    database: process.env.SQL_DB_NAME || "postgres",
    connectionTimeoutMillis: isDbConfigured ? 3000 : 1000,
  });
};

// Create a pool instance.
export const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });

