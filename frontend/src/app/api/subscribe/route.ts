// src/app/api/subscribe/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { isSpotId } from "@/lib/spots";

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function thankYouHtml({
  siteUrl,
  spotUrl,
  unsubUrl,
}: {
  siteUrl: string;
  spotUrl: string;
  unsubUrl: string;
}) {
  return `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; line-height:1.5; color:#111; padding:16px;">
    <div style="max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:16px;padding:18px;">
      <div style="font-weight:900;font-size:18px;">You’re subscribed ✅</div>
      <div style="color:#6b7280;font-size:13px;margin-top:6px;">
        Thanks for joining SurfSeer. You’ll get one email per day with your surf report.
      </div>

      <a href="${spotUrl}" style="display:inline-block;margin-top:14px;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:12px;font-weight:800;font-size:14px;">
        View today’s report
      </a>

      <div style="margin-top:10px;">
        <a href="${siteUrl}" style="color:#111;text-decoration:underline;font-weight:700;">Open SurfSeer</a>
      </div>

      <div style="margin-top:14px;color:#6b7280;font-size:12px;">
        Unsubscribe anytime: <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
      </div>
    </div>
  </div>`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const rawSpot = String(body.spotId ?? "oc-inlet");

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: { message: "Invalid email" } }, { status: 400 });
    }

    const spotId = isSpotId(rawSpot) ? rawSpot : "oc-inlet";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const supabase = supabaseAdmin();

    // Try to find existing subscriber
    const existing = await supabase
      .from("subscribers")
      .select("email, unsub_token")
      .eq("email", email)
      .maybeSingle();

    let unsubToken = existing.data?.unsub_token as string | undefined;

    if (!unsubToken) {
      unsubToken = crypto.randomBytes(24).toString("hex");
    }

    // Upsert subscriber (reactivate + update spot)
    const { data, error } = await supabase
      .from("subscribers")
      .upsert(
        {
          email,
          spot_id: spotId,
          is_active: true,
          unsub_token: unsubToken,
        },
        { onConflict: "email" }
      )
      .select("email, spot_id, unsub_token")
      .single();

    if (error) throw new Error(error.message);

    // Send thank-you email
    const resend = new Resend(reqEnv("RESEND_API_KEY"));
    const from = reqEnv("FROM_EMAIL");

    const siteUrl = `${baseUrl}`;
    const spotUrl = `${baseUrl}/spot/${spotId}`;
    const unsubUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(data.unsub_token)}`;

    await resend.emails.send({
      from,
      to: email,
      subject: "Thanks for subscribing to SurfSeer ✅",
      html: thankYouHtml({ siteUrl, spotUrl, unsubUrl }),
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("SUBSCRIBE ERROR:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: { message: msg } }, { status: 500 });
  }
}