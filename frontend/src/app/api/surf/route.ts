function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const lat = Number(searchParams.get("lat") ?? "38.3365");
  const lon = Number(searchParams.get("lon") ?? "-75.0849");

  const stormKey = process.env.STORMGLASS_API_KEY;
  const tideKey = process.env.WORLDTIDES_API_KEY;

  if (!stormKey) {
    return Response.json({ error: "Missing STORMGLASS_API_KEY" }, { status: 500 });
  }
  if (!tideKey) {
    return Response.json({ error: "Missing WORLDTIDES_API_KEY" }, { status: 500 });
  }

  // --- StormGlass: swell/period (basic)
  // We’ll fetch a short window around now; we’ll pick the closest hour.
  const now = new Date();
  const start = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // -2h
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();   // +2h

  const stormParams = [
    "waveHeight",
    "wavePeriod",
    "swellHeight",
    "swellPeriod",
  ].join(",");

  const stormUrl =
    `https://api.stormglass.io/v2/weather/point` +
    `?lat=${lat}&lng=${lon}` +
    `&params=${encodeURIComponent(stormParams)}` +
    `&start=${encodeURIComponent(start)}` +
    `&end=${encodeURIComponent(end)}`;

  // --- WorldTides: extremes (high/low)
  // Using extremes makes a clean “High 6:12 AM / Low 12:34 PM” display.
  const tideUrl =
    `https://www.worldtides.info/api/v3?extremes&lat=${lat}&lon=${lon}&key=${encodeURIComponent(tideKey)}`;

  try {
    const [stormRes, tideRes] = await Promise.all([
      fetch(stormUrl, { headers: { Authorization: stormKey }, next: { revalidate: 600 } }),
      fetch(tideUrl, { next: { revalidate: 600 } }),
    ]);

    if (!stormRes.ok) throw new Error(`StormGlass error: ${stormRes.status}`);
    if (!tideRes.ok) throw new Error(`WorldTides error: ${tideRes.status}`);

    const storm = await stormRes.json();
    const tides = await tideRes.json();

    // Pick closest hour in StormGlass response
    const hours: any[] = Array.isArray(storm?.hours) ? storm.hours : [];
    const nowMs = Date.now();
    let best = null as any;

    for (const h of hours) {
      const t = Date.parse(h?.time ?? "");
      if (!Number.isFinite(t)) continue;
      const d = Math.abs(t - nowMs);
      if (!best || d < best._d) best = { ...h, _d: d };
    }

    const waveHeight = best?.waveHeight?.sg ?? best?.waveHeight?.noaa ?? null;
    const wavePeriod = best?.wavePeriod?.sg ?? best?.wavePeriod?.noaa ?? null;

    // WorldTides extremes
    const extremes: any[] = Array.isArray(tides?.extremes) ? tides.extremes : [];
    // Keep next 4 upcoming extremes
    const upcoming = extremes
      .map((e) => ({
        type: e.type ?? null, // "High" / "Low"
        time: e.date ?? e.dt ?? null, // their API varies slightly by version
        height: e.height ?? null,
      }))
      .filter((e) => e.time)
      .slice(0, 4);

    return Response.json({
      lat,
      lon,
      swell: {
        wave_height_m: waveHeight,
        wave_period_s: wavePeriod,
      },
      tide: {
        extremes: upcoming,
      },
    });
  } catch (e: any) {
    return Response.json(
      { error: "Failed to fetch surf data", details: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}