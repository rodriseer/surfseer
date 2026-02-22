export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  // NOAA tide stations (you can expand this later per spot)
  // Ocean City Inlet station commonly used: 8570283 (Ocean City Inlet, MD)
  const station = searchParams.get("station") ?? "8570283";

  // Get today's date range in YYYYMMDD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const date = `${yyyy}${mm}${dd}`;

  const url =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
    `?product=predictions&application=surfseer` +
    `&begin_date=${date}&end_date=${date}` +
    `&datum=MLLW&station=${station}` +
    `&time_zone=lst_ldt&units=english&interval=hilo&format=json`;

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`NOAA error: ${res.status}`);

    const data = await res.json();
    const preds: any[] = Array.isArray(data?.predictions) ? data.predictions : [];

    // Return next 4 tide events (high/low)
    const upcoming = preds.slice(0, 4).map((p) => ({
      type: p.type, // "H" or "L"
      time: p.t,
      height: p.v,
    }));

    return Response.json({ station, tides: upcoming });
  } catch (e: any) {
    return Response.json(
      { error: "Failed to fetch tide data", details: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}