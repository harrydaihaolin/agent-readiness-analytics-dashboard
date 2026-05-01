import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { PILLARS, type Pillar } from "@/types";
import { color } from "@/design/tokens";

interface Props {
  pillars: Record<Pillar, number>;
  weakest?: Pillar;
}

const LABEL: Record<Pillar, string> = {
  cognitive_load: "Cognitive Load",
  feedback: "Feedback",
  flow: "Flow",
  safety: "Safety",
};

export function PillarRadar({ pillars }: Props) {
  const data = PILLARS.map((p) => ({
    pillar: LABEL[p],
    score: pillars[p] ?? 0,
  }));
  return (
    <div role="figure" aria-label="pillar radar" style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius={100}>
          <PolarGrid stroke="rgba(255,255,255,0.18)" />
          <PolarAngleAxis
            dataKey="pillar"
            tick={{ fill: color.textSecondary, fontSize: 12 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: color.textMuted, fontSize: 10 }}
            stroke="rgba(255,255,255,0.18)"
          />
          <Radar
            dataKey="score"
            stroke={color.accentStrong}
            fill={color.accentPrimary}
            fillOpacity={0.35}
          />
          <Tooltip
            contentStyle={{
              background: color.bgSurfaceRaised,
              border: `1px solid ${color.borderDefault}`,
              borderRadius: 6,
              color: color.textPrimary,
            }}
            labelStyle={{ color: color.textPrimary }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
