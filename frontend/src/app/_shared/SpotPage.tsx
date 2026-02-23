// app/_shared/SpotPage.tsx
import Image from "next/image";
import SpotPicker from "@/components/SpotPicker";
import ShareButton from "@/components/ShareButton";
import SubscribeBox from "@/components/SubscribeBox";
import HourlyChart from "@/components/HourlyChart";
import CopyReportButton from "@/components/CopyReportButton";

import WetsuitPanel from "@/components/WetsuitPanel";
import SpotNotesPanel from "@/components/SpotNotesPanel";

import { fetchToday, fetchTideNOAA, fetchOutlook5d } from "@/lib/surfData";
import { bestWindow2h, degToCompass, scoreSurf10, windQuality } from "@/lib/surfScore";
import { SPOTS, type SpotId } from "@/lib/spots";

const NOAA_TIDE_STATION = "8570283";

/* ---------- formatting helpers ---------- */

function formatTime(s: string) {
  try {
    return new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function formatHourLabel(s: string) {
  try {
    return new Date(s).toLocaleTimeString([], { hour: "numeric" });
  } catch {
    return "—";
  }
}

function tideTypeLabel(t: string) {
  if (t === "H") return "High";
  if (t === "L") return "Low";
  return t || "—";
}

function Divider() {
  return <div className="my-7 h-px w-full bg-white/10" />;
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="glass soft-shadow uplift rounded-2xl p-4">
      <p className="text-xs font-semibold text-white/70">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/60">{sub}</p>
    </div>
  );
}

/* ---------- best-window helper (by score) ---------- */

function best2hByScore(points: Array<{ time: string; score: number | null }>) {
  let best: { start: string; end: string; avg: number } | null = null;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]?.score;
    const b = points[i + 1]?.score;
    if (typeof a !== "number" || typeof b !== "number") continue;

    const avg = (a + b) / 2;
    if (!best || avg > best.avg) {
      best = { start: points[i].time, end: points[i + 1].time, avg };
    }
  }

  return best;
}

/* ---------- component ---------- */

