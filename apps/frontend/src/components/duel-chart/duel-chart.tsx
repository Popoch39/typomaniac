import type { ReactNode } from "react";
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import type { ReplayedDuel } from "@/api/duel-history";
import { DuelChartLegend } from "@/components/duel-chart/duel-chart-legend";
import { missMark, rawDot } from "@/components/duel-chart/duel-chart-marks";
import { duelChartRows } from "@/components/duel-chart/duel-chart-rows";
import type { DuelSide } from "@/components/replay/replay-sides";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { opponentName } from "@/lib/opponent-name";

// Each side in its caret color.
const COLORS: Record<DuelSide, string> = {
  own: "var(--caret)",
  opponent: "var(--opponent-caret)",
};

// How each side draws its raw dots and its Misses crosses, in its color.
const MARKS: Record<
  DuelSide,
  { raw: ReturnType<typeof rawDot>; miss: ReturnType<typeof missMark> }
> = {
  own: { raw: rawDot(COLORS.own), miss: missMark(COLORS.own) },
  opponent: { raw: rawDot(COLORS.opponent), miss: missMark(COLORS.opponent) },
};

// The series of one side, labelled with its name.
const sideConfig = (side: DuelSide, name: string): ChartConfig => ({
  [`${side}Wpm`]: { label: `${name} wpm`, color: COLORS[side] },
  [`${side}Raw`]: { label: `${name} raw`, color: COLORS[side] },
  [`${side}Misses`]: { label: `${name} Misses`, color: COLORS[side] },
});

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
    stroke={COLORS[side]}
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

const secondLabel = (second: ReactNode) => `${String(second)} s`;

// The Duel second by second, the Monkeytype way, for both sides in their caret colors: the wpm so
// far (line), the raw of each second (dots) and the Misses (crosses, on their own axis). The
// opponent is drawn first, under the User. A deleted opponent leaves the User's marks only.
export const DuelChart = ({ duel }: { duel: ReplayedDuel }) => {
  const rows = duelChartRows(duel);
  const own = sideConfig("own", "Toi");

  const config =
    duel.opponent === null
      ? own
      : { ...own, ...sideConfig("opponent", opponentName(duel.opponent)) };

  return (
    <figure aria-label="Duel chart" className="flex flex-col gap-2.5">
      <ChartContainer config={config} className="aspect-auto h-52 w-full">
        <ComposedChart data={rows} margin={{ left: 0, right: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="second" tickLine={false} axisLine={false} />
          <YAxis yAxisId="speed" tickLine={false} axisLine={false} width={32} />
          <YAxis
            yAxisId="misses"
            orientation="right"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={secondLabel} />} />
          {duel.opponent === null ? null : sideSeries("opponent")}
          {sideSeries("own")}
        </ComposedChart>
      </ChartContainer>
      <DuelChartLegend opponent={duel.opponent} />
    </figure>
  );
};
