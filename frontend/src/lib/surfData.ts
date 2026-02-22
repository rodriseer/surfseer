// frontend/src/lib/surfData.ts

export type TodayData = {
  updated: string;
  wind_mph: number | null;
  wind_dir_deg: number | null;
  hourly: Array<{ time: string; wind_mph: number | null; wind_dir_deg: number | null }>;
  forecast: Array<{ date: string; wind_max_mph: number | null; temp_max_f: number | null; temp_min_f: number | null }>;
};

export type TideData = {
  station: string;
  tides: Array<{ type: string; time: string; height?: string }>;
};

export type BuoyData = {
  station: string;
  wave_height_m: number | null;
  dominant_period_s: number | null;
  average_period_s: number | null;
};

function num(x: any): number | null {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : null;
}

function cToF(c: number | null) {
  return c == null ? null : (c * 9) / 5 + 32;
}

export async function fetchToday(lat: number, lon: number): Promise<TodayData> {
  // Open-Meteo (free, no key)
  // We’ll use:
  // - hourly: wind speed + wind direction
  // - daily: max wind + max/min temp (quick 3-day cards)
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("hourly", "windspeed_10m,winddirection_10m");
  url.searchParams.set("daily", "windspeed_10m_max,temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "3");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    return {
      updated: new Date().toISOString(),
      wind_mph: null,
      wind_dir_deg: null,
      hourly: [],
      forecast: [],
    };
  }

  const j = await res.json();

  const times: string[] = j?.hourly?.time ?? [];
  const wsKmh: any[] = j?.hourly?.windspeed_10m ?? [];
  const wd: any[] = j?.hourly?.winddirection_10m ?? [];

  const hourly = times.slice(0, 48).map((t, i) => {
    const kmh = num(wsKmh[i]);
    const mph = kmh == null ? null : kmh * 0.621371;
    return {
      time: t,
      wind_mph: mph == null ? null : Number(mph.toFixed(2)),
      wind_dir_deg: num(wd[i]),
    };
  });

  // “current” = first hour returned (good enough)
  const wind_mph = hourly[0]?.wind_mph ?? null;
  const wind_dir_deg = hourly[0]?.wind_dir_deg ?? null;

  const dTimes: string[] = j?.daily?.time ?? [];
  const windMaxKmh: any[] = j?.daily?.windspeed_10m_max ?? [];
  const tMaxC: any[] = j?.daily?.temperature_2m_max ?? [];
  const tMinC: any[] = j?.daily?.temperature_2m_min ?? [];

  const forecast = dTimes.map((d, i) => {
    const kmh = num(windMaxKmh[i]);
    const mph = kmh == null ? null : kmh * 0.621371;
    return {
      date: d,
      wind_max_mph: mph == null ? null : Number(mph.toFixed(2)),
      temp_max_f: cToF(num(tMaxC[i])),
      temp_min_f: cToF(num(tMinC[i])),
    };
  });

  return {
    updated: new Date().toISOString(),
    wind_mph,
    wind_dir_deg,
    hourly,
    forecast,
  };
}

export async function fetchTideNOAA(station: string): Promise<TideData> {
  // NOAA CO-OPS “predictions” endpoint
  // Using product=predictions, interval=hilo for high/low tides
  const url = new URL("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter");
  url.searchParams.set("product", "predictions");
  url.searchParams.set("application", "SurfSeer");
  url.searchParams.set("begin_date", "latest"); // NOAA accepts "latest" in some contexts; if it fails, we still return empty
  url.searchParams.set("datum", "MLLW");
  url.searchParams.set("station", station);
  url.searchParams.set("time_zone", "lst_ldt");
  url.searchParams.set("units", "english");
  url.searchParams.set("interval", "hilo");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    return { station, tides: [] };
  }

  const j = await res.json();

  // NOAA json shape: predictions: [{ t: "...", v:"...", type:"H"|"L" }]
  const preds: any[] = j?.predictions ?? [];
  const tides = preds.slice(0, 6).map((p) => ({
    type: String(p?.type ?? ""),
    time: String(p?.t ?? ""),
    height: p?.v != null ? String(p.v) : undefined,
  }));

  return { station, tides };
}

export async function fetchBuoyNDBC(station: string): Promise<BuoyData> {
  // NDBC latest obs: https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt
  // This is a text table. We’ll parse the station row.
  const url = "https://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt";
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    return { station, wave_height_m: null, dominant_period_s: null, average_period_s: null };
  }

  const text = await res.text();
  const lines = text.split("\n").filter(Boolean);

  // Find the station row (first token is station id)
  const row = lines.find((ln) => ln.trim().startsWith(station + " "));
  if (!row) {
    return { station, wave_height_m: null, dominant_period_s: null, average_period_s: null };
  }

  // Columns vary slightly, but typical latest_obs has:
  // ID ... WVHT (m) DPD (s) APD (s)
  // We’ll locate by header line.
  const header = lines.find((ln) => ln.includes("WVHT") && ln.includes("DPD"));
  if (!header) {
    return { station, wave_height_m: null, dominant_period_s: null, average_period_s: null };
  }

  const hCols = header.trim().split(/\s+/);
  const rCols = row.trim().split(/\s+/);

  const idxWVHT = hCols.indexOf("WVHT");
  const idxDPD = hCols.indexOf("DPD");
  const idxAPD = hCols.indexOf("APD");

  const wave_height_m = idxWVHT >= 0 ? num(rCols[idxWVHT]) : null;
  const dominant_period_s = idxDPD >= 0 ? num(rCols[idxDPD]) : null;
  const average_period_s = idxAPD >= 0 ? num(rCols[idxAPD]) : null;

  return { station, wave_height_m, dominant_period_s, average_period_s };
}