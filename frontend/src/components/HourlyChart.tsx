"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

type Point = { time: string; waveHeightFt: number | null; score: number | null };

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
    <div className="rounded-2xl border bg-white p-4">
      <div className="mb-3 text-sm font-semibold">Next hours</div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={cleaned}>
            <XAxis dataKey="hour" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="waveHeightFt" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}