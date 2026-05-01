import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { OptimizationEvent, TrendPoint } from "@/types";
import { color } from "@/design/tokens";

interface Props {
  points: TrendPoint[];
  events?: OptimizationEvent[];
}

export function ScoreTrend({ points, events = [] }: Props) {
  const data = points.map((p) => ({
    ts: new Date(p.timestamp).getTime(),
    score: p.overall_score,
  }));
  return (
    <div role="figure" aria-label="score trend" style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
          <XAxis
            dataKey="ts"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t) => new Date(t).toLocaleDateString()}
            tick={{ fill: color.textMuted, fontSize: 11 }}
            stroke="rgba(255,255,255,0.18)"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: color.textMuted, fontSize: 11 }}
            stroke="rgba(255,255,255,0.18)"
          />
          <Tooltip
            contentStyle={{
              background: color.bgSurfaceRaised,
              border: `1px solid ${color.borderDefault}`,
              borderRadius: 6,
              color: color.textPrimary,
            }}
            labelFormatter={(t) => new Date(Number(t)).toLocaleString()}
            formatter={(v: number) => v.toFixed(2)}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke={color.success}
            strokeWidth={2}
            dot={{ r: 3, fill: color.success }}
          />
          {events.map((e, i) => (
            <ReferenceLine
              key={`${e.timestamp}-${i}`}
              x={new Date(e.timestamp).getTime()}
              stroke={color.danger}
              strokeDasharray="4 2"
              label={{
                value: e.label,
                position: "top",
                fontSize: 11,
                fill: color.textSecondary,
              }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
