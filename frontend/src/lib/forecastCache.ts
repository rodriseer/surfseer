// src/lib/forecastCache.ts
import { createClient } from "@supabase/supabase-js";
import type { SpotId } from "@/lib/spots";

type CacheRow = {
  spot_id: string;
  payload: unknown;
  fetched_at: string;
  expires_at: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// IMPORTANT: Use service role on the server only (API routes, server actions)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// In-memory cache (fast but can reset on serverless cold starts)
const mem = new Map<string, { expiresAtMs: number; payload: unknown }>();

export type CachePolicy = {
  ttlSeconds: number; // e.g., 1200 = 20 minutes
};

function nowMs() {
  return Date.now();
}

export async function getCachedForecastOrNull(spotId: SpotId): Promise<unknown | null> {
  // 1) Memory cache
  const m = mem.get(spotId);
  if (m && m.expiresAtMs > nowMs()) return m.payload;

  // 2) Supabase cache
  const { data, error } = await supabase
    .from("forecast_cache")
    .select("spot_id,payload,expires_at")
    .eq("spot_id", spotId)
    .maybeSingle<Pick<CacheRow, "spot_id" | "payload" | "expires_at">>();

  if (error) {
    // Fail open: no cache
    return null;
  }
  if (!data) return null;

  const expiresAtMs = new Date(data.expires_at).getTime();
  if (expiresAtMs <= nowMs()) return null;

  // hydrate memory cache
  mem.set(spotId, { expiresAtMs, payload: data.payload });
  return data.payload;
}

export async function setCachedForecast(
  spotId: SpotId,
  payload: unknown,
  policy: CachePolicy
) {
  const expiresAtMs = nowMs() + policy.ttlSeconds * 1000;
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  // memory
  mem.set(spotId, { expiresAtMs, payload });

  // supabase
  await supabase.from("forecast_cache").upsert(
    {
      spot_id: spotId,
      payload,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAtIso,
    },
    { onConflict: "spot_id" }
  );
}