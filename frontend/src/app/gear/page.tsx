// app/gear/page.tsx
export default function GearPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 pb-20 pt-10">
      <section className="glass soft-shadow rounded-3xl p-8 sm:p-10 fade-in">
        <p className="text-xs font-semibold text-white/70">Gear</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Wetsuit basics</h1>
        <p className="mt-3 text-sm text-white/70 leading-6">
          This is the simple East Coast wetsuit breakdown. Your spot page shows the season-based
          setup automatically.
        </p>

        <div className="mt-8 grid gap-3">
          {[
            ["Summer", "Boardshorts / rashguard. Shorty if you get cold."],
            ["Fall", "3/2 is the workhorse. 4/3 late fall."],
            ["Winter", "5/4 hooded or warmer + boots + gloves."],
            ["Spring", "4/3 early, 3/2 late spring."],
          ].map(([t, d]) => (
            <div key={t} className="glass rounded-2xl p-5 border border-white/10">
              <p className="text-sm font-extrabold">{t}</p>
              <p className="mt-1 text-sm text-white/70">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-sm text-white/70">
          Pick a spot:{" "}
          <a className="surf-link font-semibold" href="/spot/oc-inlet">
            Ocean City Inlet
          </a>
        </div>
      </section>
    </main>
  );
}