import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const getRuntimeEnv = (key: string): string | undefined => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const importMetaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
  if (importMetaEnv && importMetaEnv[key]) {
    return importMetaEnv[key];
  }

  return undefined;
};

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  "https://bpasogtbjzxealbauhhl.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? // Keep compat if older env var is used
  "sb_publishable_ZLq3ChCBMS2gv2ipA_RjUw_gN5uVU9R";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables are not configured");
}

const isBrowser = typeof window !== "undefined";
const storage = isBrowser ? window.localStorage : undefined;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
});
