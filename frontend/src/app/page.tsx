// src/app/page.tsx

import Image from "next/image";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
      {/* Hero */}
      <section className="glass soft-shadow rounded-3xl p-10 sm:p-16 text-center">
        {/* Brand */}
        <div className="flex flex-col items-center gap-5">
          <Image
            src="/logo.png"
            alt="SurfSeer logo"
            width={120}
            height={120}
            priority
            className="rounded-3xl"
          />

          <p className="text-xs font-semibold text-white/60 tracking-wide">SurfSeer</p>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white">
            East Coast Surf Forecast
          </h1>

          <p className="max-w-2xl text-sm sm:text-base text-white/70 leading-7">
            Real-time surf scoring, best 2-hour windows, wind direction analysis, tide timing,
            and a clean 5-day outlook.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="mt-12">
          <a
            href="/spot/oc-inlet"
            className="
              group block w-full sm:w-auto mx-auto
              rounded-3xl
              border border-cyan-300/20
              bg-gradient-to-r from-cyan-500/20 to-sky-500/15
              px-10 py-7 sm:px-14 sm:py-8
              text-center
              transition-all duration-300
              hover:from-cyan-500/30 hover:to-sky-500/25
              hover:scale-[1.02]
              uplift surf-ring
            "
          >
            <div className="flex flex-col items-center gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Open Forecast
              </span>
              <span className="text-sm sm:text-base text-white/70">
                Score • Best window • Wind quality • Tides • 5-day outlook
              </span>
            </div>
          </a>
        </div>

        {/* Optional small links row (not competing with CTA) */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <a href="/about" className="surf-link">
            About
          </a>
          <a href="/etiquette" className="surf-link">
            Etiquette
          </a>
          <a href="/gear" className="surf-link">
            Surf gear
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/10 pt-8 text-sm text-white/60 text-center">
        © {new Date().getFullYear()} SurfSeer
      </footer>
    </main>
  );
}