import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceDot,
  ReferenceLine,
  type TooltipPayloadEntry,
  XAxis,
  YAxis,
} from "recharts";

import { type ProgressionWindow, profileQueryOptions } from "@/api/profile";
import { profileFigure } from "@/components/profile/profile-figure";
import { progressionFigure, progressionPointDate } from "@/components/profile/progression-text";
import { WpmBestTag } from "@/components/profile/wpm-best-tag";
import { wpmAxis, wpmCurve } from "@/components/profile/wpm-curve";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// The wpm of each Duel of the window, in the accent (only the User is on it): the line and the
// ground under it, their average dashed across, their best ringed and tagged (« record 128 » when it
// is the User's record, « pic 104 » otherwise), the last Duel dotted. From the oldest Duel of the
// window, at the left, to the last. The tooltip gives the date of the hovered Duel and its wpm; every
// figure in the Locale. Nothing when the window has no Duel but Forfeits.
export const WpmChart = ({
  handle,
  span,
  record,
}: {
  handle: string;
  span: ProgressionWindow;
  record: number | null;
}) => {
  const locale = useLocale();
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle, span));
  const curve = wpmCurve(profile.stats.progression, record);

  if (curve === null) {
    return null;
  }

  const count = curve.rows.length;
  const shown = numberFormat(locale).format(count);
  const axis = wpmAxis(curve.low, curve.high);
  const best = profileFigure(curve.best.wpm, locale);

  const config: ChartConfig = {
    wpm: { label: m.profile_wpm_series({}, { locale }), color: "var(--caret)" },
  };

  // The hovered Duel: when it ended.
  const duelOf = (duel: ReactNode) => {
    const row = curve.rows[Number(duel)];

    return row === undefined ? null : progressionPointDate(row, locale);
  };

  // A value of the tooltip: always a number here.
  const formatValue = (value: TooltipPayloadEntry["value"]) =>
    progressionFigure(Number(value), locale);

  const formatTick = (value: number) => profileFigure(value, locale);

  return (
    <figure
      aria-label={m.profile_wpm_chart(
        {
          count,
          shown,
          low: profileFigure(curve.low, locale),
          high: profileFigure(curve.high, locale),
          average: profileFigure(curve.average, locale),
        },
        { locale },
      )}
      className="flex flex-col gap-1"
    >
      <ChartContainer config={config} className="aspect-auto h-86 w-full font-mono">
        <ComposedChart data={curve.rows} margin={{ top: 44, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--surface-2)" />
          <XAxis dataKey="duel" type="number" domain={["dataMin", "dataMax"]} hide />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={40}
            domain={axis.domain}
            ticks={axis.ticks}
            tickFormatter={formatTick}
          />
          <ChartTooltip
            content={<ChartTooltipContent labelFormatter={duelOf} valueFormatter={formatValue} />}
          />
          <Area
            dataKey="wpm"
            type="linear"
            stroke="var(--caret)"
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="var(--caret)"
            fillOpacity={0.1}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <ReferenceLine
            y={curve.average}
            stroke="var(--muted-foreground)"
            strokeOpacity={0.7}
            strokeDasharray="4 6"
            label={{
              value: m.profile_wpm_average_line(
                { value: profileFigure(curve.average, locale) },
                { locale },
              ),
              position: "insideBottomRight",
              fill: "var(--muted-foreground)",
              fontSize: 12,
              className: "font-sans",
            }}
          />
          <ReferenceDot
            x={curve.best.duel}
            y={curve.best.wpm}
            r={7}
            fill="var(--card)"
            stroke="var(--foreground)"
            strokeWidth={3}
            label={
              <WpmBestTag
                text={
                  curve.best.record
                    ? m.profile_wpm_record_tag({ value: best }, { locale })
                    : m.profile_wpm_peak_tag({ value: best }, { locale })
                }
              />
            }
          />
          <ReferenceDot x={curve.last.duel} y={curve.last.wpm} r={6} fill="var(--caret)" />
        </ComposedChart>
      </ChartContainer>
      <div className="flex justify-between pl-10 text-xs text-muted-foreground">
        <span>{m.profile_wpm_first_duel({ count, shown }, { locale })}</span>
        <span>{m.profile_wpm_last_duel({}, { locale })}</span>
      </div>
    </figure>
  );
};
