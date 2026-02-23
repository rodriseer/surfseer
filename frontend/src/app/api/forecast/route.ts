// src/app/api/forecast/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { ok, fail } from "@/lib/apiResponse";
import { TTLCache } from "@/lib/ttlCache";
import { fetchStormglass } from "@/lib/stormglass";
import { bestWindow2h, scoreSurf10, windQuality } from "@/lib/surfScore";
import { SPOTS, type SpotId, isSpotId } from "@/lib/spots";
import { dbCacheGet, dbCacheSet } from "@/lib/forecastDbCache";
import { singleFlight } from "@/lib/singleFlight";

// ✅ Recommended: 30 minutes to stay under 500 calls/day with many spots
const TTL_MS = 1000 * 60 * 30;

// ✅ Lazy-init cache to avoid import-time crashes in Vercel functions
let _cache: TTLCache<any> | null = null;
function getCache() {
  if (!_cache) _cache = new TTLCache<any>(TTL_MS);
  return _cache;
}

function pickNoaaNumber(obj: any): number | null {
  const n = obj?.noaa;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

function round1(n: number | null) {
  if (n == null) return null;
  return Math.round(n * 10) / 10;
}

function mToFt(m: number | null) {
  if (m == null) return null;
  return round1(m * 3.28084);
}

function pickCurrentHourIndex(hours: any[]): number {
  const nowMs = Date.now();
  let bestIdx = 0;
  let bestDiff = Infinity;

  for (let i = 0; i < hours.length; i++) {
    const tMs = Date.parse(hours[i]?.time);
    if (!Number.isFinite(tMs)) continue;

    const diff = Math.abs(tMs - nowMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const rawSpot = searchParams.get("spot") ?? "oc-inlet";
    const spotId: SpotId = isSpotId(rawSpot) ? rawSpot : "oc-inlet";
    const selected = SPOTS[spotId];

    const force = searchParams.get("force") === "1" || searchParams.get("force") === "true";
    const cache = getCache();

    // 1) Memory cache hit (unless forced)
    if (!force) {
      const hit = cache.get(selected.id);
      if (hit.hit) {
        return ok(hit.value, { cached: true, cacheLayer: "memory" });
      }
    }

    // 2) Supabase DB cache hit (shared across instances)
    if (!force) {
      const dbHit = await dbCacheGet(selected.id);
      if (dbHit) {
        cache.set(selected.id, dbHit); // hydrate memory
        return ok(dbHit, { cached: true, cacheLayer: "db" });
      }
    }

    // 3) Fetch fresh
// 3) Fetch fresh (single-flight per spot)
const data = await singleFlight(`forecast:${selected.id}`, async () => {
  // IMPORTANT: re-check caches INSIDE the lock so only one request refreshes
  if (!force) {
    const hit2 = cache.get(selected.id);
    if (hit2.hit) return hit2.value;

    const dbHit2 = await dbCacheGet(selected.id);
    if (dbHit2) {
      cache.set(selected.id, dbHit2);
      return dbHit2;
    }
  }

  const { hours } = await fetchStormglass({ lat: selected.lat, lon: selected.lon });
  if (!hours?.length) {
    throw new Error("No forecast hours returned from Stormglass");
  }

  const idx = pickCurrentHourIndex(hours);
  const now = hours[idx];
  if (!now) {
    throw new Error("No usable forecast hour returned from Stormglass");
  }

  const windMps = pickNoaaNumber(now.windSpeed);
  const windMph = windMps != null ? Math.round(windMps * 2.23694) : null;

  const waveFt = mToFt(pickNoaaNumber(now.waveHeight) ?? pickNoaaNumber(now.swellHeight));
  const periodS = round1(pickNoaaNumber(now.wavePeriod) ?? pickNoaaNumber(now.swellPeriod));
  const windDirDeg = round1(pickNoaaNumber(now.windDirection));

  const windDirBonus =
    windDirDeg != null ? windQuality(windDirDeg, selected.beachFacingDeg).bonus : 0;

  const scored = scoreSurf10({
    windMph,
    waveFt,
    periodS,
    windDirBonus,
  });

  const hourly = hours.slice(idx, idx + 24).map((h: any) => ({
    time: h.time,
    windMph:
      typeof h.windSpeed?.noaa === "number" && Number.isFinite(h.windSpeed.noaa)
        ? Math.round(h.windSpeed.noaa * 2.23694)
        : null,
    windDirDeg: round1(pickNoaaNumber(h.windDirection)),
    waveHeightFt: mToFt(pickNoaaNumber(h.waveHeight) ?? pickNoaaNumber(h.swellHeight)),
    wavePeriodS: round1(pickNoaaNumber(h.wavePeriod) ?? pickNoaaNumber(h.swellPeriod)),
  }));

  const window2h = bestWindow2h({
    hourly: hourly.map((h: any) => ({
      time: h.time,
      windMph: h.windMph,
      windDirDeg: h.windDirDeg,
    })),
    waveFt,
    periodS,
    beachFacingDeg: selected.beachFacingDeg,
  });

  const fetchedAtISO = new Date().toISOString();

  const fresh = {
    spot: { id: selected.id, name: selected.name, lat: selected.lat, lon: selected.lon },
    updatedAtISO: fetchedAtISO,
    fetchedAtISO,
    forecastTimeISO: now.time,

    now: {
      waveHeightFt: waveFt,
      wavePeriodS: periodS,
      windMph,
      windDirDeg,
      swellDirDeg: round1(pickNoaaNumber(now.swellDirection) ?? pickNoaaNumber(now.waveDirection)),
      waterTempC: round1(pickNoaaNumber(now.waterTemperature)),
      score10: scored.score10,
      status: scored.status,
      take: scored.take,
    },

    hourly,
    bestWindow2h: window2h,
  };

  // Save caches (inside lock)
  cache.set(selected.id, fresh);
  await dbCacheSet(selected.id, fresh, TTL_MS);

  return fresh;
});

return ok(data, { cached: false, cacheLayer: "fresh" });
  } catch (e) {
    console.error("FORECAST ROUTE ERROR:", e);
    const msg = e instanceof Error ? e.stack ?? e.message : String(e);
    return fail(msg, 500);
  }
}