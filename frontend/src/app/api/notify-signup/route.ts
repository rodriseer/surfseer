export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Resend } from "resend";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} env var`);
  return v;
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing email" },
        { status: 400 }
      );
    }

    const resend = new Resend(requiredEnv("RESEND_API_KEY"));
    const notifyTo = requiredEnv("NOTIFY_EMAIL");

    const { data, error } = await resend.emails.send({
      from: "SurfSeer <onboarding@resend.dev>",
      to: notifyTo,
      subject: "🌊 New SurfSeer Signup",
      text: `New signup from: ${email}`,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}