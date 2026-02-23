// src/app/api/forecast/route.ts

export const runtime = "nodejs";
// Force dynamic behavior (prevents Next from trying to prerender/cache this route)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { ok, fail } from "@/lib/apiResponse";
import { TTLCache } from "@/lib/ttlCache";
import { fetchStormglass } from "@/lib/stormglass";
import { bestWindow2h, scoreSurf10, windQuality } from "@/lib/surfScore";

// Match your spot list (keep IDs consistent with SpotPicker)
const SPOTS = [
  { id: "oc-inlet", name: "Ocean City (Inlet)", lat: 38.3287, lon: -75.0913, beachFacingDeg: 90 },
  { id: "oc-north", name: "Ocean City (Northside)", lat: 38.4066, lon: -75.057, beachFacingDeg: 85 },
  { id: "assateague", name: "Assateague", lat: 38.0534, lon: -75.2443, beachFacingDeg: 110 },
] as const;

type SpotId = (typeof SPOTS)[number]["id"];

// ✅ Lazy-init cache to avoid import-time crashes in Vercel functions
let _cache: TTLCache<any> | null = null;
function getCache() {
  if (!_cache) _cache = new TTLCache<any>(1000 * 60 * 20); // 20 minutes
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

/**
 * Stormglass returns an array of hourly points. Using hours[0] can look "stuck"
 * (often it's the first hour in the requested window). We pick the hour closest to now.
 */
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

    const spot = (searchParams.get("spot") ?? "oc-inlet") as SpotId;
    const selected = SPOTS.find((s) => s.id === spot) ?? SPOTS[0];

    // Optional: allow forcing a fresh call (e.g., your "Check now" button can use &force=1)
    const force = searchParams.get("force") === "1" || searchParams.get("force") === "true";

    const cache = getCache();

    // 1) Cache hit (unless forced)
    if (!force) {
      const hit = cache.get(selected.id);
      if (hit.hit) {
        return ok(hit.value, { cached: true });
      }
    }

    // 2) Fetch fresh
    const { hours } = await fetchStormglass({ lat: selected.lat, lon: selected.lon });
    if (!hours?.length) {
      return fail("No forecast hours returned from Stormglass", 502);
    }

    const idx = pickCurrentHourIndex(hours);
    const now = hours[idx];
    if (!now) {
      return fail("No usable forecast hour returned from Stormglass", 502);
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
      hourly: hourly.map((h: any) => ({ time: h.time, windMph: h.windMph, windDirDeg: h.windDirDeg })),
      waveFt,
      periodS,
      beachFacingDeg: selected.beachFacingDeg,
    });

    // Use a real "fetched at" timestamp for your UI "Updated:" label
    const fetchedAtISO = new Date().toISOString();

    const data = {
      spot: { id: selected.id, name: selected.name, lat: selected.lat, lon: selected.lon },

      // Backwards-compatible (your UI uses this): this is when *your* server fetched.
      updatedAtISO: fetchedAtISO,

      // Extra clarity (optional to render in UI)
      fetchedAtISO,
      forecastTimeISO: now.time,

      now: {
        waveHeightFt: waveFt,
        wavePeriodS: periodS,
        windMph,
        windDirDeg,
        swellDirDeg: round1(pickNoaaNumber(now.swellDirection) ?? pickNoaaNumber(now.waveDirection)),
        waterTempC: round1(pickNoaaNumber(now.waterTemperature)),

        // score
        score10: scored.score10,
        status: scored.status,
        take: scored.take,
      },

      hourly,

      bestWindow2h: window2h,
    };

    // 3) Save cache
    cache.set(selected.id, data);

    return ok(data, { cached: false });
  } catch (e) {
    console.error("FORECAST ROUTE ERROR:", e);
    const msg = e instanceof Error ? e.stack ?? e.message : String(e);
    return fail(msg, 500);
  }
}