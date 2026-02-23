// src/lib/getForecast.ts
import { SPOTS, type SpotId } from "@/lib/spots";
import { getCachedForecastOrNull, setCachedForecast } from "@/lib/forecastCache";

// choose a TTL that fits your product
const DEFAULT_TTL_SECONDS = 20 * 60; // 20 minutes

export async function getForecastForSpot(spotId: SpotId) {
  const cached = await getCachedForecastOrNull(spotId);
  if (cached) return { data: cached, cached: true };

  const spot = SPOTS[spotId];

  // Replace this with your real Stormglass call / your existing fetchToday/fetchForecast
  const fresh = await fetchFromStormglass(spot.lat, spot.lon);

  await setCachedForecast(spotId, fresh, { ttlSeconds: DEFAULT_TTL_SECONDS });
  return { data: fresh, cached: false };
}

// ---- Example implementation (swap to match your existing surfData.ts) ----
async function fetchFromStormglass(lat: number, lon: number) {
  const key = process.env.STORMGLASS_API_KEY!;
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lon),
    params: ["waveHeight", "wavePeriod", "windSpeed", "windDirection"].join(","),
    // add whatever you already use
  });

  const url = `https://api.stormglass.io/v2/weather/point?${params.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: key },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Stormglass error ${res.status}: ${text}`);
  }

  return res.json();
}