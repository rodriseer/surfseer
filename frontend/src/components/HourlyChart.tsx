"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

type Point = { time: string; waveHeightFt: number | null; score: number | null };

type TooltipPayloadItem = {
  dataKey?: string;
  value?: number;
};

type MinimalTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: ReadonlyArray<TooltipPayloadItem>;
};

function SurfTooltip({ active, payload, label }: MinimalTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const wave = payload.find((p) => p.dataKey === "waveHeightFt")?.value;
  const score = payload.find((p) => p.dataKey === "score")?.value;

  return (
    <div className="glass soft-shadow rounded-2xl px-3 py-2 text-xs text-white">
      <div className="font-semibold">{label ?? "—"}</div>

      <div className="mt-1 text-white/60">
        Wave: <span className="text-white">{wave != null ? `${wave.toFixed(1)} ft` : "—"}</span>
      </div>

      <div className="mt-1 text-white/60">
        Score: <span className="text-white">{score != null ? `${score.toFixed(1)}/10` : "—"}</span>
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

  const hasScore = cleaned.some((d) => typeof d.score === "number");

  return (
    <div className="glass soft-shadow rounded-3xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Next hours</div>
        <div className="text-xs text-white/55">
          Wave height{hasScore ? " • Score" : ""}
        </div>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cleaned} margin={{ top: 8, right: 18, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }}
            />

            {/* Left axis: wave height (ft) */}
            <YAxis
              yAxisId="wave"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }}
              width={30}
              domain={[0, "auto"]}
            />

            {/* Right axis: score (0-10) */}
            {hasScore && (
              <YAxis
                yAxisId="score"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "rgba(255,255,255,0.28)", fontSize: 12 }}
                width={24}
                domain={[0, 10]}
              />
            )}

            <Tooltip
              content={(props) => <SurfTooltip {...(props as unknown as MinimalTooltipProps)} />}
              cursor={{ stroke: "rgba(255,255,255,0.10)" }}
            />

            {/* Wave line */}
            <Line
              yAxisId="wave"
              type="monotone"
              dataKey="waveHeightFt"
              dot={false}
              strokeWidth={2}
              stroke="rgba(255,255,255,0.80)"
            />

            {/* Score line (subtle) */}
            {hasScore && (
              <Line
                yAxisId="score"
                type="monotone"
                dataKey="score"
                dot={false}
                strokeWidth={2}
                stroke="rgba(34,211,238,0.85)" // cyan-ish to match your theme
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}