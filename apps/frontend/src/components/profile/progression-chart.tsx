import type { ReactNode } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Scatter,
  type TooltipPayloadEntry,
  XAxis,
  YAxis,
} from "recharts";

import type { ProgressionPoint } from "@/api/profile";
import {
  type ProgressionMetric,
  ROLLING_DUELS,
  progressionRows,
} from "@/components/profile/progression-rows";
import {
  progressionFigure,
  progressionMetricName,
  progressionPointDate,
  progressionPointFigures,
} from "@/components/profile/progression-text";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// One metric of the Progression, on the Progression's card, all in the accent (only the User is on
// it): a faint point per Duel, and the rolling average over 10 Duels as a line.
// The tooltip gives the date of the hovered Duel, its value and the average; every figure, the
// axis's too, in the Locale.
export const ProgressionChart = ({
  points,
  metric,
}: {
  points: readonly ProgressionPoint[];
  metric: ProgressionMetric;
}) => {
  const locale = useLocale();
  const rows = progressionRows(points, metric);
  const name = progressionMetricName(metric, locale);

  const config: ChartConfig = {
    value: { label: name, color: "var(--caret)" },
    average: {
      label: m.profile_progression_average(
        { count: numberFormat(locale).format(ROLLING_DUELS) },
        { locale },
      ),
      color: "var(--caret)",
    },
  };

  // The hovered Duel: its date and its four exact values.
  const duelOf = (duel: ReactNode) => {
    const point = points[Number(duel)];

    if (point === undefined) {
      return null;
    }

    return (
      <>
        <div>{progressionPointDate(point, locale)}</div>
        <div className="font-normal text-muted-foreground font-mono tabular-nums">
          {progressionPointFigures(point, locale)}
        </div>
      </>
    );
  };

  // A value of the axis or of the tooltip: always a number here.
  const formatValue = (value: TooltipPayloadEntry["value"]) =>
    progressionFigure(Number(value), locale);

  return (
    <figure
      aria-label={m.profile_progression_chart({ metric: name }, { locale })}
      className="flex flex-col gap-2"
    >
      <figcaption className="text-sm font-semibold">{name}</figcaption>
      <ChartContainer config={config} className="aspect-auto h-48 w-full">
        <ComposedChart data={rows} margin={{ left: 0, right: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="duel" type="number" domain={["dataMin", "dataMax"]} hide />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={32}
            domain={["auto", "auto"]}
            tickFormatter={formatValue}
          />
          <ChartTooltip
            content={<ChartTooltipContent labelFormatter={duelOf} valueFormatter={formatValue} />}
          />
          <Scatter
            dataKey="value"
            fill="var(--caret)"
            fillOpacity={0.4}
            isAnimationActive={false}
          />
          <Line
            dataKey="average"
            stroke="var(--caret)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ChartContainer>
    </figure>
  );
};
