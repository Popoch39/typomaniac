import { cn } from "cn";
import type { Rank } from "ranked";

import { TierEmblem } from "@/components/tier/drawing/tier-emblem";
import { rankLabel } from "@/components/tier/rank/rank-label";
import { TIER_COLORS } from "@/components/tier/tier";
import { useLocale } from "@/locale/use-locale";

// A rank in a line: the Tier's emblem and the rank in words, or the Placement Duels left. Under
// the Handle of the User chip, next to the opponent's during the Countdown.
export const RankChip = ({ rank }: { rank: Rank }) => {
  const locale = useLocale();

  return "placementsLeft" in rank ? (
    <span className="text-xs font-semibold text-muted-foreground">{rankLabel(rank, locale)}</span>
  ) : (
    <span className={cn("flex items-center gap-1 text-xs font-semibold", TIER_COLORS[rank.tier])}>
      <span className="size-4" aria-hidden>
        <TierEmblem tier={rank.tier} />
      </span>
      {rankLabel(rank, locale)}
    </span>
  );
};
