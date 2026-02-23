export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabasePublic } from "@/lib/supabaseServer";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function env(name: string) {
  return process.env[name] ?? "";
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

    // 1) Save subscriber (public anon key + RLS insert policy)
    const supabase = supabasePublic();
    const { error } = await supabase
      .from("subscribers")
      .upsert({ email, spot_id: spotId }, { onConflict: "email" });

    if (error) {
      return NextResponse.json(
        { ok: false, error: { message: error.message } },
        { status: 500 }
      );
    }

    // 2) Notify YOU by email (optional; do not fail signup if this fails)
    const resendKey = env("RESEND_API_KEY");
    const notifyTo = env("NOTIFY_EMAIL");
    const from = env("FROM_EMAIL"); // e.g. "SurfSeer <onboarding@resend.dev>" or your verified sender

    if (resendKey && notifyTo && from) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from,
          to: notifyTo,
          subject: "New SurfSeer signup",
          text: `New signup: ${email}\nSpot: ${spotId}`,
        });
      } catch (e) {
        // Don't break the signup
        console.error("Signup notify email failed:", e);
      }
    }

    return NextResponse.json({ ok: true, data: { email, spotId } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: { message: msg } }, { status: 500 });
  }
}