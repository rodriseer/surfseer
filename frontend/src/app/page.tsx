// src/app/page.tsx
import Image from "next/image";

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      <Image
        src="/silas-hero.jpg"
        alt="Surfer in ocean aerial view"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10">
        <div className="container-app pt-10 pb-16 sm:pt-20 sm:pb-20">
          {/* Hero */}
          <section className="card p-5 sm:p-8 lg:p-10 fade-in">
            <div className="flex flex-col gap-6 sm:gap-9">
              {/* Brand row */}
              <div className="flex items-start gap-3 sm:gap-4">
                <Image
                  src="/logo.png"
                  alt="SurfSeer logo"
                  width={48}
                  height={48}
                  priority
                  className="rounded-2xl border border-white/10 bg-white/10 p-2 shrink-0"
                />

                {/* Brand + hero copy */}
                <div className="min-w-0 w-full">
                  <p className="text-sm font-semibold text-white/70">SurfSeer</p>

                  <h1
                    className="
                      mt-1
                      font-extrabold tracking-tight gradient-text
                      text-2xl sm:text-4xl lg:text-5xl
                      leading-[1.08]
                      w-full max-w-[52rem]
                      whitespace-normal break-words
                      overflow-hidden
                    "
                  >
                    East Coast surf calls you can trust
                  </h1>
                </div>
              </div>

              <p className="max-w-2xl text-sm sm:text-base muted leading-7">
                Stormglass + NOAA + a transparent 0–10 surf score, so you can decide in seconds if it&apos;s worth paddling out.
              </p>

              {/* Primary action */}
              <div className="flex">
                <a
                  href="/spot/oc-inlet"
                  className="btn btn-primary w-full sm:w-auto justify-center"
                >
                  Open forecast
                </a>
              </div>

              {/* Feature cards */}
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                <div className="card-lite p-4 sm:p-5">
                  <p className="text-xs font-semibold text-white/70">Surf score</p>
                  <p className="mt-2 text-base sm:text-lg font-extrabold">0–10 rating</p>
                  <p className="mt-1 text-sm muted leading-6">
                    Wave height + period + wind alignment distilled into one number you can trust.
                  </p>
                </div>

                <div className="card-lite p-4 sm:p-5">
                  <p className="text-xs font-semibold text-white/70">Best window</p>
                  <p className="mt-2 text-base sm:text-lg font-extrabold">Next 2 hours</p>
                  <p className="mt-1 text-sm muted leading-6">
                    Quickly see the cleanest wind window so you don’t waste a session.
                  </p>
                </div>

                <div className="card-lite p-4 sm:p-5">
                  <p className="text-xs font-semibold text-white/70">Tides + outlook</p>
                  <p className="mt-2 text-base sm:text-lg font-extrabold">Today + 5 days</p>
                  <p className="mt-1 text-sm muted leading-6">
                    Tide timing for surf spots, plus an easy weekly glance for planning.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* KEEP: Recruiter credibility section */}
          {/* REMOVE: "Designed for UX, not just data" section */}
          <section className="mt-8 sm:mt-10">
            <div className="card p-6 sm:p-9">
              <h2 className="section-title">Built like a real forecasting engine</h2>
              <p className="mt-2 text-sm muted leading-7 max-w-3xl">
                SurfSeer aggregates marine, wind, and tide inputs, scores conditions with a weighted model,
                and caches forecasts so spot pages stay fast and stable.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="card-lite p-4">
                  <p className="text-sm font-semibold">Real-time data aggregation</p>
                  <p className="mt-1 text-sm muted leading-6">
                    Stormglass, NOAA, and Open-Meteo combined into one clean, surfer-first forecast.
                  </p>
                </div>

                <div className="card-lite p-4">
                  <p className="text-sm font-semibold">Weighted surf scoring algorithm</p>
                  <p className="mt-1 text-sm muted leading-6">
                    Wave height, period, and wind alignment roll into a transparent 0–10 score with a clear breakdown.
                  </p>
                </div>

                <div className="card-lite p-4">
                  <p className="text-sm font-semibold">Server-side caching</p>
                  <p className="mt-1 text-sm muted leading-6">
                    Smart server-side caching respects API limits and keeps spot pages snappy.
                  </p>
                </div>

                <div className="card-lite p-4">
                  <p className="text-sm font-semibold">Automated daily reports</p>
                  <p className="mt-1 text-sm muted leading-6">
                    Subscription email pipeline for “notify me when it’s good.”
                  </p>
                </div>
              </div>

              <div className="mt-7">
                <a href="/spot/oc-inlet" className="btn btn-primary">
                  Check forecast now
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-10 sm:mt-12 border-t border-white/10 pt-6 sm:pt-8 text-xs sm:text-sm muted">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div>© {new Date().getFullYear()} SurfSeer</div>
              <div className="flex items-center gap-5">
                <a href="/about" className="surf-link">
                  About
                </a>
                <a href="/etiquette" className="surf-link">
                  Etiquette
                </a>
                <a href="/gear" className="surf-link">
                  Gear
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 sm:bottom-4 sm:left-auto sm:right-5 sm:translate-x-0 z-10 text-[10px] sm:text-xs text-white/70 text-center sm:text-right">
        Photo by{" "}
        <a
          href="https://unsplash.com/@silasbaisch"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-white"
        >
          Silas Baisch
        </a>{" "}
        on{" "}
        <a
          href="https://unsplash.com"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-white"
        >
          Unsplash
        </a>
      </div>
    </main>
  );
}