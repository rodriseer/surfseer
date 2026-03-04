// src/app/_shared/SpotPage.tsx  (FULL FILE - with background image + header links)
import Image from "next/image";
import SpotPicker from "@/components/SpotPicker";
import ShareButton from "@/components/ShareButton";
import HourlyChart from "@/components/HourlyChart";
import CopyReportButton from "@/components/CopyReportButton";
import FavoriteButton from "@/components/FavoriteButton";
import SessionPlannerCard from "@/components/SessionPlannerCard";

import WetsuitPanel from "@/components/WetsuitPanel";
import SpotNotesPanel from "@/components/SpotNotesPanel";
import CollapsibleSection from "@/components/CollapsibleSection";
import WindIndicator from "@/components/WindIndicator";
import SurfScoreCard from "@/components/SurfScoreCard";

import { fetchToday, fetchTideNOAA, fetchOutlook5d } from "@/lib/surfData";
import {
  bestWindow2h,
  degToCompass,
  scoreSurf10,
  windQuality,
  type SurfScoreConfidence,
} from "@/lib/surfScore";
import { SPOTS, type SpotId } from "@/lib/spots";

const NOAA_TIDE_STATION = "8570283";

const SPOT_SURF_IMAGES = [
  "/silas-hero.jpg",
  "/lifestyle.jpg",
  "/background.jpg",
];

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
  return <div className="my-6 md:my-10 h-px w-full bg-white/10" />;
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

function confidenceLabel(confidence: SurfScoreConfidence | undefined) {
  if (!confidence) return "Low confidence";
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  return "Low confidence";
}

function confidencePillClasses(confidence: SurfScoreConfidence | undefined) {
  if (confidence === "high") {
    return "bg-emerald-500/15 text-emerald-100 border border-emerald-400/25";
  }
  if (confidence === "medium") {
    return "bg-sky-500/15 text-sky-100 border border-sky-400/25";
  }
  return "bg-amber-500/15 text-amber-100 border border-amber-400/25";
}

/** Score-based background class for dynamic accent (8–10 sunrise, 5–7 ocean, 0–4 muted) */
function spotBgClass(score: number | null): string {
  if (score == null) return "spot-bg-mid";
  if (score >= 8) return "spot-bg-high";
  if (score >= 5) return "spot-bg-mid";
  return "spot-bg-low";
}

/** Short atmospheric line for forecaster feel */
function atmosphericMicrocopy(opts: {
  status: string;
  wqLabel: string | null;
  windMph: number | null;
  waveFt: number | null;
  nextTideLabel: string;
}): string {
  const { status, wqLabel, windMph, waveFt, nextTideLabel } = opts;
  if (status === "Clean" && wqLabel === "Offshore" && (windMph == null || windMph <= 12)) {
    return "Light offshore winds improving shape.";
  }
  if (status === "Good" && wqLabel) {
    if (wqLabel === "Side-off" || wqLabel === "Offshore") return "Conditions stabilizing.";
    if (wqLabel === "Onshore" && (windMph == null || windMph > 10)) return "Wind affecting shape.";
  }
  if (status === "Fair" && wqLabel === "Onshore") return "Wind affecting shape.";
  if (nextTideLabel && nextTideLabel !== "—") return "Mid tide with rising swell.";
  return "Data-driven conditions.";
}

/** Normalize breakdown component to 0–1 for bar width */
function barWidth(adj: number, min = -3, max = 2): number {
  return Math.max(0, Math.min(1, (adj - min) / (max - min)));
}

/** 2–3 short bullets for SurfScore card */
function surfScoreReasons(opts: {
  breakdown: { wave: number; period: number; windSpeed: number; windDir: number } | null;
  wqLabel: string | null;
  windMph: number | null;
  nextTideLabel: string;
}): string[] {
  const { breakdown, wqLabel, windMph, nextTideLabel } = opts;
  const reasons: string[] = [];
  if (breakdown && breakdown.wave >= 1) reasons.push("Clean swell");
  else if (breakdown && breakdown.period >= 1) reasons.push("Good swell period");
  if (wqLabel === "Offshore" || wqLabel === "Side-off") {
    reasons.push(windMph != null && windMph <= 12 ? "Light offshore wind" : "Offshore wind");
  }
  if (nextTideLabel && nextTideLabel !== "—") reasons.push("Good tide window");
  if (reasons.length === 0 && breakdown) reasons.push("Data-driven conditions");
  return reasons.slice(0, 3);
}

/* ---------- component ---------- */

