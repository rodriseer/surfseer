import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseServer } from "@/lib/supabaseServer";
import { fetchToday, fetchTideNOAA } from "@/lib/surfData";
import { scoreSurf10, windQuality, degToCompass } from "@/lib/surfScore";

const NOAA_TIDE_STATION = "8570283";

const SPOTS = [
  { id: "oc-inlet", name: "Ocean City (Inlet)", lat: 38.3287, lon: -75.0913, beachFacingDeg: 90 },
  { id: "oc-north", name: "Ocean City (Northside)", lat: 38.4066, lon: -75.057, beachFacingDeg: 85 },
  { id: "assateague", name: "Assateague", lat: 38.0534, lon: -75.2443, beachFacingDeg: 110 },
] as const;

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
  windDirLabel,
  windQual,
  tideLabel,
  updated,
  siteUrl,
}: {
  spotName: string;
  score: number | null;
  status: string;
  waveFt: number | null;
  periodS: number | null;
  windMph: number | null;
  windDirLabel: string | null;
  windQual: string | null;
  tideLabel: string;
  updated: string;
  siteUrl: string;
}) {
  const safe = (x: any) => (x == null || x === "" ? "—" : String(x));
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
            ${safe(windQual)}${windDirLabel ? " • " + windDirLabel : ""}
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
        You’re receiving this because you subscribed on SurfSeer. (Unsubscribe coming soon.)
      </div>
    </div>
  </div>`;
}

export async function POST(req: Request) {
  try {
    // simple protection so nobody spams your endpoint
    const token = req.headers.get("x-admin-token") ?? "";
    const adminToken = process.env.ADMIN_SEND_TOKEN ?? "";
    if (adminToken && token !== adminToken) {
      return NextResponse.json({ ok: false, error: { message: "Unauthorized" } }, { status: 401 });
    }

    const resend = new Resend(reqEnv("RESEND_API_KEY"));
    const from = reqEnv("FROM_EMAIL");

    const supabase = supabaseServer();

    // get subscribers (limit for safety)
    const { data: subs, error } = await supabase
      .from("subscribers")
      .select("email, spot_id")
      .limit(2000);

    if (error) throw new Error(error.message);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

    // group by spot_id so we fetch each spot once
    const bySpot = new Map<string, string[]>();
    for (const s of subs ?? []) {
      const spotId = String((s as any).spot_id ?? "oc-inlet");
      const email = String((s as any).email ?? "");
      if (!email) continue;
      const arr = bySpot.get(spotId) ?? [];
      arr.push(email);
      bySpot.set(spotId, arr);
    }

    let sent = 0;

    for (const [spotId, emails] of bySpot.entries()) {
      const spot = SPOTS.find((x) => x.id === spotId) ?? SPOTS[0];

      const [today, tide] = await Promise.all([
        fetchToday(spot.lat, spot.lon),
        fetchTideNOAA(NOAA_TIDE_STATION),
      ]);

      const windMph =
        today?.wind_mph != null && Number.isFinite(today.wind_mph) ? today.wind_mph : null;

      const windDeg =
        today?.wind_dir_deg != null && Number.isFinite(today.wind_dir_deg) ? today.wind_dir_deg : null;

      const waveFt = today?.wave_ft ?? null;
      const periodS = today?.period_s ?? null;

      const wq = windDeg != null ? windQuality(windDeg, spot.beachFacingDeg) : null;
      const scored = scoreSurf10({
        windMph: windMph != null ? Math.round(windMph) : null,
        waveFt,
        periodS,
        windDirBonus: wq?.bonus ?? 0,
      });

      const tidesArr: Array<{ type: string; time: string }> = Array.isArray(tide?.tides) ? tide.tides : [];
      const next = tidesArr[0];
      const tideLabel =
        next?.type && next?.time ? `${tideTypeLabel(next.type)} ${formatTime(next.time)}` : "—";

      const html = emailHtml({
        spotName: spot.name,
        score: scored.score10,
        status: scored.status,
        waveFt,
        periodS,
        windMph,
        windDirLabel: windDeg != null ? `${degToCompass(Math.round(windDeg))} (${Math.round(windDeg)}°)` : null,
        windQual: wq?.label ?? null,
        tideLabel,
        updated: today?.updated ? formatTime(today.updated) : "—",
        siteUrl: `${siteUrl}/spot/${spot.id}`,
      });

      // send individually (simple + reliable)
      for (const to of emails) {
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
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: { message: msg } }, { status: 500 });
  }
}