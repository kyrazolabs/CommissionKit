import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

let parsed: URL;
try {
  parsed = new URL(supabaseUrl);
} catch {
  throw new Error(
    `Invalid VITE_SUPABASE_URL: expected an http(s) URL, got "${supabaseUrl}"`,
  );
}

if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
  throw new Error(
    `Invalid VITE_SUPABASE_URL: expected http(s), got "${parsed.protocol}"`,
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
