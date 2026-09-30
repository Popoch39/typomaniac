import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "cn";

import { type ProgressionWindow, profileQueryOptions } from "@/api/profile";
import { WpmTrendArrow } from "@/components/profile/wpm-trend-arrow";
import { wpmTrend } from "@/components/profile/wpm-curve";
import { numberFormat } from "@/locale/formats";
import type { Locale } from "@/locale/locales";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type WpmTrendProps = { handle: string; span: ProgressionWindow };

// The trend's figure, signed in the Locale's message: « +6 », « −3 », « 0 » when flat.
const trendFigure = (rounded: number, value: string, locale: Locale) => {
  if (rounded > 0) {
    return m.profile_wpm_trend_gain({ value }, { locale });
  }

  return rounded < 0 ? m.profile_wpm_trend_loss({ value }, { locale }) : value;
};

// Beside the average wpm: how far the wpm went over the window, the last 10 Duels against the first
// 10 (« ↑ +6 », in the accent; « ↓ −3 » or a flat « 0 », quieter), and over how many Duels. Nothing
// under 20.
export const WpmTrend = ({ handle, span }: WpmTrendProps) => {
  const locale = useLocale();
  const { data: profile } = useSuspenseQuery(profileQueryOptions(handle, span));
  const points = profile.stats.progression;
  const trend = wpmTrend(points);

  if (trend === null) {
    return null;
  }

  const numbers = numberFormat(locale);
  const rounded = Math.round(trend);
  const gain = rounded > 0;
  const value = numbers.format(Math.abs(rounded));

  return (
    <div className="flex flex-col gap-1.5 pb-1">
      <span
        className={cn(
          "flex h-7 items-center gap-1 self-start rounded-full pr-2.5 pl-2 font-mono text-sm font-bold tabular-nums",
          gain ? "bg-primary/15 text-primary" : "bg-surface-2 text-muted-foreground",
        )}
      >
        <WpmTrendArrow trend={rounded} />
        {trendFigure(rounded, value, locale)}
      </span>
      <span className="text-[13px] text-muted-foreground">
        {m.profile_wpm_trend_span(
          { count: points.length, shown: numbers.format(points.length) },
          { locale },
        )}
      </span>
    </div>
  );
};
