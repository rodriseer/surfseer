export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const station = (searchParams.get("station") ?? "44009").trim();

  // NDBC realtime text feed (free)
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${station}.txt`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
    if (!res.ok) throw new Error(`NDBC error: ${res.status}`);

    const text = await res.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // First non-empty line = headers (starts with '#')
    // Second non-empty line = latest observation values
    const headerLine = lines.find((l) => l.startsWith("#"));
    if (!headerLine) throw new Error("No header line found");

    const headers = headerLine.replace(/^#\s*/, "").split(/\s+/);
    const dataLine = lines.find((l) => !l.startsWith("#"));
    if (!dataLine) throw new Error("No data line found");

    const values = dataLine.split(/\s+/);

    const idx = (name: string) => headers.indexOf(name);
    const get = (name: string) => {
      const i = idx(name);
      if (i < 0) return null;
      const v = values[i];
      if (!v || v === "MM") return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // Common NDBC wave fields:
    // WVHT = significant wave height (m)
    // DPD  = dominant period (s)
    // APD  = average period (s)
    const wave_height_m = get("WVHT");
    const dominant_period_s = get("DPD");
    const average_period_s = get("APD");

    // timestamp fields in the table:
    const YY = get("YY");
    const MM = get("MM");
    const DD = get("DD");
    const hh = get("hh");
    const mm = get("mm");

    // build an ISO-ish UTC time if available (NDBC feeds are typically GMT)
    let time_utc: string | null = null;
    if (YY != null && MM != null && DD != null && hh != null && mm != null) {
      const yyyy = 2000 + YY; // NDBC YY is usually 2-digit
      const pad = (x: number) => String(x).padStart(2, "0");
      time_utc = `${yyyy}-${pad(MM)}-${pad(DD)}T${pad(hh)}:${pad(mm)}:00Z`;
    }

    return Response.json({
      station,
      time_utc,
      wave_height_m,
      dominant_period_s,
      average_period_s,
    });
  } catch (e: any) {
    return Response.json(
      { error: "Failed to fetch buoy data", details: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}