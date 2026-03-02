// src/app/_shared/SpotPage.tsx  (FULL FILE - with background image + header links)
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
import CollapsibleSection from "@/components/CollapsibleSection";

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

  return (
    <div className="relative min-h-screen text-white">
      {/* Background image (public/background.jpg) */}
      <Image src="/background.jpg" alt="SurfSeer background" fill priority={false} className="object-cover" />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content */}
      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3 md:py-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="absolute -inset-2 rounded-2xl bg-cyan-400/15 blur-xl opacity-50" />
                <Image
                  src="/logo.png"
                  alt="SurfSeer logo"
                  width={40}
                  height={40}
                  priority
                  className="relative rounded-xl border border-white/10 bg-white/10 p-1.5"
                />
              </div>

              <div className="leading-tight min-w-0">
                <p className="text-lg font-semibold tracking-tight bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
                  SurfSeer
                </p>
                <p className="text-xs text-white/60 truncate">{selected.name}</p>
              </div>
            </div>

            {/* Right side: links + picker + CTA */}
            <div className="flex items-center gap-3">
              <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-white/70">
                <a className="hover:text-white transition" href="/favorites">
                  Favorites
                </a>
                <a className="hover:text-white transition" href="/about">
                  About
                </a>
                <a className="hover:text-white transition" href="/etiquette">
                  Etiquette
                </a>
                <a className="hover:text-white transition" href="/gear">
                  Gear
                </a>
              </nav>

              <div className="hidden md:block">
                <SpotPicker />
              </div>

              <a
                href="#today"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 transition"
              >
                Check now
              </a>
            </div>
          </div>

          {/* Mobile row */}
          <div className="border-t border-white/10 bg-black/20 px-4 sm:px-6 py-3 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SpotPicker />
              </div>
              <a
                href="/favorites"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
              >
                Favorites
              </a>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-4 pb-24 md:pt-10 md:pb-28">
          <section id="today" className="card p-4 md:p-8 lg:p-10 fade-in">
            {/* ----- Mobile-first hero: above-the-fold only ----- */}
            <div className="flex flex-col gap-4 md:gap-6">
              {/* Row 1: Spot name + favorite + status (single pill) */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold">{selected.name}</h1>
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

              {/* Row 2: ONE dominant score (hero) */}
              <div className="flex items-center gap-4 md:gap-6">
                <div className="score-ring flex items-center justify-center w-20 h-20 md:w-[110px] md:h-[110px] shrink-0">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
                      {surf.score != null ? surf.score.toFixed(1) : "—"}
                    </div>
                    <div className="text-[10px] md:text-[11px] text-white/60 -mt-0.5">out of 10</div>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-semibold text-white/90">
                    {surf.status} conditions
                  </p>
                  <p className="mt-0.5 text-xs text-white/55">
                    {topBestWindowLabel
                      ? `Best window ${topBestWindowLabel}`
                      : "Best window —"}
                  </p>
                  <p className="mt-1 text-[11px] text-white/50">Updated {updated}</p>
                </div>
              </div>

              {/* Row 3: Compact 2-col stats — wave, period, wind */}
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] font-semibold text-white/60">Wave</p>
                  <p className="mt-0.5 text-base md:text-lg font-bold">
                    {waveFt != null ? `${waveFt.toFixed(1)} ft` : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[11px] font-semibold text-white/60">Period</p>
                  <p className="mt-0.5 text-base md:text-lg font-bold">
                    {periodS != null ? `${periodS.toFixed(0)}s` : "—"}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 col-span-2">
                  <p className="text-[11px] font-semibold text-white/60">Wind</p>
                  <p className="mt-0.5 text-base md:text-lg font-bold">
                    {windMph != null && windDir
                      ? `${windMph} mph ${windDir}`
                      : windMph != null
                        ? `${windMph} mph`
                        : "—"}
                  </p>
                  {wq?.label ? (
                    <p className="mt-0.5 text-[11px] text-white/55">{wq.label}</p>
                  ) : null}
                </div>
              </div>

              {/* Desktop: show confidence and duplicate summary line only on md+ */}
              <div className="hidden md:flex flex-wrap items-center gap-2 text-xs text-white/60">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${confidencePillClasses(
                    (scored as any).confidence,
                  )}`}
                >
                  {confidenceLabel((scored as any).confidence)}
                </span>
                <span>Updated {updated}</span>
              </div>
            </div>

            <Divider />

            {/* Why this score — collapsible on mobile */}
            <CollapsibleSection title="Why this score" id="why" summaryHint="Tap to expand">
            <div className="space-y-4">
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
            </CollapsibleSection>

            <CollapsibleSection title="Plan your session" summaryHint="Tap to expand">
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
            </CollapsibleSection>

            {"breakdown" in scored && (scored as any).breakdown ? (
              <CollapsibleSection title="Scoring breakdown" summaryHint="Tap to expand">
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
              </CollapsibleSection>
            ) : null}

            <CollapsibleSection title="Next 12 hours" id="hourly" summaryHint="Score trend">
              <div className="min-w-0">
                <HourlyChart data={chartData} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Next 5 days" summaryHint="Tap to expand">
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
            </CollapsibleSection>

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

            <div className="mt-7">
              <SubscribeBox spotId={selected.id} />
            </div>

            <CollapsibleSection title="Local notes & gear" summaryHint="Tap to expand">
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
            </CollapsibleSection>
          </section>

          <footer className="mt-10 md:mt-16 border-t border-white/10 pt-6 md:pt-8 text-xs md:text-sm text-white/60">
            © {new Date().getFullYear()} SurfSeer
          </footer>
        </main>
      </div>
    </div>
  );
}