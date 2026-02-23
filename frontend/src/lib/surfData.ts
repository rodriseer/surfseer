// frontend/src/lib/surfData.ts

import { scoreSurf10, windQuality } from "@/lib/surfScore";

export type TodayData = {
  updated: string;

  wind_mph: number | null;
  wind_dir_deg: number | null;

  wave_ft: number | null;
  period_s: number | null;

  hourly: Array<{
    time: string;
    wind_mph: number | null;
    wind_dir_deg: number | null;
    wave_ft: number | null;
    period_s: number | null;
  }>;

  forecast: Array<{
    date: string;
    wind_max_mph: number | null;
    temp_max_f: number | null;
    temp_min_f: number | null;
  }>;
};

export type TideData = {
  station: string;
  tides: Array<{ type: string; time: string; height?: string }>;
};

export type OutlookDay = {
  date: string; // YYYY-MM-DD
  score_best: number | null;
  best_window_label: string | null;

  wave_ft: number | null;
  period_s: number | null;
  wind_mph: number | null;
  wind_dir_deg: number | null;

  wind_max_mph: number | null;
  temp_max_f: number | null;
  temp_min_f: number | null;
};

/* ----------------- helpers ----------------- */

function num(x: any): number | null {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : null;
}

function round1(n: number | null) {
  if (n == null) return null;
  return Math.round(n * 10) / 10;
}

function mpsToMph(mps: number | null) {
  if (mps == null) return null;
  return round1(mps * 2.23694);
}

function mToFt(m: number | null) {
  if (m == null) return null;
  return round1(m * 3.28084);
}

function cToF(c: number | null) {
  return c == null ? null : (c * 9) / 5 + 32;
}

function dateKey(isoTime: string) {
  const d = String(isoTime ?? "");
  return d.includes("T") ? d.split("T")[0] : d.slice(0, 10);
}

/* ----------------- simple TTL cache ----------------- */

const TTL_MS = 1000 * 60 * 20;
const stormCache = new Map<string, { ts: number; data: TodayData }>();

/* ----------------- Stormglass fetch ----------------- */

type StormglassHour = {
  time: string;
  windSpeed?: { noaa?: number };
  windDirection?: { noaa?: number };
  waveHeight?: { noaa?: number };
  wavePeriod?: { noaa?: number };
  swellHeight?: { noaa?: number };
  swellPeriod?: { noaa?: number };
};

function pickCurrentHourIndex(hours: StormglassHour[]): number {
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

async function fetchStormglassPoint(lat: number, lon: number) {
  const key = process.env.STORMGLASS_API_KEY;
  if (!key) throw new Error("Missing STORMGLASS_API_KEY");

  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lon),
    source: "noaa",
    params: ["windSpeed", "windDirection", "waveHeight", "wavePeriod", "swellHeight", "swellPeriod"].join(","),
  });

  const url = `https://api.stormglass.io/v2/weather/point?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: key },
    cache: "no-store",
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {}

  if (!res.ok) {
    const msg =
      json?.errors?.[0]?.message ?? json?.message ?? `Stormglass request failed (${res.status})`;
    throw new Error(msg);
  }

  const hours: StormglassHour[] = Array.isArray(json?.hours) ? json.hours : [];
  if (!hours.length) throw new Error("Stormglass returned no hourly data.");
  return hours;
}

// Cached version for outlook (server cache 30 minutes)
async function fetchStormglassPointCached(lat: number, lon: number) {
  const key = process.env.STORMGLASS_API_KEY;
  if (!key) throw new Error("Missing STORMGLASS_API_KEY");

  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lon),
    source: "noaa",
    params: ["windSpeed", "windDirection", "waveHeight", "wavePeriod", "swellHeight", "swellPeriod"].join(","),
  });

  const url = `https://api.stormglass.io/v2/weather/point?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: key },
    next: { revalidate: 1800 }, // 30 minutes
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {}

  if (!res.ok) {
    const msg =
      json?.errors?.[0]?.message ?? json?.message ?? `Stormglass request failed (${res.status})`;
    throw new Error(msg);
  }

  const hours: StormglassHour[] = Array.isArray(json?.hours) ? json.hours : [];
  if (!hours.length) throw new Error("Stormglass returned no hourly data.");
  return hours;
}

