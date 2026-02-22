export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const lat = Number(searchParams.get("lat") ?? "38.3365");
  const lon = Number(searchParams.get("lon") ?? "-75.0849");

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=wind_speed_10m,wind_direction_10m,temperature_2m` +
    `&hourly=wind_speed_10m,wind_direction_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,wind_direction_10m_dominant` +
    `&forecast_days=3` +
    `&timezone=America/New_York` +
    `&wind_speed_unit=mph` +
    `&temperature_unit=fahrenheit`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

    const data = await res.json();
    const cur = data.current;
    const d = data.daily;
    const h = data.hourly;

    const forecast =
      d?.time?.map((t: string, i: number) => ({
        date: t,
        wind_max_mph: d.wind_speed_10m_max?.[i] ?? null,
        wind_dir_deg: d.wind_direction_10m_dominant?.[i] ?? null,
        temp_max_f: d.temperature_2m_max?.[i] ?? null,
        temp_min_f: d.temperature_2m_min?.[i] ?? null,
      })) ?? [];

    const hourly =
      h?.time?.map((t: string, i: number) => ({
        time: t,
        wind_mph: h.wind_speed_10m?.[i] ?? null,
        wind_dir_deg: h.wind_direction_10m?.[i] ?? null,
      })) ?? [];

    return Response.json({
      updated: cur?.time ?? null,
      wind_mph: cur?.wind_speed_10m ?? null,
      wind_dir_deg: cur?.wind_direction_10m ?? null,
      air_f: cur?.temperature_2m ?? null,
      forecast,
      hourly,
    });
  } catch (e: any) {
    return Response.json(
      { error: "Failed to fetch today data", details: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}