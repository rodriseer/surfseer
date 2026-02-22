import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; spotId?: string };
    const email = String(body.email ?? "").trim().toLowerCase();
    const spotId = String(body.spotId ?? "oc-inlet").trim();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: { message: "Please enter a valid email." } },
        { status: 400 }
      );
    }

    const supabase = supabaseServer();

    const { error } = await supabase
      .from("subscribers")
      .upsert({ email, spot_id: spotId }, { onConflict: "email" });

    if (error) {
      return NextResponse.json(
        { ok: false, error: { message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data: { email, spotId } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: { message: msg } }, { status: 500 });
  }
}