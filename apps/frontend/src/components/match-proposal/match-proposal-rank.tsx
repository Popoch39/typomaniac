import { cn } from "cn";
import type { Rank } from "ranked";

import { TierEmblem } from "@/components/tier/drawing/tier-emblem";
import { rankLabel } from "@/components/tier/rank/rank-label";
import { standingName, TIER_COLORS } from "@/components/tier/tier";
import { numberFormat } from "@/locale/formats";
import { useLocale } from "@/locale/use-locale";

// A player's rank under their name, never their MMR: the Tier's emblem, its name in its colour
// and the TP, or the Placement Duels left. Nothing when their Rating could not be read.
export const MatchProposalRank = ({ rank }: { rank: Rank | null }) => {
  const locale = useLocale();

  if (rank === null) {
    return null;
  }

  if ("placementsLeft" in rank) {
    return <span className="text-sm text-muted-foreground">{rankLabel(rank, locale)}</span>;
  }

  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span aria-hidden className={cn("size-4.5", TIER_COLORS[rank.tier])}>
        <TierEmblem tier={rank.tier} />
      </span>
      <span>
        <span className={cn("font-semibold", TIER_COLORS[rank.tier])}>{standingName(rank)}</span>
        {" · "}
        <span className="font-mono text-xs tabular-nums">
          {numberFormat(locale).format(rank.tp)} TP
        </span>
      </span>
    </span>
  );
};
