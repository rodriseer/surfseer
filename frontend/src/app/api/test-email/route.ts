export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const from = process.env.FROM_EMAIL!;
    const to = "rodrigo16seer@gmail.com";

    const result = await resend.emails.send({
      from,
      to,
      subject: "SurfSeer test email ✅",
      html: "<p>If you got this, Resend is working.</p>",
    });

    return NextResponse.json({ ok: true, from, to, result });
  } catch (e) {
    const msg = e instanceof Error ? (e.stack ?? e.message) : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}