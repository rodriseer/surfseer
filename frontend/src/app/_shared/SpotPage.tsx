import Image from "next/image";
import { headers } from "next/headers";
import SpotPicker from "@/components/SpotPicker";

export const SPOTS = [
  { id: "oc-inlet", name: "Ocean City (Inlet)", lat: 38.3287, lon: -75.0913 },
  { id: "oc-north", name: "Ocean City (Northside)", lat: 38.4066, lon: -75.057 },
  { id: "assateague", name: "Assateague", lat: 38.0534, lon: -75.2443 },
] as const;

export type SpotId = (typeof SPOTS)[number]["id"];

const NOAA_TIDE_STATION = "8570283"; // Ocean City Inlet, MD
const NDBC_BUOY_STATION = "44009";

async function getJson(pathWithQuery: string) {
  const h = await headers();
  const host = h.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const url = `${protocol}://${host}${pathWithQuery}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

async function getToday(lat: number, lon: number) {
  return getJson(`/api/today?lat=${lat}&lon=${lon}`);
}

async function getTide() {
  return getJson(`/api/tide?station=${NOAA_TIDE_STATION}`);
}

async function getBuoy(station: string) {
  return getJson(`/api/buoy?station=${station}`);
}

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

function isMorningPreferred(timeStr: string) {
  // prefer 5–9 AM local time
  try {
    const d = new Date(timeStr);
    const hr = d.getHours();
    return hr >= 5 && hr <= 9;
  } catch {
    return false;
  }
}

function degToCompass(deg: number) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const i = Math.round(((deg % 360) / 45)) % 8;
  return dirs[i];
}

function tideTypeLabel(t: string) {
  if (t === "H") return "High";
  if (t === "L") return "Low";
  return t || "—";
}

function scoreSurf({
  windMph,
  waveFt,
  periodS,
}: {
  windMph: number | null;
  waveFt: number | null;
  periodS: number | null;
}) {
  let score = 5;

  const hasAny = windMph != null || waveFt != null || periodS != null;
  if (!hasAny) {
    return {
      score: null as number | null,
      status: "—",
      pill: "bg-zinc-100 text-zinc-700",
      take: "Loading conditions…",
    };
  }

  if (waveFt != null) {
    if (waveFt < 1) score -= 2;
    else if (waveFt < 2) score += 0;
    else if (waveFt < 4) score += 2;
    else score += 1;
  }

  if (periodS != null) {
    if (periodS < 6) score -= 1;
    else if (periodS < 9) score += 0;
    else if (periodS < 12) score += 1;
    else score += 2;
  }

  if (windMph != null) {
    if (windMph <= 5) score += 2;
    else if (windMph <= 10) score += 1;
    else if (windMph <= 15) score -= 1;
    else score -= 3;
  }

  score = Math.max(1, Math.min(10, score));

  let status = "Rideable";
  let pill = "bg-sky-50 text-sky-700";

  if (score >= 8) {
    status = "Clean";
    pill = "bg-emerald-50 text-emerald-700";
  } else if (score >= 6) {
    status = "Rideable";
    pill = "bg-sky-50 text-sky-700";
  } else if (score >= 4) {
    status = "Meh";
    pill = "bg-amber-50 text-amber-700";
  } else {
    status = "Poor";
    pill = "bg-rose-50 text-rose-700";
  }

  const parts: string[] = [];
  if (waveFt != null && periodS != null) parts.push(`${waveFt.toFixed(1)} ft @ ${periodS}s`);
  else if (waveFt != null) parts.push(`${waveFt.toFixed(1)} ft`);
  if (windMph != null) parts.push(`${windMph} mph wind`);

  const take = parts.length ? `Current: ${parts.join(" • ")}.` : "Current conditions loaded.";

  return { score, status, pill, take };
}

function bestWindow2h({
  hourly,
  waveFt,
  periodS,
}: {
  hourly: Array<{ time: string; wind_mph: number | null }>;
  waveFt: number | null;
  periodS: number | null;
}) {
  // Score each 2-hour window by average wind (lower is better)
  // + tiny bonus if swell looks decent
  if (!Array.isArray(hourly) || hourly.length < 2) return null;

  const swellBonus =
    waveFt != null && periodS != null
      ? waveFt >= 2 && periodS >= 8
        ? 0.4
        : waveFt >= 1.5 && periodS >= 7
        ? 0.2
        : 0
      : 0;

  let best: { i: number; score: number } | null = null;

  for (let i = 0; i < hourly.length - 1; i++) {
    const a = hourly[i]?.wind_mph;
    const b = hourly[i + 1]?.wind_mph;
    if (a == null || b == null) continue;

    const avg = (a + b) / 2;

    // Base scoring: lower wind => higher score
    let s = 10 - avg * 0.6; // 0mph=>10, 10mph=>4, 15mph=>1
    s = Math.max(0, Math.min(10, s));

    // Morning preference tie-breaker (+0.15)
    if (isMorningPreferred(hourly[i].time)) s += 0.15;

    // Swell bonus (small)
    s += swellBonus;

    if (!best || s > best.score) best = { i, score: s };
  }

  if (!best) return null;

  const start = hourly[best.i].time;
  const end = hourly[best.i + 1].time;

  return {
    start,
    end,
    label: `${formatHourLabel(start)}–${formatHourLabel(end)}`,
  };
}

export default async function SpotPage({ spotId }: { spotId: string }) {
  const selected = SPOTS.find((s) => s.id === spotId) ?? SPOTS[0];

  const [today, tide, buoy] = await Promise.all([
    getToday(selected.lat, selected.lon),
    getTide(),
    getBuoy(NDBC_BUOY_STATION),
  ]);

  const windMph =
    today?.wind_mph != null && Number.isFinite(today.wind_mph) ? Math.round(today.wind_mph) : null;
  const windDeg =
    today?.wind_dir_deg != null && Number.isFinite(today.wind_dir_deg) ? Math.round(today.wind_dir_deg) : null;

  const windDir = windDeg != null ? degToCompass(windDeg) : null;
  const updated = today?.updated ? formatTime(today.updated) : "—";

  const tides: Array<{ type: string; time: string; height?: string }> = Array.isArray(tide?.tides) ? tide.tides : [];
  const next = tides.length > 0 ? tides[0] : null;
  const nextTideLabel = next?.type && next?.time ? `${tideTypeLabel(next.type)} ${formatTime(next.time)}` : "—";

  const waveM = buoy?.wave_height_m;
  const waveFt = waveM != null && Number.isFinite(waveM) ? Number((waveM * 3.28084).toFixed(1)) : null;

  const periodS =
    buoy?.dominant_period_s != null && Number.isFinite(buoy.dominant_period_s)
      ? Number(buoy.dominant_period_s.toFixed(0))
      : buoy?.average_period_s != null && Number.isFinite(buoy.average_period_s)
        ? Number(buoy.average_period_s.toFixed(0))
        : null;

  const surf = scoreSurf({ windMph, waveFt, periodS });

  const forecast: Array<any> = Array.isArray(today?.forecast) ? today.forecast : [];
  const hourly: Array<{ time: string; wind_mph: number | null; wind_dir_deg: number | null }> = Array.isArray(today?.hourly)
    ? today.hourly
    : [];

  const window2h = bestWindow2h({ hourly, waveFt, periodS });

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Subtle background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,rgba(56,189,248,0.14),transparent_60%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="SurfSeer logo" width={36} height={36} priority className="rounded-lg" />
            <div className="leading-tight">
              <p className="text-sm font-extrabold tracking-tight">SurfSeer</p>
              <p className="text-xs text-zinc-500">{selected.name}</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-zinc-600 md:flex">
            <a className="hover:text-zinc-900" href="#today">
              Today
            </a>
            <a className="hover:text-zinc-900" href="#forecast">
              Forecast
            </a>
            <a className="hover:text-zinc-900" href="#about">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
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
        </div>

        {/* Mobile spot picker */}
        <div className="border-t border-zinc-200/60 bg-white/80 px-6 py-3 backdrop-blur md:hidden">
          <SpotPicker />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        {/* Hero */}
        <section className="grid gap-10 md:grid-cols-2 md:items-start">
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
              Clean surf summary, no noise
            </div>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Know if it’s worth paddling out.
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-8 text-zinc-600">
              Now with a “Best Window” suggestion (wind-first, swell bonus).
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#today"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white hover:bg-sky-700"
              >
                View today
              </a>
              <a
                href="#forecast"
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-bold hover:bg-zinc-50"
              >
                See forecast
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <Pill>Fast</Pill>
              <Pill>Minimal</Pill>
              <Pill>Best Window</Pill>
              <span className="ml-1">Built by Rodrigo</span>
            </div>
          </div>

          {/* Product card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
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
                sub={`NDBC ${NDBC_BUOY_STATION}`}
              />
              <Metric label="Period" value={periodS != null ? `${periodS}s` : "—"} sub="Dominant/avg period" />
              <Metric
                label="Wind"
                value={windMph != null ? `${windMph} mph` : "—"}
                sub={windDir != null && windDeg != null ? `${windDir} (${windDeg}°)` : "—"}
              />
              <Metric label="Tide" value={nextTideLabel} sub="NOAA predictions" />
            </div>

            <Divider />

            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Best window</p>
                <span className="text-xs font-semibold text-zinc-500">{window2h ? window2h.label : "—"}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {window2h
                  ? "Lowest wind window today (with a small swell bonus when available)."
                  : "Hourly wind is loading…"}
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-800">
                Save as favorite
              </button>
              <button className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold hover:bg-zinc-50">
                Share report
              </button>
            </div>
          </div>
        </section>

        <section id="today" className="mt-16">
          <SectionTitle title="Today" subtitle="The essentials, in one glance." />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <InfoCard title="Best window" value={window2h ? window2h.label : "—"} hint="Computed from hourly wind" />
            <InfoCard
              title="Swell"
              value={waveFt != null && periodS != null ? `${waveFt.toFixed(1)} ft @ ${periodS}s` : "—"}
              hint={`NDBC buoy ${NDBC_BUOY_STATION}`}
            />
            <InfoCard title="Next tide" value={nextTideLabel} hint="NOAA (free)" />
          </div>
        </section>

        <section id="forecast" className="mt-16">
          <SectionTitle title="Forecast" subtitle="3-day outlook (wind + temps)." />
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {forecast.length === 0 ? (
              <>
                <DayCard day="Sat" score="—" note="—" />
                <DayCard day="Sun" score="—" note="—" />
                <DayCard day="Mon" score="—" note="—" />
              </>
            ) : (
              forecast.map((f: any) => (
                <DayCard
                  key={f.date}
                  day={new Date(f.date).toLocaleDateString([], { weekday: "short" })}
                  score={f.wind_max_mph != null ? `${Math.round(f.wind_max_mph)} mph` : "—"}
                  note={
                    f.temp_max_f != null && f.temp_min_f != null
                      ? `${Math.round(f.temp_min_f)}–${Math.round(f.temp_max_f)}°F`
                      : "—"
                  }
                />
              ))
            )}
          </div>
        </section>

        <section id="about" className="mt-16">
          <SectionTitle title="About" subtitle="Why SurfSeer exists." />
          <div className="mt-6 max-w-2xl text-zinc-600">
            SurfSeer is a focused surf conditions app starting with Ocean City, Maryland. The goal is a clean UI that
            turns raw weather + ocean context into quick decisions.
          </div>
        </section>

        <footer className="mt-20 border-t border-zinc-200 pt-8 text-sm text-zinc-500">
          © {new Date().getFullYear()} SurfSeer
        </footer>
      </main>
    </div>
  );
}

/* ---------- UI helpers ---------- */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
      {children}
    </span>
  );
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

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-2 text-zinc-600">{subtitle}</p>
    </div>
  );
}

function InfoCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-semibold text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-2 text-sm text-zinc-600">{hint}</p>
    </div>
  );
}

function DayCard({ day, score, note }: { day: string; score: string; note: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{day}</p>
        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">{score}</span>
      </div>
      <p className="mt-3 text-sm text-zinc-600">{note}</p>
    </div>
  );
}