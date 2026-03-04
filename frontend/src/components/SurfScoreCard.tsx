"use client";

type Props = {
  score: number | null;
  status: string;
  reasons: string[];
};

export default function SurfScoreCard({ score, status, reasons }: Props) {
  const value = score != null ? Math.min(10, Math.max(0, score)) : 0;
  const pct = (value / 10) * 100;

  return (
    <div className="card p-5 sm:p-6 rounded-2xl">
      <p className="font-heading text-xs font-semibold text-white/70 uppercase tracking-wider">
        SurfScore
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-heading text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          {score != null ? score.toFixed(1) : "—"}
        </span>
        <span className="text-lg font-semibold text-white/90">{status}</span>
      </div>
      {reasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-white/80">
          {reasons.slice(0, 3).map((r, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-cyan-400/80">•</span>
              {r}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
