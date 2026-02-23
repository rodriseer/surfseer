// app/etiquette/page.tsx
export default function EtiquettePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
      <section className="glass soft-shadow rounded-3xl p-8 sm:p-10 fade-in">
        <p className="text-xs font-semibold text-white/70">Surf Etiquette</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Don’t be that guy</h1>
        <p className="mt-3 text-sm text-white/70 leading-6">
          SurfSeer is about good conditions — and good vibes. Here’s the short etiquette guide that
          keeps lineups safe and respectful.
        </p>

        <div className="mt-8 grid gap-3">
          {[
            ["Priority matters", "Closest to the peak has the right of way."],
            ["No dropping in", "If someone is already up, you pull out. Always."],
            ["Don’t snake", "Paddling around someone to steal position is weak."],
            ["Control your board", "If you can’t control it, don’t be in a crowd."],
            ["Paddle wide", "Don’t paddle through the takeoff zone."],
            ["Apologize fast", "If you mess up, own it and keep it moving."],
          ].map(([t, d]) => (
            <div key={t} className="glass rounded-2xl p-5 border border-white/10">
              <p className="text-sm font-extrabold">{t}</p>
              <p className="mt-1 text-sm text-white/70">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-sm text-white/70">
          Back to reports:{" "}
          <a className="surf-link font-semibold" href="/spot/oc-inlet">
            Ocean City Inlet
          </a>
        </div>
      </section>
    </main>
  );
}