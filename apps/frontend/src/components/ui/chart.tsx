import { cn } from "cn";
import * as React from "react";
import * as RechartsPrimitive from "recharts";

// Each series of a chart by its `dataKey`: its label, and its color, a theme token such as
// `var(--caret)` so it follows light and dark.
export type ChartConfig = Readonly<Record<string, { label: React.ReactNode; color: string }>>;

const ChartContext = React.createContext<ChartConfig | null>(null);

const useChart = () => {
  const config = React.useContext(ChartContext);

  if (!config) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return config;
};

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;

function ChartContainer({
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart"
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer initialDimension={INITIAL_DIMENSION}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: readonly RechartsPrimitive.TooltipPayloadEntry[];
  label?: React.ReactNode;
  labelFormatter?: (label: React.ReactNode) => React.ReactNode;
};

// The values of every series at the hovered point, each with its color and label.
function ChartTooltipContent({ active, payload, label, labelFormatter }: ChartTooltipContentProps) {
  const config = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="grid min-w-32 items-start gap-1.5 rounded-xl border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{labelFormatter ? labelFormatter(label) : label}</div>
      <div className="grid gap-1.5">
        {payload.map((item) => {
          const key = String(item.dataKey);

          return (
            <div key={key} className="flex w-full items-center gap-2">
              <div
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: config[key]?.color }}
              />
              <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                <span className="text-muted-foreground">{config[key]?.label ?? key}</span>
                <span className="font-medium text-foreground font-mono tabular-nums">
                  {String(item.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

// Every series of the chart, by its color and label, from the config.
function ChartLegendContent() {
  const config = useChart();

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
      {Object.entries(config).map(([key, series]) => (
        <div key={key} className="flex items-center gap-1.5">
          <div
            className="size-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: series.color }}
          />
          {series.label}
        </div>
      ))}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };
