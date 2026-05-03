import { defineConfig } from "drizzle-kit";
import path from "path";

// Prefer Supabase when configured, fall back to the local Replit DB.
// The # in Supabase passwords must be percent-encoded so the URL parser
// treats it as part of the password, not a URL fragment.
function resolveConnectionString(): string {
  const supabase = process.env.SUPABASE_DB_URL;
  if (supabase) return supabase.replace(/#/g, "%23");

  const local = process.env.DATABASE_URL;
  if (local) return local;

  throw new Error("DATABASE_URL or SUPABASE_DB_URL must be set.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: resolveConnectionString(),
  },
});
