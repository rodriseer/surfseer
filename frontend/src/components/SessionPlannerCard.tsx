// src/components/SessionPlannerCard.tsx

type PlanLevel = "GO" | "MAYBE" | "SKIP";

type Props = {
  spotName: string;
  score: number | null;
  status: string;
  bestWindowLabel: string | null;
  bestWindowNote: string;
  waveFt: number | null;
  periodS: number | null;
  windMph: number | null;
  windLabel: string | null;
  tideLabel: string;
  beginner: boolean;
};

function planFromScore(score: number | null): { level: PlanLevel; headline: string; sub: string } {
  if (typeof score !== "number") {
    return { level: "MAYBE", headline: "Loading forecast", sub: "Give it a moment." };
  }
  if (score >= 8) return { level: "GO", headline: "Go surf", sub: "Strong window — worth the effort." };
  if (score >= 6) return { level: "GO", headline: "Worth it", sub: "Rideable and likely fun." };
  if (score >= 4) return { level: "MAYBE", headline: "Maybe", sub: "Could be okay if you’re nearby." };
  return { level: "SKIP", headline: "Skip", sub: "Probably not worth the paddle." };
}

function pill(level: PlanLevel) {
  if (level === "GO") return "bg-emerald-500/15 text-emerald-100 border border-emerald-400/20";
  if (level === "SKIP") return "bg-rose-500/15 text-rose-100 border border-rose-400/20";
  return "bg-white/10 text-white/80 border border-white/10";
}

function fmtWave(waveFt: number | null) {
  return waveFt != null ? `${waveFt.toFixed(1)} ft` : "—";
}
function fmtPeriod(periodS: number | null) {
  return periodS != null ? `${Math.round(periodS)}s` : "—";
}
function fmtWind(windMph: number | null) {
  return windMph != null ? `${Math.round(windMph)} mph` : "—";
}

export default function SessionPlannerCard(props: Props) {
  const p = planFromScore(props.score);

  return (
    <section className="card-lite p-6 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/70">Session planner</p>
          <p className="mt-1 text-lg font-extrabold">{p.headline}</p>
          <p className="mt-1 text-sm muted leading-6">{p.sub}</p>

          <div className="mt-3 text-xs text-white/60 truncate">
            {props.spotName} • {props.status}
            {props.beginner ? " • Beginner-friendly" : ""}
          </div>
        </div>

        <span className={`chip ${pill(p.level)}`}>{p.level}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="card-lite p-4">
          <p className="text-xs font-semibold text-white/70">Best window</p>
          <p className="mt-1 font-bold">{props.bestWindowLabel ?? "—"}</p>
          <p className="mt-1 text-xs muted">{props.bestWindowNote}</p>
        </div>

        <div className="card-lite p-4">
          <p className="text-xs font-semibold text-white/70">Next tide</p>
          <p className="mt-1 font-bold">{props.tideLabel}</p>
          <p className="mt-1 text-xs muted">Timing can change the shape</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div className="card-lite p-4">
          <p className="text-xs font-semibold text-white/70">Swell</p>
          <p className="mt-1 font-extrabold">{fmtWave(props.waveFt)}</p>
        </div>
        <div className="card-lite p-4">
          <p className="text-xs font-semibold text-white/70">Period</p>
          <p className="mt-1 font-extrabold">{fmtPeriod(props.periodS)}</p>
        </div>
        <div className="card-lite p-4">
          <p className="text-xs font-semibold text-white/70">Wind</p>
          <p className="mt-1 font-extrabold">{fmtWind(props.windMph)}</p>
          <p className="mt-1 text-[11px] text-white/60 truncate">{props.windLabel ?? "—"}</p>
        </div>
      </div>
    </section>
  );
}