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

const cache = new TTLCache<any>(1000 * 60 * 20); // 20 minutes

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const spot = (searchParams.get("spot") ?? "oc-inlet") as SpotId;

    const selected = SPOTS.find((s) => s.id === spot) ?? SPOTS[0];

    // 1) Cache hit
    const hit = cache.get(selected.id);
    if (hit.hit) {
      return ok(hit.value, { cached: true });
    }

    // 2) Fetch fresh
    const { hours } = await fetchStormglass({ lat: selected.lat, lon: selected.lon });

    const now = hours[0];

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

    const hourly = hours.slice(0, 24).map((h) => ({
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
      hourly: hourly.map((h) => ({ time: h.time, windMph: h.windMph, windDirDeg: h.windDirDeg })),
      waveFt,
      periodS,
      beachFacingDeg: selected.beachFacingDeg,
    });

    const data = {
      spot: { id: selected.id, name: selected.name, lat: selected.lat, lon: selected.lon },
      updatedAtISO: now.time,

      now: {
        waveHeightFt: waveFt,
        wavePeriodS: periodS,
        windMph,
        windDirDeg,
        swellDirDeg: round1(pickNoaaNumber(now.swellDirection) ?? pickNoaaNumber(now.waveDirection)),
        waterTempC: round1(pickNoaaNumber(now.waterTemperature)),

        // ✅ NEW
        score10: scored.score10,
        status: scored.status,
        take: scored.take,
      },

      hourly,

      // ✅ NEW (optional)
      bestWindow2h: window2h,
    };

    // 3) Save cache
    cache.set(selected.id, data);

    return ok(data, { cached: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return fail(msg, 500);
  }
}