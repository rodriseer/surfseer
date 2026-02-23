// app/about/page.tsx
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
      <section className="glass soft-shadow rounded-3xl p-8 sm:p-10 fade-in">
        <p className="text-xs font-semibold text-white/70">About</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">SurfSeer</h1>

        <p className="mt-4 text-sm text-white/70 leading-6">
          SurfSeer is a focused surf-conditions project built for the East Coast. The goal is simple:
          make surf data easy to check, easy to share, and actually useful for day-to-day decisions.
        </p>

        <div className="mt-8 grid gap-3">
          <div className="glass rounded-2xl p-5 border border-white/10">
            <p className="text-sm font-extrabold">What it does</p>
            <p className="mt-1 text-sm text-white/70">
              Pulls forecast + tide data, calculates a simple surf score, and highlights the best
              window so you can decide fast.
            </p>
          </div>

          <div className="glass rounded-2xl p-5 border border-white/10">
            <p className="text-sm font-extrabold">Why it exists</p>
            <p className="mt-1 text-sm text-white/70">
              Some tools are cluttered or not tuned for local spots. SurfSeer stays clean, fast, and
              spot-focused.
            </p>
          </div>

          <div className="glass rounded-2xl p-5 border border-white/10">
            <p className="text-sm font-extrabold">What’s next</p>
            <p className="mt-1 text-sm text-white/70">
              5-day outlook, more spot notes, gear guidance, and local surf community features.
            </p>
          </div>
        </div>

        <div className="mt-10 text-sm text-white/70">
          Start here:{" "}
          <a className="surf-link font-semibold" href="/spot/oc-inlet">
            Today’s report
          </a>
        </div>
      </section>
    </main>
  );
}