import Image from "next/image";
import SpotPicker from "@/components/SpotPicker";
import ShareButton from "@/components/ShareButton";
import SubscribeBox from "@/components/SubscribeBox";
import HourlyChart from "@/components/HourlyChart";
import { fetchToday, fetchTideNOAA } from "@/lib/surfData";
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

/* ---------- component ---------- */

export default async function SpotPage({ spotId }: { spotId: SpotId }) {
  const fallbackKey = Object.keys(SPOTS)[0] as SpotId;
  const selected = SPOTS[spotId] ?? SPOTS[fallbackKey];

  const [today, tide] = await Promise.all([
    fetchToday(selected.lat, selected.lon),
    fetchTideNOAA(NOAA_TIDE_STATION),
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

  const chartData = hourly.slice(0, 12).map((h) => ({
    time: h.time,
    waveHeightFt: h.wave_ft,
    score: null,
  }));

  return (
    <div className="min-h-screen bg-transparent text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/25 backdrop-blur-xl">
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

              <div className="mt-1 flex items-center gap-2">
                <p className="text-2xl font-extrabold">{selected.name}</p>
                <span className={`uplift rounded-full px-2.5 py-1 text-xs font-bold ${surf.pill}`}>
                  {surf.status}
                </span>
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
                {window2h ? window2h.label : "—"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {window2h
                ? `Lowest wind window today (prefers offshore/side-off when possible). Wind: ${window2h.windLabel}.`
                : "Hourly wind is loading…"}
            </p>
          </div>

          <div className="mt-6">
            <HourlyChart data={chartData} />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ShareButton />
          </div>

          <div className="mt-7">
            <SubscribeBox spotId={selected.id} />
          </div>
        </section>

        <footer className="mt-16 border-t border-white/10 pt-8 text-sm text-white/60">
          © {new Date().getFullYear()} SurfSeer
        </footer>
      </main>
    </div>
  );
}