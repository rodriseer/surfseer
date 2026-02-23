// src/components/WetsuitPanel.tsx
import { getWetsuitRecs, seasonForNow, seasonLabel } from "@/lib/wetsuits";
import type { SpotId } from "@/lib/spots";

export default function WetsuitPanel({ spotId }: { spotId: SpotId }) {
  const season = seasonForNow();
  const recs = getWetsuitRecs(spotId);
  const current = recs[season];

  return (
    <section className="mt-10 glass soft-shadow rounded-3xl p-8 sm:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-white/70">Wetsuit recommendations</p>
          <p className="mt-1 text-xl font-extrabold">{seasonLabel(season)} setup</p>
          <p className="mt-2 text-sm text-white/70 leading-6">
            Local, season-based guidance. Water temp can vary week to week—use this as a baseline.
          </p>
        </div>

        <a
          className="uplift rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
          href="/gear"
        >
          Full gear guide
        </a>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {current.map((r) => (
          <div key={r.title} className="glass rounded-2xl p-4 border border-white/10">
            <p className="text-sm font-extrabold text-white">{r.title}</p>
            <p className="mt-1 text-sm text-white/70">{r.details}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-white/70">
        Etiquette reminder:{" "}
        <a className="surf-link font-semibold" href="/etiquette">
          respect priority
        </a>{" "}
        (no dropping in).
      </div>
    </section>
  );
}