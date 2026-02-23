import { createClient } from "@supabase/supabase-js";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} env var`);
  return v;
}

/**
 * Public client (safe) — use this for browser-like actions via API routes:
 * e.g., insert email signup with RLS policies.
 */
export const supabasePublic = () => {
  const url = requiredEnv("SUPABASE_URL");
  const anonKey = requiredEnv("SUPABASE_ANON_KEY");
  return createClient(url, anonKey, { auth: { persistSession: false } });
};

/**
 * Admin client (server-only) — use this ONLY in server routes that need privileged access
 * (e.g., reading the subscribers list to send daily emails).
 */
export const supabaseAdmin = () => {
  const url = requiredEnv("SUPABASE_URL");
  const serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY"); // server-only
  return createClient(url, serviceKey, { auth: { persistSession: false } });
};