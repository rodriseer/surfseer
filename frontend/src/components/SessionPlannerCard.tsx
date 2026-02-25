// src/components/SessionPlannerCard.tsx
type PlanLevel = "GO" | "MAYBE" | "SKIP";

function planFromScore(score: number | null): { level: PlanLevel; headline: string; sub: string } {
  if (typeof score !== "number") {
    return { level: "MAYBE", headline: "Forecast loading", sub: "Give it a moment." };
  }
  if (score >= 8) return { level: "GO", headline: "Go surf", sub: "This is a strong window." };
  if (score >= 6) return { level: "GO", headline: "Worth it", sub: "Rideable and likely fun." };
  if (score >= 4) return { level: "MAYBE", headline: "Maybe", sub: "Could be okay if you’re nearby." };
  return { level: "SKIP", headline: "Skip", sub: "Probably not worth the paddle." };
}

function pillClasses(level: PlanLevel) {
  if (level === "GO") return "border-emerald-400/20 bg-emerald-500/15 text-emerald-100";
  if (level === "SKIP") return "border-rose-400/20 bg-rose-500/15 text-rose-100";
  return "border-amber-400/20 bg-amber-500/15 text-amber-100";
}

function fmt(n: number | null, suffix = "") {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `${n}${suffix}`;
}

export default function SessionPlannerCard(props: {
  spotName: string;
  score: number | null;
  status: string;
  bestWindowLabel: string | null;
  bestWindowNote: string | null;
  waveFt: number | null;
  periodS: number | null;
  windMph: number | null;
  windLabel: string | null;
  tideLabel: string;
  beginner: boolean;
}) {
  const plan = planFromScore(props.score);

  const reasons: string[] = [];
  if (props.windLabel) reasons.push(`${props.windLabel} wind`);
  if (typeof props.windMph === "number") reasons.push(`${Math.round(props.windMph)} mph`);
  if (typeof props.waveFt === "number") reasons.push(`${props.waveFt.toFixed(1)} ft`);
  if (typeof props.periodS === "number") reasons.push(`${Math.round(props.periodS)}s period`);
  if (props.bestWindowLabel) reasons.push(`Best window: ${props.bestWindowLabel}`);

  const take =
    plan.level === "GO"
      ? "Aim for the best window and keep it simple."
      : plan.level === "MAYBE"
        ? "If you’re close, check the cam and go during the best window."
        : "Save your energy—check again later today or tomorrow.";

  return (
    <section className="glass soft-shadow rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/70">Session planner</p>
          <h2 className="mt-2 text-xl sm:text-2xl font-extrabold">{plan.headline}</h2>
          <p className="mt-2 text-sm text-white/70">{plan.sub}</p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`uplift rounded-full border px-3 py-2 text-xs font-bold ${pillClasses(plan.level)}`}
          >
            {props.score != null ? `${props.score.toFixed(1)}/10` : "—/10"}
          </span>

          {props.beginner ? (
            <span className="uplift rounded-full px-3 py-2 text-xs font-bold bg-white/10 text-white/80 border border-white/10">
              Beginner-friendly
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-white/60">Best time</p>
          <p className="mt-1 text-lg font-extrabold text-white">{props.bestWindowLabel ?? "—"}</p>
          <p className="mt-1 text-xs text-white/60">{props.bestWindowNote ?? "—"}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-white/60">Next tide</p>
          <p className="mt-1 text-lg font-extrabold text-white">{props.tideLabel}</p>
          <p className="mt-1 text-xs text-white/60">NOAA predictions</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-white/60">Swell</p>
          <p className="mt-1 text-lg font-extrabold text-white">{fmt(props.waveFt, " ft")}</p>
          <p className="mt-1 text-xs text-white/60">{fmt(props.periodS, "s")} period</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold text-white/60">Wind</p>
          <p className="mt-1 text-lg font-extrabold text-white">{fmt(props.windMph, " mph")}</p>
          <p className="mt-1 text-xs text-white/60">{props.windLabel ?? "—"}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-semibold">Why</p>
        <p className="mt-2 text-sm text-white/75 leading-6">
          {reasons.length ? reasons.join(" • ") : "Loading conditions…"}
        </p>
        <p className="mt-3 text-sm text-white/70">{take}</p>
      </div>

      <p className="mt-4 text-xs text-white/50">
        Spot: {props.spotName} • Status: {props.status}
      </p>
    </section>
  );
}