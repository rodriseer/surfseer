"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  type TooltipProps,
} from "recharts";

type Point = { time: string; waveHeightFt: number | null; score: number | null };

function SurfTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const wave = payload.find((p) => p.dataKey === "waveHeightFt")?.value as number | undefined;
  const score = payload.find((p) => p.dataKey === "score")?.value as number | undefined;

  return (
    <div className="glass soft-shadow rounded-2xl px-3 py-2 text-xs text-white">
      <div className="font-semibold">{label ?? "—"}</div>
      <div className="mt-1 text-white/70">
        Wave: <span className="text-white">{wave != null ? `${wave.toFixed(1)} ft` : "—"}</span>
      </div>
      <div className="text-white/70">
        Score: <span className="text-white">{score != null ? score.toFixed(1) : "—"}</span>
      </div>
    </div>
  );
}

export default function HourlyChart({ data }: { data: Point[] }) {
  const cleaned = data
    .map((d) => ({
      ...d,
      hour: new Date(d.time).toLocaleTimeString([], { hour: "numeric" }),
      waveHeightFt: d.waveHeightFt ?? undefined,
      score: d.score ?? undefined,
    }))
    .slice(0, 12);

  return (
    <div className="glass soft-shadow uplift rounded-3xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Next hours</div>
        <div className="text-xs text-white/60">Wave height (ft)</div>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cleaned} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
              width={30}
            />
            <Tooltip content={<SurfTooltip />} cursor={{ stroke: "rgba(255,255,255,0.12)" }} />
            <Line
              type="monotone"
              dataKey="waveHeightFt"
              dot={false}
              strokeWidth={2}
              stroke="rgba(255,255,255,0.85)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}