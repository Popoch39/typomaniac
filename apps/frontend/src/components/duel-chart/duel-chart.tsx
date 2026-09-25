import type { ReactNode } from "react";
import { CartesianGrid, ComposedChart, Line, Scatter, XAxis, YAxis } from "recharts";

import type { ReplayedDuel } from "@/api/duel-history";
import { duelChartRows } from "@/components/duel-chart/duel-chart-rows";
import { OpponentHandle } from "@/components/handle/opponent-handle";
import type { DuelSide } from "@/components/replay/replay-sides";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { opponentName } from "@/lib/opponent-name";

// Each side in its caret color.
const COLORS: Record<DuelSide, string> = {
  own: "var(--caret)",
  opponent: "var(--opponent-caret)",
};

// The series of one side, labelled with its name.
const sideConfig = (side: DuelSide, name: string): ChartConfig => ({
  [`${side}Wpm`]: { label: `${name} wpm`, color: COLORS[side] },
  [`${side}Raw`]: { label: `${name} raw`, color: COLORS[side] },
  [`${side}Misses`]: { label: `${name} Misses`, color: COLORS[side] },
});

// The curves of one side: children of the chart itself, as recharts reads them.
const sideSeries = (side: DuelSide) => [
  <Line
    key={`${side}Wpm`}
    yAxisId="speed"
    dataKey={`${side}Wpm`}
    stroke={COLORS[side]}
    strokeWidth={2}
    dot={false}
    isAnimationActive={false}
  />,
  <Line
    key={`${side}Raw`}
    yAxisId="speed"
    dataKey={`${side}Raw`}
    stroke={COLORS[side]}
    strokeWidth={1}
    strokeOpacity={0.6}
    dot={false}
    isAnimationActive={false}
  />,
  <Scatter
    key={`${side}Misses`}
    yAxisId="misses"
    dataKey={`${side}Misses`}
    fill={COLORS[side]}
    isAnimationActive={false}
  />,
];

const secondLabel = (second: ReactNode) => `${String(second)} s`;

// The Duel second by second, the Monkeytype way, for both sides in their caret colors: the wpm so
// far (full line), the raw of each second (thin line) and the Misses (points, on their own axis).
// A deleted opponent leaves the User's curves only.
export const DuelChart = ({ duel }: { duel: ReplayedDuel }) => {
  const rows = duelChartRows(duel);
  const own = sideConfig("own", "Toi");

  const config =
    duel.opponent === null
      ? own
      : { ...own, ...sideConfig("opponent", opponentName(duel.opponent)) };

  return (
    <figure aria-label="Duel chart" className="flex flex-col gap-2">
      <figcaption className="text-[0.7rem] text-muted-foreground">
        Toi contre <OpponentHandle opponent={duel.opponent} className="text-foreground" />
      </figcaption>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
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
          <ChartLegend content={<ChartLegendContent />} />
          {sideSeries("own")}
          {duel.opponent === null ? null : sideSeries("opponent")}
        </ComposedChart>
      </ChartContainer>
    </figure>
  );
};
