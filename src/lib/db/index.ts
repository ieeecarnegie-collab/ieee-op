import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

if (!connectionString.startsWith("postgres")) {
  throw new Error(
    "DATABASE_URL must be a PostgreSQL connection string. Copy DATABASE_URL from Vercel → Project → Settings → Environment Variables.",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export { schema };
