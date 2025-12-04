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
  getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL") ??
  getRuntimeEnv("VITE_SUPABASE_URL") ??
  getRuntimeEnv("SUPABASE_URL");

const supabaseAnonKey =
  getRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ??
  getRuntimeEnv("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  getRuntimeEnv("SUPABASE_ANON_KEY");

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
