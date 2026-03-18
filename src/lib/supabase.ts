import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type CanonicalTableName = "profiles" | "pairing_history";

const TABLE_ENV_KEYS: Record<CanonicalTableName, string> = {
  profiles: "SUPABASE_TABLE_PROFILES",
  pairing_history: "SUPABASE_TABLE_PAIRING_HISTORY",
};

export function getTableName(name: CanonicalTableName): string {
  return process.env[TABLE_ENV_KEYS[name]] || name;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
