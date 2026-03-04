"use client";

import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, Tooltip } from "recharts";

type Point = { time: string; waveHeightFt: number | null; score: number | null };

const OCEAN_COLORS = {
  deep: "#0c4a6e",
  teal: "#0d9488",
  sand: "#99a3a8",
};

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
          <AreaChart
            data={cleaned}
            margin={{ top: 8, right: 18, left: -10, bottom: 0 }}
            style={{ overflow: "visible" }}
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={OCEAN_COLORS.teal} stopOpacity={0.5} />
                <stop offset="50%" stopColor={OCEAN_COLORS.deep} stopOpacity={0.3} />
                <stop offset="100%" stopColor={OCEAN_COLORS.sand} stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }}
            />

            <YAxis
              yAxisId="wave"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }}
              width={30}
              domain={[0, "auto"]}
            />

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

            {/* Wave: smooth line */}
            <Line
              yAxisId="wave"
              type="monotone"
              dataKey="waveHeightFt"
              dot={false}
              strokeWidth={2}
              stroke="rgba(255,255,255,0.75)"
              strokeDasharray="0"
              isAnimationActive
              animationDuration={1200}
              animationEasing="ease-out"
            />

            {/* Score: elevation-style area (ocean colors, draw-in) */}
            {hasScore && (
              <Area
                yAxisId="score"
                type="monotone"
                dataKey="score"
                stroke="rgba(45, 212, 191, 0.9)"
                strokeWidth={2}
                fill="url(#scoreGradient)"
                isAnimationActive
                animationDuration={1400}
                animationEasing="ease-out"
                baseValue={0}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}