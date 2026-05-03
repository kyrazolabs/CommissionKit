import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

// Prefer Supabase when configured, fall back to the local Replit DB.
// The # in Supabase passwords must be percent-encoded so the pg URL
// parser treats it as part of the password, not a URL fragment.
function resolveConnectionString(): string {
  const supabase = process.env.SUPABASE_DB_URL;
  if (supabase) return supabase.replace(/#/g, "%23");

  const local = process.env.DATABASE_URL;
  if (local) return local;

  throw new Error("No database URL configured. Set SUPABASE_DB_URL or DATABASE_URL.");
}

export const pool = new Pool({ connectionString: resolveConnectionString() });
export const db = drizzle(pool, { schema });

export * from "./schema";
