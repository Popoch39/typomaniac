import { cn } from "cn";
import { Suspense, useId, useState, useTransition } from "react";

import { DEFAULT_PROGRESSION_WINDOW, type ProgressionWindow } from "@/api/profile";
import {
  PROFILE_CARD_LABEL_PAINT,
  PROFILE_TILE_PAINT,
} from "@/components/profile/profile-card-paint";
import { profileFigure } from "@/components/profile/profile-figure";
import { ProgressionWindowPicker } from "@/components/profile/progression-window-picker";
import { WpmChart } from "@/components/profile/wpm-chart";
import { WpmChartSkeleton } from "@/components/profile/wpm-chart-skeleton";
import { WpmTrend } from "@/components/profile/wpm-trend";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type WpmCardProps = { handle: string; average: number | null; record: number | null };

// The widest tile of the Profile's Stats, over both rows: the User's average wpm, large in the
// accent (116 px once the tile is tall enough, smaller in a short window), how far it went over the
// window they pick, and its curve over that window on the rest of the tile. A new window keeps the
// trend and the curve on screen until it is loaded; the average never waits for it.
export const WpmCard = ({ handle, average, record }: WpmCardProps) => {
  const locale = useLocale();
  const [span, setSpan] = useState<ProgressionWindow>(DEFAULT_PROGRESSION_WINDOW);
  const [isPending, startTransition] = useTransition();
  const titleId = useId();

  const pick = (next: ProgressionWindow) => startTransition(() => setSpan(next));

  return (
    <section
      aria-labelledby={titleId}
      aria-busy={isPending}
      className={cn("row-span-2 flex flex-col gap-4 p-7", PROFILE_TILE_PAINT)}
    >
      {/* The window's picker goes under the figure where the tile is too narrow for both: by the
          tile's width alone (40rem holds a 3-digit average and « sur les 200 derniers Duels »),
          never by what the window shows, so picking one never moves it. */}
      <div className="flex flex-col items-start gap-3 @min-[40rem]:flex-row @min-[40rem]:justify-between @min-[40rem]:gap-4">
        <div className="flex flex-col gap-2.5">
          <h2 id={titleId} className={PROFILE_CARD_LABEL_PAINT}>
            {m.profile_stat_average_wpm({}, { locale })}
          </h2>
          <div className="flex items-end gap-4.5">
            <p className="font-mono text-[clamp(4.5rem,24cqh,7.25rem)] leading-[0.85] font-bold tracking-[-0.06em] text-caret tabular-nums">
              {profileFigure(average, locale)}
            </p>
            <Suspense fallback={null}>
              <WpmTrend handle={handle} span={span} />
            </Suspense>
          </div>
        </div>
        <ProgressionWindowPicker span={span} onChange={pick} />
      </div>
      <Suspense fallback={<WpmChartSkeleton />}>
        <WpmChart handle={handle} span={span} record={record} />
      </Suspense>
    </section>
  );
};
