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
    <div style={{ background: "#FFFFFF", border: "0.5px solid #E8E8ED", borderRadius: "16px", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", background: "#FAFAFA", borderBottom: "0.5px solid #E8E8ED" }}>
        <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#1D1D1F" }}>
          BRINE Frac-Ready Index — 12 month trend
        </h2>
      </div>
      <div style={{ padding: "20px 20px 16px" }}>
        <div className="flex items-center gap-6" style={{ marginBottom: "16px" }}>
          <Legend color="#1D9E75" label="Permian" />
          <Legend color="#378ADD" label="Delaware" />
          <Legend color="#EF9F27" label="DJ Basin" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 11, fill: "#AEAEB2" }}
              axisLine={{ stroke: "#E8E8ED" }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0.15, 0.45]}
              tick={{ fontSize: 11, fill: "#AEAEB2" }}
              axisLine={{ stroke: "#E8E8ED" }}
              tickLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="permianFracReady" stroke="#1D9E75" strokeWidth={1.5} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="delawareFracReady" stroke="#378ADD" strokeWidth={1.5} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="djFracReady" stroke="#EF9F27" strokeWidth={1.5} dot={false} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-0.5 rounded" style={{ backgroundColor: color }} />
      <span style={{ fontSize: "11px", color: "#6E6E73" }}>{label}</span>
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

  const point = payload[0]?.payload as WeeklyIndexPoint | undefined;
  const dateStr = point?.weekStart || label || "";

  return (
    <div style={{ background: "#FFFFFF", border: "0.5px solid #E8E8ED", borderRadius: "8px", padding: "10px 14px", fontSize: "12px" }}>
      <div className="font-mono" style={{ color: "#6E6E73", marginBottom: "6px" }}>{dateStr}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2" style={{ marginBottom: "2px" }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: "#6E6E73" }}>
            {entry.dataKey === "permianFracReady" ? "Permian" : entry.dataKey === "delawareFracReady" ? "Delaware" : "DJ Basin"}:
          </span>
          <span className="font-mono" style={{ color: "#1D1D1F", fontWeight: 500 }}>
            {entry.value !== null && entry.value !== undefined ? `$${entry.value.toFixed(2)}` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
