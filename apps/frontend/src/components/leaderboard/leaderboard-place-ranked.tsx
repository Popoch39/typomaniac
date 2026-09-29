import { cn } from "cn";

import type { ReaderPlace } from "@/components/leaderboard/reader-place";
import { TierBadge } from "@/components/tier/rank/tier-badge";
import { TpProgress } from "@/components/tier/rank/tp-progress";
import { tpProgressOf } from "@/components/tier/rank/tp-progress-of";
import { standingName, TIER_COLORS } from "@/components/tier/tier";
import { numberFormat, ordinalParts } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Where a ranked reader stands: their place in the Classement, their rank, and how far the next.
export const LeaderboardPlaceRanked = ({ reader }: { reader: ReaderPlace }) => {
  const locale = useLocale();
  const { position, standing } = reader;
  const progress = tpProgressOf(standing, locale);
  const place = ordinalParts(locale, position);

  return (
    <>
      <p className="flex items-baseline gap-1">
        <span className="text-[52px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
          {place.figure}
        </span>
        <span className="text-[22px] font-bold text-muted-foreground">{place.suffix}</span>
      </p>
      <div className="flex items-center gap-3.5">
        {/* The rank is written next to it: the badge's own name would be read twice. */}
        <span aria-hidden>
          <TierBadge standing={standing} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className={cn("text-xl font-bold", TIER_COLORS[standing.tier])}>
            {standingName(standing, locale)}
          </span>
          <span className="font-mono text-[13px] text-muted-foreground tabular-nums">
            {m.rank_tp({ tp: numberFormat(locale).format(standing.tp) }, { locale })}
          </span>
        </span>
      </div>
      {progress?.kind === "division" ? (
        <div className="flex flex-col gap-2">
          <TpProgress rank={standing} size="lg" />
          <p className="text-[13px] text-muted-foreground">{progress.toNext}</p>
        </div>
      ) : null}
    </>
  );
};
