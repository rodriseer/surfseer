// src/app/api/send-daily/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { SPOTS, isSpotId } from "@/lib/spots";
import { fetchTideNOAA } from "@/lib/surfData"; // keep if you already have this

const NOAA_TIDE_STATION = "8570283";

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function formatTime(s: string) {
  try {
    return new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function tideTypeLabel(t: string) {
  if (t === "H") return "High";
  if (t === "L") return "Low";
  return t || "—";
}

function subjectLine(spotName: string) {
  const d = new Date();
  const date = d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return `SurfSeer Daily: ${spotName} • ${date}`;
}

function emailHtml({
  spotName,
  score,
  status,
  waveFt,
  periodS,
  windMph,
  windDirDeg,
  tideLabel,
  updated,
  siteUrl,
  unsubUrl,
}: {
  spotName: string;
  score: number | null;
  status: string;
  waveFt: number | null;
  periodS: number | null;
  windMph: number | null;
  windDirDeg: number | null;
  tideLabel: string;
  updated: string;
  siteUrl: string;
  unsubUrl: string;
}) {
  const safe = (x: any) => (x == null || x === "" ? "—" : String(x));

  const windDirLabel =
    windDirDeg != null && Number.isFinite(windDirDeg)
      ? `${Math.round(windDirDeg)}°`
      : null;

  return `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; line-height:1.5; color:#111; padding:16px;">
    <div style="max-width:560px;margin:0 auto;border:1px solid #e5e7eb;border-radius:16px;padding:18px;">
      <div style="font-weight:800;font-size:18px;">SurfSeer Daily</div>
      <div style="color:#6b7280;font-size:13px;margin-top:4px;">${spotName} • Updated ${updated}</div>

      <div style="margin-top:14px; display:flex; gap:12px; align-items:baseline;">
        <div style="font-size:34px;font-weight:900;">${score != null ? score.toFixed(1) : "—"}</div>
        <div style="font-weight:800;">${safe(status)}</div>
      </div>

      <div style="margin-top:14px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
          <div style="color:#6b7280;font-size:12px;font-weight:700;">Swell</div>
          <div style="font-size:18px;font-weight:900;margin-top:2px;">${waveFt != null ? waveFt.toFixed(1) + " ft" : "—"}</div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
          <div style="color:#6b7280;font-size:12px;font-weight:700;">Period</div>
          <div style="font-size:18px;font-weight:900;margin-top:2px;">${periodS != null ? Math.round(periodS) + "s" : "—"}</div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
          <div style="color:#6b7280;font-size:12px;font-weight:700;">Wind</div>
          <div style="font-size:18px;font-weight:900;margin-top:2px;">${windMph != null ? Math.round(windMph) + " mph" : "—"}</div>
          <div style="color:#6b7280;font-size:12px;margin-top:2px;">
            ${windDirLabel ? "Dir " + windDirLabel : "—"}
          </div>
        </div>
        <div style="border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
          <div style="color:#6b7280;font-size:12px;font-weight:700;">Tide</div>
          <div style="font-size:18px;font-weight:900;margin-top:2px;">${safe(tideLabel)}</div>
        </div>
      </div>

      <a href="${siteUrl}" style="display:inline-block;margin-top:14px;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:12px;font-weight:800;font-size:14px;">
        View full report
      </a>

      <div style="margin-top:14px;color:#6b7280;font-size:12px;">
        You’re receiving this because you subscribed on SurfSeer.
        <a href="${unsubUrl}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
      </div>
    </div>
  </div>`;
}

async function fetchCachedForecast(baseUrl: string, spotId: string) {
  const url = `${baseUrl}/api/forecast?spot=${encodeURIComponent(spotId)}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json().catch(() => null);
  if (!json?.ok) throw new Error(`Forecast API failed for ${spotId}`);
  return json.data;
}

export async function POST(req: Request) {
  try {
    // Protect endpoint (so randoms can’t blast emails)
    const token = req.headers.get("x-admin-token") ?? "";
    const adminToken = process.env.ADMIN_SEND_TOKEN ?? "";
    if (adminToken && token !== adminToken) {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const resend = new Resend(reqEnv("RESEND_API_KEY"));
    const from = reqEnv("FROM_EMAIL");
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    const supabase = supabaseAdmin();

    const { data: subs, error } = await supabase
      .from("subscribers")
      .select("email, spot_id, unsub_token, is_active")
      .eq("is_active", true)
      .limit(2000);

    if (error) throw new Error(error.message);

    // Fetch tide once per run (same for all spots)
    const tide = await fetchTideNOAA(NOAA_TIDE_STATION);

    // Group recipients by spot_id so we fetch forecast once per spot
    const bySpot = new Map<string, Array<{ email: string; unsub_token: string }>>();
    for (const s of subs ?? []) {
      const spotId = String((s as any).spot_id ?? "oc-inlet");
      const email = String((s as any).email ?? "").trim().toLowerCase();
      const unsub_token = String((s as any).unsub_token ?? "");

      if (!email || !unsub_token) continue;

      const arr = bySpot.get(spotId) ?? [];
      arr.push({ email, unsub_token });
      bySpot.set(spotId, arr);
    }

    let sent = 0;

    for (const [rawSpotId, recipients] of bySpot.entries()) {
      const spotId = isSpotId(rawSpotId) ? rawSpotId : "oc-inlet";
      const spot = SPOTS[spotId];

      // Pull from cached endpoint (this avoids burning Stormglass)
      const forecast = await fetchCachedForecast(baseUrl, spot.id);

      const now = forecast?.now ?? {};
      const score = typeof now.score10 === "number" ? now.score10 : null;
      const status = String(now.status ?? "—");
      const waveFt = typeof now.waveHeightFt === "number" ? now.waveHeightFt : null;
      const periodS = typeof now.wavePeriodS === "number" ? now.wavePeriodS : null;
      const windMph = typeof now.windMph === "number" ? now.windMph : null;
      const windDirDeg = typeof now.windDirDeg === "number" ? now.windDirDeg : null;

      const tidesArr: Array<{ type: string; time: string }> = Array.isArray(tide?.tides)
        ? tide.tides
        : [];
      const next = tidesArr[0];
      const tideLabel =
        next?.type && next?.time ? `${tideTypeLabel(next.type)} ${formatTime(next.time)}` : "—";

      const updatedISO = String(forecast?.fetchedAtISO ?? forecast?.updatedAtISO ?? "");
      const updated = updatedISO ? formatTime(updatedISO) : "—";

      for (const { email: to, unsub_token } of recipients) {
        const unsubUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(unsub_token)}`;

        const html = emailHtml({
          spotName: spot.name,
          score,
          status,
          waveFt,
          periodS,
          windMph,
          windDirDeg,
          tideLabel,
          updated,
          siteUrl: `${baseUrl}/spot/${spot.id}`,
          unsubUrl,
        });

        await resend.emails.send({
          from,
          to,
          subject: subjectLine(spot.name),
          html,
        });

        sent++;
      }
    }

    return NextResponse.json({ ok: true, data: { sent } });
  } catch (e) {
    console.error("SEND-DAILY ERROR:", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: { message: msg } }, { status: 500 });
  }
}