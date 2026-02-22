export type StormglassPoint = {
  time: string;
  windSpeed?: { noaa?: number };
  windDirection?: { noaa?: number };
  swellHeight?: { noaa?: number };
  swellPeriod?: { noaa?: number };
  swellDirection?: { noaa?: number };
  waveHeight?: { noaa?: number };
  wavePeriod?: { noaa?: number };
  waveDirection?: { noaa?: number };
  waterTemperature?: { noaa?: number };
};

export async function fetchStormglass({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}) {
  const key = process.env.STORMGLASS_API_KEY;
  if (!key) {
    throw new Error("Missing STORMGLASS_API_KEY (set it in .env.local and Vercel env vars).");
  }

  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lon),
    params: [
      "windSpeed",
      "windDirection",
      "swellHeight",
      "swellPeriod",
      "swellDirection",
      "waveHeight",
      "wavePeriod",
      "waveDirection",
      "waterTemperature",
    ].join(","),
    source: "noaa",
  });

  const url = `https://api.stormglass.io/v2/weather/point?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: key },
    // No-store ensures your own cache controls freshness (not Next fetch cache)
    cache: "no-store",
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const msg =
      json?.errors?.[0]?.message ??
      json?.message ??
      `Stormglass request failed (${res.status})`;

    // Make common statuses obvious
    if (res.status === 401) throw new Error(`Stormglass 401: Invalid API key. (${msg})`);
    if (res.status === 429) throw new Error(`Stormglass 429: Rate limited. (${msg})`);
    throw new Error(msg);
  }

  const hours: StormglassPoint[] = Array.isArray(json?.hours) ? json.hours : [];
  if (!hours.length) throw new Error("Stormglass returned no hourly data.");

  return { hours };
}