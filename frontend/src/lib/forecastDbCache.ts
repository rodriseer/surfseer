// src/lib/forecastDbCache.ts
import { supabaseAdmin } from "@/lib/supabaseServer";

const TABLE = "forecast_cache";

type Row = {
  spot_id: string;
  payload: any;
  fetched_at: string;
  expires_at: string;
};

export async function dbCacheGet(spotId: string) {
  const supabase = supabaseAdmin();

  const { data, error } = await supabase
    .from(TABLE)
    .select("payload, expires_at")
    .eq("spot_id", spotId)
    .maybeSingle();

  if (error) {
    // don't hard-fail forecast if DB cache has an issue
    console.warn("dbCacheGet error:", error.message);
    return null;
  }
  if (!data) return null;

  const expMs = Date.parse(String((data as any).expires_at));
  if (Number.isFinite(expMs) && Date.now() > expMs) return null;

  return (data as any).payload ?? null;
}

export async function dbCacheSet(spotId: string, payload: any, ttlMs: number) {
  const supabase = supabaseAdmin();

  const now = new Date();
  const expires = new Date(now.getTime() + ttlMs);

  const row: Partial<Row> = {
    spot_id: spotId,
    payload,
    fetched_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };

  const { error } = await supabase.from(TABLE).upsert(row, { onConflict: "spot_id" });

  if (error) {
    // don't hard-fail forecast if DB cache write has an issue
    console.warn("dbCacheSet error:", error.message);
  }
}