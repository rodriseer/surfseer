import Image from "next/image";
import SpotPicker from "@/components/SpotPicker";
import ShareButton from "@/components/ShareButton";
import SubscribeBox from "@/components/SubscribeBox";
import { fetchToday, fetchTideNOAA } from "@/lib/surfData";
import { bestWindow2h, degToCompass, scoreSurf10, windQuality } from "@/lib/surfScore";

export const SPOTS = [
  { id: "oc-inlet", name: "Ocean City (Inlet)", lat: 38.3287, lon: -75.0913, beachFacingDeg: 90 },
  { id: "oc-north", name: "Ocean City (Northside)", lat: 38.4066, lon: -75.057, beachFacingDeg: 85 },
  { id: "assateague", name: "Assateague", lat: 38.0534, lon: -75.2443, beachFacingDeg: 110 },
] as const;

export type SpotId = (typeof SPOTS)[number]["id"];

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
  return <div className="my-5 h-px w-full bg-zinc-200/70" />;
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{sub}</p>
    </div>
  );
}

/* ---------- component ---------- */

export default async function SpotPage({ spotId }: { spotId: SpotId }) {
  const selected = SPOTS.find((s) => s.id === spotId) ?? SPOTS[0];

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
      ? "bg-zinc-100 text-zinc-700"
      : scored.score10 >= 8
        ? "bg-emerald-50 text-emerald-700"
        : scored.score10 >= 6
          ? "bg-sky-50 text-sky-700"
          : scored.score10 >= 4
            ? "bg-amber-50 text-amber-700"
            : "bg-rose-50 text-rose-700";

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

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 backdrop-blur">
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
              <p className="text-sm font-extrabold tracking-tight">SurfSeer</p>
              <p className="text-xs text-zinc-500">{selected.name}</p>
            </div>
          </div>

          <div className="hidden md:block">
            <SpotPicker />
          </div>

          <a
            href="#today"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-800"
          >
            Check now
          </a>
        </div>

        <div className="border-t border-zinc-200/60 bg-white/80 px-6 py-3 backdrop-blur md:hidden">
          <SpotPicker />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <section
          id="today"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-zinc-500">Selected spot</p>
              <div className="mt-1 flex items-center gap-2">
                <p className="text-xl font-extrabold">{selected.name}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${surf.pill}`}>
                  {surf.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-500">Updated: {updated}</p>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold text-zinc-500">Surf score</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight">
                {surf.score != null ? surf.score.toFixed(1) : "—"}
              </p>
              <p className="text-xs text-zinc-500">out of 10</p>
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

          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Best window</p>
              <span className="text-xs font-semibold text-zinc-500">
                {window2h ? window2h.label : "—"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {window2h
                ? `Lowest wind window today (prefers offshore/side-off when possible). Wind: ${window2h.windLabel}.`
                : "Hourly wind is loading…"}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <ShareButton className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold hover:bg-zinc-50" />
          </div>

          <div className="mt-6">
            <SubscribeBox spotId={selected.id} />
          </div>
        </section>

        <footer className="mt-20 border-t border-zinc-200 pt-8 text-sm text-zinc-500">
          © {new Date().getFullYear()} SurfSeer
        </footer>
      </main>
    </div>
  );
}