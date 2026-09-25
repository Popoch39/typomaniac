import type { ReactNode } from "react";
import { CartesianGrid, ComposedChart, Line, Scatter, XAxis, YAxis } from "recharts";

import type { ProgressionPoint } from "@/api/profile";
import {
  type ProgressionMetric,
  ROLLING_DUELS,
  progressionRows,
} from "@/components/profile/progression-rows";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });

const round = (value: number) => Math.round(value * 10) / 10;

// One metric of the Progression: a point per Duel, and the rolling average over 10 Duels as a line.
// The tooltip gives the date of the hovered Duel, its value and the average.
export const ProgressionChart = ({
  points,
  metric,
}: {
  points: readonly ProgressionPoint[];
  metric: ProgressionMetric;
}) => {
  const rows = progressionRows(points, metric);

  const config: ChartConfig = {
    value: { label: metric, color: "var(--caret)" },
    average: { label: `moyenne sur ${ROLLING_DUELS}`, color: "var(--opponent-caret)" },
  };

  // The hovered Duel: its date and its four exact values.
  const duelOf = (duel: ReactNode) => {
    const point = points[Number(duel)];

    if (point === undefined) {
      return null;
    }

    return (
      <>
        <div>{dateFormat.format(point.endedAt)}</div>
        <div className="font-normal text-muted-foreground font-mono tabular-nums">
          {`${round(point.wpm)} wpm · ${round(point.raw)} raw · ${round(point.accuracy)} % acc · ${round(point.consistency)} % cons`}
        </div>
      </>
    );
  };

  return (
    <figure aria-label={`Progression ${metric}`} className="flex flex-col gap-1">
      <figcaption className="text-sm text-muted-foreground">{metric}</figcaption>
      <ChartContainer config={config} className="aspect-auto h-48 w-full">
        <ComposedChart data={rows} margin={{ left: 0, right: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="duel" type="number" domain={["dataMin", "dataMax"]} hide />
          <YAxis tickLine={false} axisLine={false} width={32} domain={["auto", "auto"]} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={duelOf} />} />
          <Scatter dataKey="value" fill="var(--caret)" isAnimationActive={false} />
          <Line
            dataKey="average"
            stroke="var(--opponent-caret)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
    </figure>
  );
};
