import { NextResponse } from "next/server";
import { fetchTideNOAA } from "@/lib/surfData";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const station = searchParams.get("station");

  if (!station) {
    return NextResponse.json({ error: "Missing station" }, { status: 400 });
  }

  const data = await fetchTideNOAA(station);
  return NextResponse.json(data);
}