export default async function SpotPage({ spotId }: { spotId: SpotId }) {
  const fallbackKey = Object.keys(SPOTS)[0] as SpotId;
  const selected = SPOTS[spotId] ?? SPOTS[fallbackKey];

  const [today, tide, outlook] = await Promise.all([
    fetchToday(selected.lat, selected.lon),
    fetchTideNOAA(NOAA_TIDE_STATION),
    fetchOutlook5d(selected.lat, selected.lon, selected.beachFacingDeg, (selected as any).scoring),
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
    config: (selected as any).scoring,
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
    config: (selected as any).scoring,
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
      config: (selected as any).scoring,
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

  const topBestWindowLabel = bestScoreWindowLabel ?? window2h?.label ?? null;

  const bestUpcoming = pickBestUpcoming(outlook);

  const bestWindowNote = bestScoreWindow
    ? `Avg score: ${bestScoreWindow.avg.toFixed(1)}/10`
    : window2h
      ? `Lowest wind window • ${window2h.windLabel}`
      : "—";

  const breakdown = (scored as { breakdown?: { wave: number; period: number; windSpeed: number; windDir: number } }).breakdown;
  const spotHeroBg = SPOT_SURF_IMAGES[Math.floor(Math.random() * SPOT_SURF_IMAGES.length)];
  const atmosphericLine = atmosphericMicrocopy({
    status: surf.status,
    wqLabel: wq?.label ?? null,
    windMph,
    waveFt,
    nextTideLabel,
  });

  return (
    <div className={`relative min-h-screen text-white ${spotBgClass(surf.score ?? null)}`}>
      {/* Background image */}
      <Image src={spotHeroBg} alt="SurfSeer background" fill priority={false} className="object-cover" />

      {/* Animated ocean gradient overlay (very slow) + dynamic accent by score */}
      <div className="absolute inset-0 spot-hero-overlay opacity-95" />
      <div className="absolute inset-0 bg-black/50" />

      {/* Grain texture */}
      <div className="grain-overlay z-[1]" />

      {/* Content */}
      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur-xl">
          <div className="container-app flex items-center justify-between py-3 md:py-4">
            <a href="/" className="flex flex-col gap-0 min-w-0 leading-tight">
              <span className="font-heading text-lg font-semibold tracking-wide text-white">
                SurfSeer
              </span>
              <span className="text-[11px] text-white/60 truncate">
                {selected.name} · Surf Intelligence
              </span>
            </a>

            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <SpotPicker />
              </div>
              <a href="#today" className="btn btn-primary px-4 py-2.5 text-sm font-semibold">
                Open App
              </a>
            </div>
          </div>

          <div className="border-t border-white/10 bg-black/20 px-4 sm:px-6 py-3 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
              <div className="min-w-0 flex-1">
                <SpotPicker />
              </div>
              <a href="/favorites" className="btn btn-ghost px-3 py-2 text-xs font-semibold">
                Favorites
              </a>
            </div>
          </div>
        </header>

        <main className="container-app pt-4 pb-24 md:pt-10 md:pb-28">
          <section id="today" className="fade-in">
            {/* Spot name + favorite + status */}
            <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
              <h1 className="font-heading heading-card text-xl md:text-2xl font-extrabold text-white">
                {selected.name}
              </h1>
              <FavoriteButton spotId={selected.id} />
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${pill}`}>
                {surf.status}
              </span>
              {beginner ? (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold bg-white/10 text-white/80 border border-white/10">
                  Beginner-friendly
                </span>
              ) : null}
            </div>

            {/* SurfScore card + main metrics: mobile stack, desktop row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <SurfScoreCard
                score={surf.score}
                status={surf.status}
                reasons={surfScoreReasons({
                  breakdown: breakdown ?? null,
                  wqLabel: wq?.label ?? null,
                  windMph,
                  nextTideLabel,
                })}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="card p-4 rounded-2xl">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Wave height</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {waveFt != null ? `${waveFt.toFixed(1)} ft` : "—"}
                  </p>
                </div>
                <div className="card p-4 rounded-2xl">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Swell period</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {periodS != null ? `${periodS.toFixed(0)}s` : "—"}
                  </p>
                </div>
                <div className="card p-4 rounded-2xl col-span-2 flex items-start gap-3">
                  <WindIndicator deg={windDeg} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Wind</p>
                    <p className="mt-1 text-base font-bold text-white">
                      {windMph != null && windDir ? `${windMph} mph ${windDir}` : windMph != null ? `${windMph} mph` : "—"}
                    </p>
                    {wq?.label ? <p className="text-xs text-white/60">{wq.label}</p> : null}
                  </div>
                </div>
                <div className="card p-4 rounded-2xl col-span-2">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Tide</p>
                  <p className="mt-1 text-base font-bold text-white">{nextTideLabel}</p>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-white/50">Updated {updated}</p>

            <Divider />

            <CollapsibleSection title="Details" id="details" summaryHint="Tap to expand">
            <div className="space-y-8">
            <div id="why">
            <h3 className="font-heading text-sm font-bold text-white/90 uppercase tracking-wider mb-3">Why this score</h3>
            <div className="space-y-4">
              <p className="text-sm text-white/75 italic">{atmosphericLine}</p>

              {breakdown ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Breakdown</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="flex justify-between text-[11px] text-white/55 mb-0.5">
                        <span>Wave height</span>
                        <span>{fmtWave(waveFt)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-600 to-cyan-400 transition-all duration-700"
                          style={{ width: `${barWidth(breakdown.wave) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-white/55 mb-0.5">
                        <span>Swell period</span>
                        <span>{fmtPeriod(periodS)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-teal-600 to-cyan-400 transition-all duration-700"
                          style={{ width: `${barWidth(breakdown.period) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-white/55 mb-0.5">
                        <span>Wind</span>
                        <span>{wq?.label ?? "—"} {fmtWind(windMph)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-sky-400 transition-all duration-700"
                          style={{ width: `${barWidth(breakdown.windSpeed + breakdown.windDir, -5, 3) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2 flex-wrap">
                <a href="#hourly" className="btn-ghost text-xs px-3 py-2">Hourly</a>
                <a href="#tides" className="btn-ghost text-xs px-3 py-2">Tides</a>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/70">Wave height</p>
                  <p className="mt-1 text-lg font-extrabold">
                    {waveFt != null ? `${waveFt.toFixed(1)} ft` : "—"}
                  </p>
                  <p className="text-xs muted">Face height estimate</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/70">Period</p>
                  <p className="mt-1 text-lg font-extrabold">
                    {periodS != null ? `${periodS.toFixed(0)} s` : "—"}
                  </p>
                  <p className="text-xs muted">More seconds = more push</p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/70">Wind</p>
                  <p className="mt-1 text-lg font-extrabold">
                    {windMph != null ? `${windMph.toFixed(0)} mph` : "—"}
                  </p>
                  <p className="text-xs muted">
                    {windDeg != null ? `From ${degToCompass(windDeg)}` : "Direction —"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/70">Alignment</p>
                  <p className="mt-1 text-lg font-extrabold">{wq?.label ?? "—"}</p>
                  <p className="text-xs muted">
                    Bonus: {wq?.bonus != null ? `${wq.bonus.toFixed(2)}` : "—"}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/70">Best 2-hour window</p>
                  <p className="mt-1 text-base font-bold">
                    {bestScoreWindowLabel
                      ? `${bestScoreWindowLabel} • ~${bestScoreWindow!.avg.toFixed(1)}/10`
                      : window2h?.label
                        ? `${window2h.label} • ${window2h.windLabel}`
                        : "—"}
                  </p>
                  <p className="text-xs muted">
                    {bestScoreWindowLabel ? "Based on hourly score trend" : "Fallback: lowest wind window"}
                  </p>
                </div>

                <div id="tides" className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/70">Next tide</p>
                  <p className="mt-1 text-base font-bold">{nextTideLabel}</p>
                  <p className="text-xs muted">Tide timing can change the shape</p>
                </div>
              </div>

              <p className="text-sm text-white/70">{surf.take}</p>
            </div>
            </div>

            <h3 className="font-heading text-sm font-bold text-white/90 uppercase tracking-wider mb-3 mt-8">Plan your session</h3>
            <div className="mt-0">
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

            {"breakdown" in scored && (scored as any).breakdown ? (
              <>
              <h3 className="font-heading text-sm font-bold text-white/90 uppercase tracking-wider mb-3 mt-8">Scoring breakdown</h3>
              <div className="mt-0 glass-lite rounded-2xl p-4 md:p-5">
                <div className="grid grid-cols-2 gap-2 md:gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Base</p>
                    <p className="mt-1 text-lg font-extrabold text-white">{(scored as any).breakdown.base.toFixed(1)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Total</p>
                    <p className="mt-1 text-lg font-extrabold text-white">
                      {(scored as any).breakdown.totalClamped.toFixed(1)}
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      Before clamp: {(scored as any).breakdown.totalBeforeClamp.toFixed(1)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Wave height</p>
                    <p className="mt-1 text-lg font-extrabold text-white">{fmtSigned((scored as any).breakdown.wave)}</p>
                    <p className="mt-1 text-xs text-white/60">{fmtWave(waveFt)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Period</p>
                    <p className="mt-1 text-lg font-extrabold text-white">{fmtSigned((scored as any).breakdown.period)}</p>
                    <p className="mt-1 text-xs text-white/60">{fmtPeriod(periodS)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Wind speed</p>
                    <p className="mt-1 text-lg font-extrabold text-white">{fmtSigned((scored as any).breakdown.windSpeed)}</p>
                    <p className="mt-1 text-xs text-white/60">{fmtWind(windMph)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/60">Wind direction</p>
                    <p className="mt-1 text-lg font-extrabold text-white">{fmtSigned((scored as any).breakdown.windDir)}</p>
                    <p className="mt-1 text-xs text-white/60">{wq?.label ?? "—"}</p>
                  </div>
                </div>
              </div>
              </>
            ) : null}

            <h3 className="font-heading text-sm font-bold text-white/90 uppercase tracking-wider mb-3 mt-8" id="hourly">Next 12 hours</h3>
              <div className="min-w-0">
                <HourlyChart data={chartData} />
              </div>

            <h3 className="font-heading text-sm font-bold text-white/90 uppercase tracking-wider mb-3 mt-8">Next 5 days</h3>
            <div className="space-y-4">
              {bestUpcoming ? (
                <div className="glass-lite rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">Best this week</p>
                    <span className="text-xs font-semibold text-white/70">{bestUpcoming.score.toFixed(1)}/10</span>
                  </div>
                  <p className="mt-2 text-sm text-white/80">
                    <span className="font-semibold">{formatWeekday(bestUpcoming.date)}</span> •{" "}
                    <span className="font-semibold">{bestUpcoming.bestWindow}</span>
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-white/75">
                    <div><span className="text-white/60">Wave:</span> {bestUpcoming.wave != null ? `${bestUpcoming.wave.toFixed(1)} ft` : "—"}</div>
                    <div><span className="text-white/60">Period:</span> {bestUpcoming.period != null ? `${bestUpcoming.period}s` : "—"}</div>
                    <div><span className="text-white/60">Wind max:</span> {bestUpcoming.windMax != null ? `${bestUpcoming.windMax} mph` : "—"}</div>
                    <div><span className="text-white/60">Temp:</span> {bestUpcoming.tempMin != null && bestUpcoming.tempMax != null ? `${Math.round(bestUpcoming.tempMin)}–${Math.round(bestUpcoming.tempMax)}°F` : "—"}</div>
                  </div>
                </div>
              ) : null}

            <div className="glass-lite rounded-2xl p-4 md:p-6">
              <p className="text-xs text-white/60 mb-3">Best 2-hour window each day</p>

              <div className="space-y-3 md:hidden">
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
                        <td className="py-3 pr-4 font-extrabold">{d.score_best != null ? d.score_best.toFixed(1) : "—"}</td>
                        <td className="py-3 pr-4">{d.wave_ft != null ? `${d.wave_ft.toFixed(1)} ft` : "—"}</td>
                        <td className="py-3 pr-4">{d.period_s != null ? `${d.period_s}s` : "—"}</td>
                        <td className="py-3 pr-4">{d.wind_max_mph != null ? `${d.wind_max_mph} mph` : "—"}</td>
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
            </div>
            </div>

            <div className="mt-6 md:mt-8 flex flex-col gap-3 sm:flex-row">
              <ShareButton />
              <CopyReportButton
                spotName={selected.name}
                url={`https://surfcheckseer.com/spot/${selected.id}`}
                score={surf.score}
                status={surf.status}
                bestWindowLabel={bestScoreWindowLabel ?? window2h?.label ?? null}
              />
            </div>

            <h3 className="font-heading text-sm font-bold text-white/90 uppercase tracking-wider mb-3 mt-8">Local notes & gear</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-white/70 mb-2">Wetsuit guide</p>
                  <WetsuitPanel spotId={selected.id as SpotId} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70 mb-2">Spot notes</p>
                  <SpotNotesPanel spotId={selected.id as SpotId} />
                </div>
              </div>
            </div>
            </CollapsibleSection>
          </section>

          <footer className="mt-10 md:mt-16 border-t border-white/10 pt-6 md:pt-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-xs md:text-sm muted">
              <div className="flex flex-col gap-0.5">
                <span className="font-heading font-semibold text-white tracking-wide">SurfSeer</span>
                <span>A Seer Labs Product</span>
              </div>
              <a
                href="https://theseerlabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="surf-link"
              >
                theseerlabs.com
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}