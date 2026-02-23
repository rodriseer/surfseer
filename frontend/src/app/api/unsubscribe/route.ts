// src/app/api/unsubscribe/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = String(searchParams.get("token") ?? "").trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: { message: "Missing token" } }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from("subscribers")
      .update({ is_active: false })
      .eq("unsub_token", token);

    if (error) throw new Error(error.message);

    // Simple redirect back to homepage
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/?unsubscribed=1`);
  } catch (e) {
    console.error("UNSUBSCRIBE ERROR:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: { message: msg } }, { status: 500 });
  }
}