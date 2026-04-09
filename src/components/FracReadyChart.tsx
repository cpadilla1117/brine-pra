"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  computeHistoricalIndex,
  type WeeklyIndexPoint,
} from "@/lib/compute-index";

export default function FracReadyChart() {
  const data = useMemo(() => computeHistoricalIndex(), []);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-card border-b border-border">
        <h2 className="text-sm font-medium">
          BRINE Frac-Ready Index — 12 month trend
        </h2>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-6 mb-4">
          <Legend color="#1D9E75" label="Permian" />
          <Legend color="#378ADD" label="Delaware" />
          <Legend color="#EF9F27" label="DJ Basin" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0.15, 0.45]}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={{ stroke: "#27272a" }}
              tickLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="permianFracReady"
              stroke="#1D9E75"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="delawareFracReady"
              stroke="#378ADD"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="djFracReady"
              stroke="#EF9F27"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-3 h-0.5 rounded"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number | null;
    color: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
  }>;
  label?: string;
}) {
  if (!active || !payload) return null;

  // Find the actual weekStart from the data point
  const point = payload[0]?.payload as WeeklyIndexPoint | undefined;
  const dateStr = point?.weekStart || label || "";

  return (
    <div className="bg-card border border-border rounded px-3 py-2 text-xs">
      <div className="text-muted-foreground mb-1 font-mono">{dateStr}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.dataKey === "permianFracReady"
              ? "Permian"
              : entry.dataKey === "delawareFracReady"
              ? "Delaware"
              : "DJ Basin"}
            :
          </span>
          <span className="font-mono text-foreground">
            {entry.value !== null && entry.value !== undefined
              ? `$${entry.value.toFixed(2)}`
              : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