function pickNoaa(x: any): number | null {
  return num(x?.noaa);
}

function windFromHour(h: StormglassHour) {
  const mps = pickNoaa(h.windSpeed);
  const deg = pickNoaa(h.windDirection);
  return { wind_mph: mpsToMph(mps), wind_dir_deg: deg != null ? Math.round(deg) : null };
}

function waveFromHour(h: StormglassHour) {
  const waveM = pickNoaa(h.waveHeight) ?? pickNoaa(h.swellHeight);
  const periodS = pickNoaa(h.wavePeriod) ?? pickNoaa(h.swellPeriod);
  return { wave_ft: mToFt(waveM), period_s: periodS != null ? Math.round(periodS) : null };
}

/* ----------------- Open-Meteo temps only ----------------- */

async function fetchTemps3Day(lat: number, lon: number) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "3");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];

  const j = await res.json();

  const dTimes: string[] = j?.daily?.time ?? [];
  const tMaxC: any[] = j?.daily?.temperature_2m_max ?? [];
  const tMinC: any[] = j?.daily?.temperature_2m_min ?? [];

  return dTimes.map((d, i) => ({
    date: d,
    temp_max_f: cToF(num(tMaxC[i])),
    temp_min_f: cToF(num(tMinC[i])),
  }));
}

async function fetchTemps5Day(lat: number, lon: number) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "5");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];

  const j = await res.json();

  const dTimes: string[] = j?.daily?.time ?? [];
  const tMaxC: any[] = j?.daily?.temperature_2m_max ?? [];
  const tMinC: any[] = j?.daily?.temperature_2m_min ?? [];

  return dTimes.map((d, i) => ({
    date: d,
    temp_max_f: cToF(num(tMaxC[i])),
    temp_min_f: cToF(num(tMinC[i])),
  }));
}

/* ----------------- NY time labels for outlook window ----------------- */

const NY_TZ = "America/New_York";

function hourLabelNY(isoTime: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: NY_TZ,
      hour: "numeric",
    }).format(new Date(isoTime));
  } catch {
    return "—";
  }
}

/* ----------------- public API ----------------- */

export async function fetchToday(lat: number, lon: number): Promise<TodayData> {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  const hit = stormCache.get(cacheKey);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;

  let hours: StormglassHour[] = [];
  try {
    hours = await fetchStormglassPoint(lat, lon);
  } catch {
    return {
      updated: new Date().toISOString(),
      wind_mph: null,
      wind_dir_deg: null,
      wave_ft: null,
      period_s: null,
      hourly: [],
      forecast: [],
    };
  }

  const idx = pickCurrentHourIndex(hours);
  const nowHour = hours[idx] ?? hours[0];

  const nowWind = windFromHour(nowHour);
  const nowWave = waveFromHour(nowHour);

  const hourly = hours.slice(idx, idx + 48).map((h) => {
    const w = windFromHour(h);
    const ww = waveFromHour(h);
    return {
      time: h.time,
      wind_mph: w.wind_mph,
      wind_dir_deg: w.wind_dir_deg,
      wave_ft: ww.wave_ft,
      period_s: ww.period_s,
    };
  });

  const windMaxByDate = new Map<string, number>();
  for (const h of hourly) {
    const dk = dateKey(h.time);
    const mph = h.wind_mph;
    if (mph == null) continue;
    const prev = windMaxByDate.get(dk);
    if (prev == null || mph > prev) windMaxByDate.set(dk, mph);
  }

  const temps = await fetchTemps3Day(lat, lon);

  const forecast = temps.map((t) => ({
    date: t.date,
    wind_max_mph: windMaxByDate.get(t.date) ?? null,
    temp_max_f: t.temp_max_f,
    temp_min_f: t.temp_min_f,
  }));

  const data: TodayData = {
    updated: new Date().toISOString(),
    wind_mph: nowWind.wind_mph,
    wind_dir_deg: nowWind.wind_dir_deg,
    wave_ft: nowWave.wave_ft,
    period_s: nowWave.period_s,
    hourly,
    forecast,
  };

  stormCache.set(cacheKey, { ts: Date.now(), data });
  return data;
}

