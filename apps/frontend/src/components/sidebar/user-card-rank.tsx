import { cn } from "cn";
import { TrophyIcon } from "lucide-react";
import { isPlacement, type Rank } from "ranked";

import { TierEmblem } from "@/components/tier/drawing/tier-emblem";
import { TpProgress } from "@/components/tier/rank/tp-progress";
import { tpProgressOf } from "@/components/tier/rank/tp-progress-of";
import { standingName, TIER_COLORS } from "@/components/tier/tier";
import { numberFormat, ordinal } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

type UserCardRankProps = {
  // What describes the User's card: its button points at it.
  id: string;
  rank: Rank;
  // Their Place in the Leaderboard, null out of it.
  place: number | null;
};

// Under the Handle on the User's card: the rank, the Tier's Emblem before it, the Place on the
// right; then the bar or the Placement's notches, the TP or the Duels played after it. The figures
// stay in the card's description, which a meter in a button would not reach.
export const UserCardRank = ({ id, rank, place }: UserCardRankProps) => {
  const locale = useLocale();
  const numbers = numberFormat(locale);
  const progress = tpProgressOf(rank, locale);

  return (
    <span id={id} className="flex flex-col gap-1.25">
      <span className="flex items-center justify-between gap-1.5">
        {isPlacement(rank) ? (
          <span className="text-xs font-bold text-muted-foreground">
            {m.sidebar_user_placement({}, { locale })}
          </span>
        ) : (
          <span
            className={cn(
              "flex min-w-0 items-center gap-1 text-xs font-bold whitespace-nowrap",
              TIER_COLORS[rank.tier],
            )}
          >
            <span className="size-3.5 shrink-0" aria-hidden>
              <TierEmblem tier={rank.tier} />
            </span>
            <span className="truncate">{standingName(rank, locale)}</span>
          </span>
        )}
        {place === null ? null : (
          <span className="flex shrink-0 items-center gap-0.75 text-[11px] font-bold whitespace-nowrap tabular-nums">
            <TrophyIcon aria-hidden className="size-3 text-muted-foreground" strokeWidth={2.4} />
            <span aria-hidden>{ordinal(locale, place)}</span>
            <span className="sr-only">
              {m.sidebar_user_place({ place: ordinal(locale, place) }, { locale })}
            </span>
          </span>
        )}
      </span>
      {progress === null ? null : (
        <span className="flex items-center gap-2">
          {progress.kind === "maniac" ? null : (
            <span className="min-w-0 flex-1">
              <TpProgress rank={rank} size="md" />
            </span>
          )}
          <span className="shrink-0 font-mono text-[10px] whitespace-nowrap text-muted-foreground tabular-nums">
            {progress.kind === "placement"
              ? `${numbers.format(progress.played)} / ${numbers.format(progress.of)}`
              : m.rank_tp({ tp: numbers.format(progress.tp) }, { locale })}
          </span>
        </span>
      )}
    </span>
  );
};