export default async function SpotPage({ spotId }: { spotId: SpotId }) {
  const fallbackKey = Object.keys(SPOTS)[0] as SpotId;
  const selected = SPOTS[spotId] ?? SPOTS[fallbackKey];

  const [today, tide, outlook] = await Promise.all([
    fetchToday(selected.lat, selected.lon),
    fetchTideNOAA(NOAA_TIDE_STATION),
    fetchOutlook5d(selected.lat, selected.lon, selected.beachFacingDeg),
  ]);

  const windMph =
    today?.wind_mph != null && Number.isFinite(today.wind_mph) ? Math.round(today.wind_mph) : null;

  const windDeg =
    today?.wind_dir_deg != null && Number.isFinite(today.wind_dir_deg)
      ? Math.round(today.wind_dir_deg)
      : null;

  const windDir = windDeg != null ? degToCompass(windDeg) : null;
  const updated = today?.updated ? formatTime(today.updated) : "—";

  const tides: Array<{ type: string; time: string; height?: string }> = Array.isArray(tide?.tides)
    ? tide.tides
    : [];

  const next = tides.length > 0 ? tides[0] : null;
  const nextTideLabel =
    next?.type && next?.time ? `${tideTypeLabel(next.type)} ${formatTime(next.time)}` : "—";

  const waveFt = today?.wave_ft ?? null;
  const periodS = today?.period_s ?? null;

  const wq = windDeg != null ? windQuality(windDeg, selected.beachFacingDeg) : null;

  const scored = scoreSurf10({
    windMph,
    waveFt,
    periodS,
    windDirBonus: wq?.bonus ?? 0,
  });

  const beginner =
    waveFt != null &&
    windMph != null &&
    periodS != null &&
    waveFt >= 1.0 &&
    waveFt <= 3.5 &&
    windMph <= 15 &&
    periodS >= 6;

  const pill =
    scored.score10 == null
      ? "bg-white/10 text-white/80 border border-white/10"
      : scored.score10 >= 8
        ? "bg-emerald-500/15 text-emerald-100 border border-emerald-400/20"
        : scored.score10 >= 6
          ? "bg-sky-500/15 text-sky-100 border border-sky-400/20"
          : scored.score10 >= 4
            ? "bg-amber-500/15 text-amber-100 border border-amber-400/20"
            : "bg-rose-500/15 text-rose-100 border border-rose-400/20";

  const surf = { score: scored.score10, status: scored.status, pill, take: scored.take };

  const hourly: Array<{
    time: string;
    wind_mph: number | null;
    wind_dir_deg: number | null;
    wave_ft: number | null;
    period_s: number | null;
  }> = Array.isArray(today?.hourly) ? today.hourly : [];

  // Existing wind-only window (kept as fallback)
  const window2hRaw = bestWindow2h({
    hourly: hourly.map((h) => ({
      time: h.time,
      windMph: h.wind_mph,
      windDirDeg: h.wind_dir_deg,
    })),
    waveFt,
    periodS,
    beachFacingDeg: selected.beachFacingDeg,
  });

  const window2h = window2hRaw
    ? {
        ...window2hRaw,
        label: `${formatHourLabel(window2hRaw.start)}–${formatHourLabel(window2hRaw.end)}`,
      }
    : null;

  const chartData = hourly.slice(0, 12).map((h) => {
    const hmph =
      h.wind_mph != null && Number.isFinite(h.wind_mph) ? Math.round(h.wind_mph) : null;

    const hdeg =
      h.wind_dir_deg != null && Number.isFinite(h.wind_dir_deg) ? Math.round(h.wind_dir_deg) : null;

    const hwave = h.wave_ft ?? waveFt ?? null;
    const hperiod = h.period_s ?? periodS ?? null;

    const hq = hdeg != null ? windQuality(hdeg, selected.beachFacingDeg) : null;

    const hscored = scoreSurf10({
      windMph: hmph,
      waveFt: hwave,
      periodS: hperiod,
      windDirBonus: hq?.bonus ?? 0,
    });

    return {
      time: h.time,
      waveHeightFt: h.wave_ft,
      score: typeof hscored.score10 === "number" ? hscored.score10 : null,
    };
  });

  const bestScoreWindow = best2hByScore(chartData.map((p) => ({ time: p.time, score: p.score })));

  const bestScoreWindowLabel = bestScoreWindow
    ? `${formatHourLabel(bestScoreWindow.start)}–${formatHourLabel(bestScoreWindow.end)}`
    : null;

  return (
    <div className="min-h-screen bg-transparent text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="SurfSeer logo"
              width={36}
              height={36}
              priority
              className="rounded-lg"
            />
            <div className="leading-tight">
              <p className="text-base font-extrabold tracking-wide bg-gradient-to-r from-cyan-200 to-white/70 bg-clip-text text-transparent">
                SurfSeer
              </p>
              <p className="text-xs text-white/60">{selected.name}</p>
            </div>
          </div>

          <div className="hidden md:block">
            <SpotPicker />
          </div>

          <a
            href="#today"
            className="uplift rounded-2xl border border-cyan-300/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 glass hover:bg-cyan-500/15 transition"
          >
            Check now
          </a>
        </div>

        <div className="border-t border-white/10 bg-black/20 px-6 py-3 backdrop-blur md:hidden">
          <SpotPicker />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <section id="today" className="glass soft-shadow rounded-3xl p-8 sm:p-10 fade-in">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white/70">Selected spot</p>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="text-2xl font-extrabold">{selected.name}</p>

                <span className={`uplift rounded-full px-2.5 py-1 text-xs font-bold ${surf.pill}`}>
                  {surf.status}
                </span>

                {beginner ? (
                  <span className="uplift rounded-full px-2.5 py-1 text-xs font-bold bg-white/10 text-white/80 border border-white/10">
                    Beginner-friendly
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-300 animate-pulse" />
                <p className="text-sm text-white/60">Updated: {updated}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold text-white/70">Surf score</p>
              <div className="relative inline-block">
                <div className="absolute inset-0 -z-10 blur-2xl opacity-35 bg-cyan-400/25 rounded-full" />
                <p className="mt-1 text-4xl sm:text-5xl font-extrabold tracking-tight text-cyan-100">
                  {surf.score != null ? surf.score.toFixed(1) : "—"}
                </p>
              </div>
              <p className="text-xs text-white/60">out of 10</p>
            </div>
          </div>

          <Divider />

          <div className="grid grid-cols-2 gap-3">
            <Metric
              label="Swell"
              value={waveFt != null ? `${waveFt.toFixed(1)} ft` : "—"}
              sub="Stormglass (NOAA)"
            />
            <Metric
              label="Period"
              value={periodS != null ? `${periodS}s` : "—"}
              sub="Stormglass (NOAA)"
            />
            <Metric
              label="Wind"
              value={windMph != null ? `${windMph} mph` : "—"}
              sub={
                windDir != null && windDeg != null && wq
                  ? `${wq.label} • ${windDir} (${windDeg}°)`
                  : "—"
              }
            />
            <Metric label="Tide" value={nextTideLabel} sub="NOAA predictions" />
          </div>

          <Divider />

          <div className="glass soft-shadow rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Best window</p>
              <span className="text-xs font-semibold text-white/70">
                {bestScoreWindowLabel ?? window2h?.label ?? "—"}
              </span>
            </div>

            <p className="mt-2 text-sm leading-6 text-white/70">
              {bestScoreWindow
                ? `Top 2-hour surf window today based on wave + period + wind. Avg score: ${bestScoreWindow.avg.toFixed(
                    1
                  )}/10.`
                : window2h
                  ? `Lowest wind window today (prefers offshore/side-off when possible). Wind: ${window2h.windLabel}.`
                  : "Hourly forecast is loading…"}
            </p>
          </div>

          <div className="mt-6">
            <HourlyChart data={chartData} />
          </div>

          {/* 5-day outlook */}
          <section className="mt-10 glass soft-shadow rounded-3xl p-8 sm:p-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-white/70">Outlook</p>
                <h2 className="mt-2 text-xl font-extrabold">Next 5 days</h2>
                <p className="mt-2 text-sm text-white/70">
                  Best 2-hour window each day (cached ~30 min).
                </p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-white/70">
                  <tr className="border-b border-white/10">
                    <th className="py-3 pr-4 font-semibold">Date</th>
                    <th className="py-3 pr-4 font-semibold">Best window</th>
                    <th className="py-3 pr-4 font-semibold">Score</th>
                    <th className="py-3 pr-4 font-semibold">Wave</th>
                    <th className="py-3 pr-4 font-semibold">Period</th>
                    <th className="py-3 pr-4 font-semibold">Wind max</th>
                    <th className="py-3 pr-0 font-semibold">Temp</th>
                  </tr>
                </thead>

                <tbody className="text-white/85">
                  {(outlook ?? []).map((d) => (
                    <tr key={d.date} className="border-b border-white/10">
                      <td className="py-3 pr-4 whitespace-nowrap">{d.date}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">{d.best_window_label ?? "—"}</td>
                      <td className="py-3 pr-4 font-extrabold">
                        {d.score_best != null ? d.score_best.toFixed(1) : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        {d.wave_ft != null ? `${d.wave_ft.toFixed(1)} ft` : "—"}
                      </td>
                      <td className="py-3 pr-4">{d.period_s != null ? `${d.period_s}s` : "—"}</td>
                      <td className="py-3 pr-4">
                        {d.wind_max_mph != null ? `${d.wind_max_mph} mph` : "—"}
                      </td>
                      <td className="py-3 pr-0">
                        {d.temp_min_f != null && d.temp_max_f != null
                          ? `${Math.round(d.temp_min_f)}–${Math.round(d.temp_max_f)}°F`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ShareButton />
            <CopyReportButton
              spotName={selected.name}
              url={`https://surfcheckseer.com/spot/${selected.id}`}
              score={surf.score}
              status={surf.status}
              bestWindowLabel={bestScoreWindowLabel ?? window2h?.label ?? null}
            />
          </div>

          <div className="mt-7">
            <SubscribeBox spotId={selected.id} />
          </div>

          {/* New content blocks */}
          <WetsuitPanel spotId={selected.id as SpotId} />
          <SpotNotesPanel spotId={selected.id as SpotId} />
        </section>

        <footer className="mt-16 border-t border-white/10 pt-8 text-sm text-white/60">
          © {new Date().getFullYear()} SurfSeer
        </footer>
      </main>
    </div>
  );
}