// src/components/SpotNotesPanel.tsx
import type { SpotId } from "@/lib/spots";
import { SPOTS } from "@/lib/spots";

type Notes = {
  waveType: string;
  bestSwell: string;
  bestWind: string;
  bestTide: string;
  hazards: string[];
  crowd: string;
};

export default function SpotNotesPanel({ spotId }: { spotId: SpotId }) {
  const spot = SPOTS[spotId] as any;
  const n: Notes | undefined = spot?.notes;

  if (!n) return null;

  return (
    <section className="mt-10 glass soft-shadow rounded-3xl p-8 sm:p-10">
      <p className="text-xs font-semibold text-white/70">Spot notes</p>
      <h2 className="mt-2 text-xl font-extrabold">How this spot works</h2>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-xs font-semibold text-white/70">Wave type</p>
          <p className="mt-1 text-sm font-extrabold text-white">{n.waveType}</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-xs font-semibold text-white/70">Best swell</p>
          <p className="mt-1 text-sm font-extrabold text-white">{n.bestSwell}</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-xs font-semibold text-white/70">Best wind</p>
          <p className="mt-1 text-sm font-extrabold text-white">{n.bestWind}</p>
        </div>
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-xs font-semibold text-white/70">Best tide</p>
          <p className="mt-1 text-sm font-extrabold text-white">{n.bestTide}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-xs font-semibold text-white/70">Hazards</p>
          <ul className="mt-2 space-y-1 text-sm text-white/70">
            {n.hazards.map((h) => (
              <li key={h}>• {h}</li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-2xl p-4 border border-white/10">
          <p className="text-xs font-semibold text-white/70">Crowd</p>
          <p className="mt-2 text-sm font-extrabold text-white">{n.crowd}</p>
          <p className="mt-1 text-sm text-white/70">
            Be respectful in the lineup.{" "}
            <a className="surf-link font-semibold" href="/etiquette">
              Etiquette guide
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}