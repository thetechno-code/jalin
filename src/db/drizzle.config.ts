// src/db/drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
const isDbUrlValid = dbUrl && (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://"));

const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

if (!isDbUrlValid && (!sqlHost || !sqlDbName || !user || !password)) {
  console.warn("WARNING: DATABASE_URL or constituent SQL parameters are not fully configured in environment variables. Drizzle commands may fail.");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle", // Output directory for migrations.
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: isDbUrlValid ? {
    url: dbUrl,
    ssl: { rejectUnauthorized: false },
  } : {
    host: sqlHost || "localhost",
    user: user || "postgres",
    password: password || "",
    database: sqlDbName || "postgres",
    ssl: false, // Typically false when connecting via Cloud SQL Auth Proxy.
  },
  verbose: true, // Enable verbose output.
});
