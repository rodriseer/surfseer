import { SPOTS } from "@/lib/spots";
import type { SpotKey, SurfHour, SurfReport } from "@/types/surf";

type StormglassHour = {
  time: string;
  waveHeight?: { noaa?: number };
  wavePeriod?: { noaa?: number };
  waveDirection?: { noaa?: number };
  windSpeed?: { noaa?: number };
  windDirection?: { noaa?: number };
  waterTemperature?: { noaa?: number };
};

type StormglassResponse = {
  hours: StormglassHour[];
};

function mpsToMph(mps: number) {
  return mps * 2.2369362920544;
}
function metersToFeet(m: number) {
  return m * 3.2808398950131;
}
function cToF(c: number) {
  return (c * 9) / 5 + 32;
}
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

/**
 * v1 scoring:
 * - wave height: sweet spot ~2–5ft
 * - period: sweet spot ~9–13s
 * - wind: penalize strong winds
 */
export function computeScore10(input: {
  waveHeightFt: number | null;
  wavePeriodS: number | null;
  windMph: number | null;
}): number | null {
  const { waveHeightFt, wavePeriodS, windMph } = input;
  if (waveHeightFt == null || wavePeriodS == null || windMph == null) return null;

  const h = waveHeightFt;
  const heightScore =
    h <= 0 ? 0 :
    h < 3.5 ? (h / 3.5) :
    h < 6 ? 1 - ((h - 3.5) / 10) :
    0.75;

  const p = wavePeriodS;
  const periodScore =
    p <= 5 ? 0 :
    p < 10 ? (p - 5) / 5 :
    p <= 13 ? 1 :
    p < 16 ? 1 - ((p - 13) / 9) :
    0.7;

  const w = windMph;
  const windScore =
    w <= 8 ? 1 :
    w < 12 ? 0.85 :
    w < 18 ? 0.6 :
    0.35;

  const raw = (0.45 * heightScore) + (0.35 * periodScore) + (0.20 * windScore);
  const score10 = clamp01(raw) * 10;

  // 1 decimal
  return Math.round(score10 * 10) / 10;
}

export async function getSurfReport(spotKey: SpotKey): Promise<SurfReport> {
  const spot = SPOTS[spotKey];
  if (!spot) throw new Error("Unknown spot");

  const apiKey = process.env.STORMGLASS_API_KEY;
  if (!apiKey) throw new Error("Missing STORMGLASS_API_KEY");

  // Stormglass expects lat + lng in the query string.
  // Our SPOTS uses lat + lon, so we map lon -> lng here.
  const params = new URLSearchParams({
    lat: String(spot.lat),
    lng: String(spot.lon),
    params:
      "waveHeight,wavePeriod,waveDirection,windSpeed,windDirection,waterTemperature",
    source: "noaa",
  });

  const url = `https://api.stormglass.io/v2/weather/point?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: apiKey },
    next: { revalidate: 60 * 10 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Stormglass error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as StormglassResponse;
  const rawHours = (data.hours ?? []).slice(0, 24);

  const hours: SurfHour[] = rawHours.map((h) => {
    const waveHeightFt =
      h.waveHeight?.noaa != null ? metersToFeet(h.waveHeight.noaa) : null;

    const wavePeriodS = h.wavePeriod?.noaa ?? null;
    const waveDirDeg = h.waveDirection?.noaa ?? null;

    const windMph = h.windSpeed?.noaa != null ? mpsToMph(h.windSpeed.noaa) : null;
    const windDirDeg = h.windDirection?.noaa ?? null;

    const waterTempF =
      h.waterTemperature?.noaa != null ? cToF(h.waterTemperature.noaa) : null;

    const score10 = computeScore10({
      waveHeightFt,
      wavePeriodS,
      windMph,
    });

    return {
      timeISO: h.time,
      waveHeightFt: waveHeightFt != null ? Math.round(waveHeightFt * 10) / 10 : null,
      wavePeriodS: wavePeriodS != null ? Math.round(wavePeriodS * 10) / 10 : null,
      waveDirDeg: waveDirDeg != null ? Math.round(waveDirDeg) : null,
      windMph: windMph != null ? Math.round(windMph) : null,
      windDirDeg: windDirDeg != null ? Math.round(windDirDeg) : null,
      waterTempF: waterTempF != null ? Math.round(waterTempF) : null,
      score10,
    };
  });

  const now = hours[0] ?? null;

  return {
    // Your SurfReport type wants { lat, lng }. We provide lng from lon.
    spot: { key: spotKey, name: spot.name, lat: spot.lat, lng: spot.lon },
    updatedAtISO: new Date().toISOString(),
    now: {
      waveHeightFt: now?.waveHeightFt ?? null,
      wavePeriodS: now?.wavePeriodS ?? null,
      waveDirDeg: now?.waveDirDeg ?? null,
      windMph: now?.windMph ?? null,
      windDirDeg: now?.windDirDeg ?? null,
      tideFt: null,
      waterTempF: now?.waterTempF ?? null,
      score10: now?.score10 ?? null,
    },
    hours,
  };
}