import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

const getSupabaseCredentials = () => {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "";

  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url) {
    throw new Error("Missing Supabase URL environment variable");
  }

  if (!serviceKey) {
    throw new Error("Missing Supabase service role or anon key");
  }

  return { url, serviceKey };
};

export const getServerSupabaseClient = (): SupabaseClient => {
  if (!cachedClient) {
    const { url, serviceKey } = getSupabaseCredentials();
    cachedClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "X-Client-Info": "petskub-next-app/server",
        },
      },
    });
  }

  return cachedClient;
};