export async function fetchOutlook5d(
  lat: number,
  lon: number,
  beachFacingDeg: number
): Promise<OutlookDay[]> {
  let hours: StormglassHour[] = [];
  try {
    hours = await fetchStormglassPointCached(lat, lon);
  } catch {
    return [];
  }

  const byDate = new Map<string, StormglassHour[]>();
  for (const h of hours) {
    const dk = dateKey(h.time);
    if (!byDate.has(dk)) byDate.set(dk, []);
    byDate.get(dk)!.push(h);
  }

  const dates = Array.from(byDate.keys()).sort().slice(0, 5);

  const temps = await fetchTemps5Day(lat, lon);
  const tempsByDate = new Map(temps.map((t) => [t.date, t]));

  const out: OutlookDay[] = [];

  for (const d of dates) {
    const dayHours = (byDate.get(d) ?? [])
      .slice()
      .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));

    const points = dayHours.map((h) => {
      const w = windFromHour(h);
      const ww = waveFromHour(h);

      const bonus =
        w.wind_dir_deg != null ? windQuality(w.wind_dir_deg, beachFacingDeg)?.bonus ?? 0 : 0;

      const scored = scoreSurf10({
        windMph: w.wind_mph != null ? Math.round(w.wind_mph) : null,
        waveFt: ww.wave_ft,
        periodS: ww.period_s,
        windDirBonus: bonus,
      });

      return {
        time: h.time,
        score: typeof scored.score10 === "number" ? scored.score10 : null,
        wind_mph: w.wind_mph,
        wind_dir_deg: w.wind_dir_deg,
        wave_ft: ww.wave_ft,
        period_s: ww.period_s,
      };
    });

    let best: { i: number; avg: number } | null = null;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]?.score;
      const b = points[i + 1]?.score;
      if (typeof a !== "number" || typeof b !== "number") continue;

      const avg = (a + b) / 2;
      if (!best || avg > best.avg) best = { i, avg };
    }

    const bestScore = best ? best.avg : null;
    const bestStart = best ? points[best.i].time : null;
    const bestEnd = best ? points[best.i + 1].time : null;

    const bestLabel =
      bestStart && bestEnd ? `${hourLabelNY(bestStart)}–${hourLabelNY(bestEnd)}` : null;

    const rep = best ? points[best.i] : null;

    let windMax: number | null = null;
    for (const p of points) {
      if (p.wind_mph == null) continue;
      windMax = windMax == null ? p.wind_mph : Math.max(windMax, p.wind_mph);
    }

    const t = tempsByDate.get(d);

    out.push({
      date: d,
      score_best: bestScore != null ? Math.round(bestScore * 10) / 10 : null,
      best_window_label: bestLabel,
      wave_ft: rep?.wave_ft ?? null,
      period_s: rep?.period_s ?? null,
      wind_mph: rep?.wind_mph ?? null,
      wind_dir_deg: rep?.wind_dir_deg ?? null,
      wind_max_mph: windMax != null ? Math.round(windMax) : null,
      temp_max_f: t?.temp_max_f ?? null,
      temp_min_f: t?.temp_min_f ?? null,
    });
  }

  return out;
}

export async function fetchTideNOAA(station: string): Promise<TideData> {
  const url = new URL("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter");
  url.searchParams.set("product", "predictions");
  url.searchParams.set("application", "SurfSeer");
  url.searchParams.set("datum", "MLLW");
  url.searchParams.set("station", station);
  url.searchParams.set("time_zone", "lst_ldt");
  url.searchParams.set("units", "english");
  url.searchParams.set("interval", "hilo");
  url.searchParams.set("format", "json");

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const begin = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

  const endDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2);
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`;

  url.searchParams.set("begin_date", begin);
  url.searchParams.set("end_date", end);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return { station, tides: [] };

  const j = await res.json();

  const preds: any[] = j?.predictions ?? [];
  const tides = preds.slice(0, 6).map((p) => ({
    type: String(p?.type ?? ""),
    time: String(p?.t ?? ""),
    height: p?.v != null ? String(p.v) : undefined,
  }));

  return { station, tides };
}