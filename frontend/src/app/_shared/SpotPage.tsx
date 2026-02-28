// src/app/_shared/SpotPage.tsx  (FULL FILE - decluttered layout)
//
// NOTE: This replaces the Metric() grid with ONE “Conditions” block,
// reduces dividers, and makes secondary blocks use glass-lite (no shadow).
//
import Image from "next/image";
import SpotPicker from "@/components/SpotPicker";
import ShareButton from "@/components/ShareButton";
import SubscribeBox from "@/components/SubscribeBox";
import HourlyChart from "@/components/HourlyChart";
import CopyReportButton from "@/components/CopyReportButton";
import FavoriteButton from "@/components/FavoriteButton";
import SessionPlannerCard from "@/components/SessionPlannerCard";

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

function formatWeekday(dateString: string) {
  try {
    // Prevent timezone shifting
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function tideTypeLabel(t: string) {
  if (t === "H") return "High";
  if (t === "L") return "Low";
  return t || "—";
}

function Divider() {
  return <div className="my-10 h-px w-full bg-white/10" />;
}

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

function pickBestUpcoming(outlook: any[] | null | undefined) {
  const days = Array.isArray(outlook) ? outlook : [];
  const candidates = days
    .filter((d) => typeof d?.score_best === "number" && Number.isFinite(d.score_best))
    .map((d) => ({
      date: String(d.date ?? "—"),
      bestWindow: String(d.best_window_label ?? "—"),
      score: Number(d.score_best),
      wave: typeof d.wave_ft === "number" ? d.wave_ft : null,
      period: typeof d.period_s === "number" ? d.period_s : null,
      windMax: typeof d.wind_max_mph === "number" ? d.wind_max_mph : null,
      tempMin: typeof d.temp_min_f === "number" ? d.temp_min_f : null,
      tempMax: typeof d.temp_max_f === "number" ? d.temp_max_f : null,
    }));

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0];
}

function fmtSigned(n: number) {
  if (n > 0) return `+${n.toFixed(1)}`;
  return n.toFixed(1);
}

function fmtWave(waveFt: number | null) {
  return waveFt != null ? `${waveFt.toFixed(1)} ft` : "—";
}

function fmtPeriod(periodS: number | null) {
  return periodS != null ? `${Math.round(periodS)}s` : "—";
}

function fmtWind(windMph: number | null) {
  return windMph != null ? `${windMph} mph` : "—";
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
    const hmph = h.wind_mph != null && Number.isFinite(h.wind_mph) ? Math.round(h.wind_mph) : null;

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

  const bestUpcoming = pickBestUpcoming(outlook);

  const bestWindowNote = bestScoreWindow
    ? `Avg score: ${bestScoreWindow.avg.toFixed(1)}/10`
    : window2h
      ? `Lowest wind window • ${window2h.windLabel}`
      : "—";

  return (
    <div className="relative min-h-screen text-white">
      {/* Background image */}
      <Image
        src="/background.jpg"
        alt="SurfSeer background"
        fill
        sizes="100vw"
        priority={false}
        className="object-cover opacity-90"
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Actual page content */}
      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
            {/* Left: Logo + Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                {/* Glow highlight behind logo */}
                <div className="absolute -inset-2 rounded-2xl bg-cyan-400/15 blur-xl" />
                <div className="relative rounded-2xl border border-white/10 bg-white/10 p-1.5">
                  <Image
                    src="/logo.png"
                    alt="SurfSeer logo"
                    width={36}
                    height={36}
                    priority
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="leading-tight min-w-0">
                <p className="text-base font-extrabold tracking-wide bg-gradient-to-r from-cyan-200 to-white/70 bg-clip-text text-transparent">
                  SurfSeer
                </p>
                <p className="text-xs text-white/60 truncate">{selected.name}</p>
              </div>
            </div>

            {/* Center (desktop): Nav + Spot picker */}
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex items-center gap-5 text-sm">
                <a href="/about" className="surf-link">
                  About
                </a>
                <a href="/etiquette" className="surf-link">
                  Etiquette
                </a>
                <a href="/gear" className="surf-link">
                  Gear
                </a>
              </nav>

              <SpotPicker />
            </div>

            {/* Right: Primary CTA */}
            <a
              href="#today"
              className="uplift surf-ring rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
            >
              Check now
            </a>
          </div>

          {/* Mobile row: Spot picker + quick links */}
          <div className="border-t border-white/10 bg-black/20 px-4 sm:px-6 py-3 backdrop-blur md:hidden">
            <SpotPicker />

            <div className="mt-3 flex items-center gap-3 overflow-x-auto pb-1 text-sm">
              <a
                href="/about"
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/85 hover:bg-white/10"
              >
                About
              </a>
              <a
                href="/etiquette"
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/85 hover:bg-white/10"
              >
                Etiquette
              </a>
              <a
                href="/gear"
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/85 hover:bg-white/10"
              >
                Gear
              </a>
              <a
                href="#outlook"
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/85 hover:bg-white/10"
              >
                5-day
              </a>
              <a
                href="#extras"
                className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/85 hover:bg-white/10"
              >
                Tools
              </a>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 pb-20 pt-10">
          {/* Keep ONE strong primary container */}
          <section id="today" className="glass soft-shadow rounded-3xl p-6 sm:p-10 fade-in">
            {/* Top summary */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-white/70">Selected spot</p>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-2xl font-extrabold">{selected.name}</p>

                  <FavoriteButton spotId={selected.id} />

                  <span className={`uplift rounded-full px-2.5 py-1 text-xs font-bold ${pill}`}>
                    {surf.status}
                  </span>

                  {beginner ? (
                    <span className="uplift rounded-full px-2.5 py-1 text-xs font-bold bg-white/10 text-white/80 border border-white/10">
                      Beginner-friendly
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm text-white/60">Updated: {updated}</p>
              </div>

              <div className="sm:text-right">
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

            {/* UI/UX: quick in-page actions (extra things to click, but lightweight) */}
            <div className="mt-7 flex flex-wrap gap-2">
              <a
                href="#outlook"
                className="uplift rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
              >
                Jump to 5-day outlook
              </a>
              <a
                href="#extras"
                className="uplift rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
              >
                Wetsuit + Notes
              </a>
              <a
                href="/gear"
                className="uplift rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10 transition"
              >
                Surf gear guide
              </a>
            </div>

            {/* Keep dividers only between BIG sections */}
            <Divider />

            {/* Optional: best upcoming (lighter, secondary weight) */}
            {bestUpcoming ? (
              <div className="glass-lite rounded-3xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Best this week</p>
                  <span className="text-xs font-semibold text-white/70">
                    {bestUpcoming.score.toFixed(1)}/10
                  </span>
                </div>

                <p className="mt-2 text-sm text-white/80">
                  <span className="font-semibold">{formatWeekday(bestUpcoming.date)}</span> •{" "}
                  <span className="font-semibold">{bestUpcoming.bestWindow}</span>
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-white/75">
                  <div>
                    <span className="text-white/60">Wave:</span>{" "}
                    {bestUpcoming.wave != null ? `${bestUpcoming.wave.toFixed(1)} ft` : "—"}
                  </div>
                  <div>
                    <span className="text-white/60">Period:</span>{" "}
                    {bestUpcoming.period != null ? `${bestUpcoming.period}s` : "—"}
                  </div>
                  <div>
                    <span className="text-white/60">Wind max:</span>{" "}
                    {bestUpcoming.windMax != null ? `${bestUpcoming.windMax} mph` : "—"}
                  </div>
                  <div>
                    <span className="text-white/60">Temp:</span>{" "}
                    {bestUpcoming.tempMin != null && bestUpcoming.tempMax != null
                      ? `${Math.round(bestUpcoming.tempMin)}–${Math.round(bestUpcoming.tempMax)}°F`
                      : "—"}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6">
              <SessionPlannerCard
                spotName={selected.name}
                score={surf.score}
                status={surf.status}
                bestWindowLabel={bestScoreWindowLabel ?? window2h?.label ?? null}
                bestWindowNote={bestWindowNote}
                waveFt={waveFt}
                periodS={periodS}
                windMph={windMph}
                windLabel={wq?.label ?? null}
                tideLabel={nextTideLabel}
                beginner={beginner}
              />
            </div>

            {/* “Conditions” as ONE quieter block instead of 4 mini cards */}
            <div className="mt-8 glass-lite rounded-3xl p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-semibold">Conditions</h3>
                <p className="text-xs text-white/60">Stormglass / NOAA</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/85">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/60">Swell</p>
                  <p className="mt-1 text-lg font-extrabold text-white">{fmtWave(waveFt)}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/60">Period</p>
                  <p className="mt-1 text-lg font-extrabold text-white">{fmtPeriod(periodS)}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/60">Wind</p>
                  <p className="mt-1 text-lg font-extrabold text-white">{fmtWind(windMph)}</p>
                  <p className="mt-1 text-xs text-white/60">
                    {wq?.label ?? "—"}
                    {windDir != null && windDeg != null ? ` • ${windDir} (${windDeg}°)` : ""}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/60">Next tide</p>
                  <p className="mt-1 text-lg font-extrabold text-white">{nextTideLabel}</p>
                </div>
              </div>
            </div>

            {/* Keep “why score” but make it quieter */}
            {"breakdown" in scored && scored.breakdown ? (
              <details className="mt-8 glass-lite rounded-3xl p-5">
                <summary className="cursor-pointer select-none text-sm font-semibold">
                  Why this score?
                  <span className="ml-2 text-xs font-semibold text-white/60">(tap)</span>
                </summary>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Base</p>
                    <p className="mt-1 text-lg font-extrabold text-white">
                      {scored.breakdown.base.toFixed(1)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Total</p>
                    <p className="mt-1 text-lg font-extrabold text-white">
                      {scored.breakdown.totalClamped.toFixed(1)}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      Before clamp: {scored.breakdown.totalBeforeClamp.toFixed(1)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Wave height</p>
                    <p className="mt-1 text-lg font-extrabold text-white">
                      {fmtSigned(scored.breakdown.wave)}
                    </p>
                    <p className="mt-1 text-xs text-white/60">{fmtWave(waveFt)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Period</p>
                    <p className="mt-1 text-lg font-extrabold text-white">
                      {fmtSigned(scored.breakdown.period)}
                    </p>
                    <p className="mt-1 text-xs text-white/60">{fmtPeriod(periodS)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Wind speed</p>
                    <p className="mt-1 text-lg font-extrabold text-white">
                      {fmtSigned(scored.breakdown.windSpeed)}
                    </p>
                    <p className="mt-1 text-xs text-white/60">{fmtWind(windMph)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Wind direction</p>
                    <p className="mt-1 text-lg font-extrabold text-white">
                      {fmtSigned(scored.breakdown.windDir)}
                    </p>
                    <p className="mt-1 text-xs text-white/60">{wq?.label ?? "—"}</p>
                  </div>
                </div>
              </details>
            ) : null}

            {/* Best window stays, but secondary weight */}
            <div className="mt-8 glass-lite rounded-3xl p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Best window</p>
                <span className="text-xs font-semibold text-white/70">
                  {bestScoreWindowLabel ?? window2h?.label ?? "—"}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-white/70">
                {bestScoreWindow
                  ? `Top 2-hour window based on wave + period + wind. Avg score: ${bestScoreWindow.avg.toFixed(
                      1
                    )}/10.`
                  : window2h
                    ? `Lowest wind window. Wind: ${window2h.windLabel}.`
                    : "Hourly forecast is loading…"}
              </p>
            </div>

            {/* Chart: keep, but secondary */}
            <div className="mt-8">
              <div className="glass-lite rounded-3xl p-5">
                <p className="text-sm font-semibold">Next 12 hours</p>
                <p className="mt-1 text-xs text-white/60">Score trend</p>
                <div className="mt-4">
                  <HourlyChart data={chartData} />
                </div>
              </div>
            </div>

            <Divider />

            {/* 5-day outlook */}
            <section id="outlook" className="glass-lite rounded-3xl p-6 sm:p-10">
              <div>
                <p className="text-xs font-semibold text-white/70">Outlook</p>
                <h2 className="mt-2 text-xl font-extrabold">Next 5 days</h2>
                <p className="mt-2 text-sm text-white/70">
                  Best 2-hour window each day (cached ~30 min).
                </p>
              </div>

              <div className="mt-6 space-y-3 md:hidden">
                {(outlook ?? []).map((d) => (
                  <div key={d.date} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="font-extrabold">{formatWeekday(d.date)}</div>
                      <div className="text-sm font-semibold text-white/80">
                        {d.score_best != null ? d.score_best.toFixed(1) : "—"} / 10
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-white/80">
                      <div>
                        <span className="text-white/60">Best:</span> {d.best_window_label ?? "—"}
                      </div>
                      <div>
                        <span className="text-white/60">Wave:</span>{" "}
                        {d.wave_ft != null ? `${d.wave_ft.toFixed(1)} ft` : "—"}
                      </div>
                      <div>
                        <span className="text-white/60">Period:</span>{" "}
                        {d.period_s != null ? `${d.period_s}s` : "—"}
                      </div>
                      <div>
                        <span className="text-white/60">Wind max:</span>{" "}
                        {d.wind_max_mph != null ? `${d.wind_max_mph} mph` : "—"}
                      </div>
                      <div className="col-span-2">
                        <span className="text-white/60">Temp:</span>{" "}
                        {d.temp_min_f != null && d.temp_max_f != null
                          ? `${Math.round(d.temp_min_f)}–${Math.round(d.temp_max_f)}°F`
                          : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-white/70">
                    <tr className="border-b border-white/10">
                      <th className="py-3 pr-4 font-semibold">Day</th>
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
                        <td className="py-3 pr-4 whitespace-nowrap">{formatWeekday(d.date)}</td>
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

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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

            {/* Extra tools */}
            <div id="extras" className="mt-8 space-y-6">
              <div className="glass-lite rounded-3xl p-6">
                <WetsuitPanel spotId={selected.id as SpotId} />
              </div>
              <div className="glass-lite rounded-3xl p-6">
                <SpotNotesPanel spotId={selected.id as SpotId} />
              </div>
            </div>
          </section>

          <footer className="mt-16 border-t border-white/10 pt-8 text-sm text-white/60">
            © {new Date().getFullYear()} SurfSeer
          </footer>
        </main>
      </div>
    </div>
  );
}