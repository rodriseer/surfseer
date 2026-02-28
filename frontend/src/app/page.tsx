// src/app/page.tsx

import Image from "next/image";

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image (your file is in /public root) */}
      <Image
        src="/silas-hero.jpg"
        alt="Surfer in ocean aerial view"
        fill
        priority
        className="object-cover"
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Content Wrapper */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
        {/* Hero Card */}
        <section className="glass soft-shadow rounded-3xl p-10 sm:p-16 text-center backdrop-blur-md">
          {/* Brand */}
          <div className="flex flex-col items-center gap-6">
            <Image
              src="/logo.png"
              alt="SurfSeer logo"
              width={140}
              height={140}
              priority
              className="rounded-3xl"
            />

            {/* BIG brand name */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-white">
              SurfSeer
            </h1>

            {/* Subtitle */}
            <h2 className="text-xl sm:text-2xl text-white/80 font-medium">
              East Coast Surf Forecast
            </h2>

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

          {/* Secondary Links */}
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
      </div>

      {/* Photo Credit */}
      <div className="absolute bottom-4 right-5 z-10 text-xs text-white/70">
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