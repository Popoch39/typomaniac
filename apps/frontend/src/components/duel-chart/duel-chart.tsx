import { cn } from "cn";
import type { ReactNode } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Line,
  type TooltipPayloadEntry,
  XAxis,
  YAxis,
} from "recharts";

import type { ReplayedDuel } from "@/api/duel-history";
import { DUEL_CHART_COLORS } from "@/components/duel-chart/duel-chart-colors";
import { DuelChartLegend } from "@/components/duel-chart/duel-chart-legend";
import { missMark, rawDot } from "@/components/duel-chart/duel-chart-marks";
import { duelChartRows } from "@/components/duel-chart/duel-chart-rows";
import { duelChartConfig, duelChartFigure } from "@/components/duel-chart/duel-chart-text";
import type { DuelSide } from "@/components/replay/replay-sides";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { secondsLabel } from "@/lib/durations";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// How each side draws its raw dots and its Misses crosses, in its color.
const MARKS: Record<
  DuelSide,
  { raw: ReturnType<typeof rawDot>; miss: ReturnType<typeof missMark> }
> = {
  own: { raw: rawDot(DUEL_CHART_COLORS.own), miss: missMark(DUEL_CHART_COLORS.own) },
  opponent: {
    raw: rawDot(DUEL_CHART_COLORS.opponent),
    miss: missMark(DUEL_CHART_COLORS.opponent),
  },
};

// The marks of one side: children of the chart itself, as recharts reads them. The raw dots and the
// Misses crosses are the points of lines that draw no stroke.
const sideSeries = (side: DuelSide) => [
  <Line
    key={`${side}Raw`}
    yAxisId="speed"
    dataKey={`${side}Raw`}
    stroke="none"
    dot={MARKS[side].raw}
    activeDot={false}
    isAnimationActive={false}
  />,
  <Line
    key={`${side}Wpm`}
    yAxisId="speed"
    dataKey={`${side}Wpm`}
    stroke={DUEL_CHART_COLORS[side]}
    strokeWidth={side === "own" ? 3 : 2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    dot={false}
    isAnimationActive={false}
  />,
  <Line
    key={`${side}Misses`}
    yAxisId="misses"
    dataKey={`${side}Misses`}
    stroke="none"
    dot={MARKS[side].miss}
    activeDot={false}
    isAnimationActive={false}
  />,
];

// The Duel second by second, the Monkeytype way, for both sides in their caret colors: the wpm so
// far (line), the raw of each second (dots) and the Misses (crosses, on their own axis). The
// opponent is drawn first, under the User. A deleted opponent leaves the User's marks only. Every
// figure, the axes' and the tooltip's, in the Locale.
// `compact`, in a Bo3's end that holds without scrolling: lower.
export const DuelChart = ({ duel, compact = false }: { duel: ReplayedDuel; compact?: boolean }) => {
  const locale = useLocale();
  const rows = duelChartRows(duel);

  // The hovered second, atop the tooltip: « 12 s ».
  const secondLabel = (second: ReactNode) => secondsLabel(Number(second), locale);

  // A value of an axis or of the tooltip: always a number here.
  const formatValue = (value: TooltipPayloadEntry["value"]) =>
    duelChartFigure(Number(value), locale);

  return (
    <figure aria-label={m.duel_chart_label({}, { locale })} className="flex flex-col gap-2.5">
      <ChartContainer
        config={duelChartConfig(duel.opponent, locale)}
        className={cn("aspect-auto w-full", compact ? "h-36" : "h-52")}
      >
        <ComposedChart data={rows} margin={{ left: 0, right: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="second" tickLine={false} axisLine={false} tickFormatter={formatValue} />
          <YAxis
            yAxisId="speed"
            tickLine={false}
            axisLine={false}
            width={32}
            tickFormatter={formatValue}
          />
          <YAxis
            yAxisId="misses"
            orientation="right"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={24}
            tickFormatter={formatValue}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent labelFormatter={secondLabel} valueFormatter={formatValue} />
            }
          />
          {duel.opponent === null ? null : sideSeries("opponent")}
          {sideSeries("own")}
        </ComposedChart>
      </ChartContainer>
      <DuelChartLegend opponent={duel.opponent} />
    </figure>
  );
};
