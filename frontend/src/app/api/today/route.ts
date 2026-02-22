import { NextResponse } from "next/server";
import { fetchToday } from "@/lib/surfData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Missing/invalid lat/lon" }, { status: 400 });
  }

  const data = await fetchToday(lat, lon);
  return NextResponse.json(data);
}