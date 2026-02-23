// src/app/api/unsubscribe/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = String(searchParams.get("token") ?? "").trim();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: { message: "Missing token" } },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("subscribers")
      .update({ is_active: false })
      .eq("unsub_token", token)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!data) {
      return NextResponse.json(
        { ok: false, error: { message: "Invalid token" } },
        { status: 404 }
      );
    }

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
    return NextResponse.redirect(`${baseUrl}/?unsubscribed=1`);
  } catch (e) {
    console.error("UNSUBSCRIBE ERROR:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: { message: msg } }, { status: 500 });
  }
}