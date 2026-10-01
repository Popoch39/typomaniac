import { cn } from "cn";

import { DuelEndRankName } from "@/components/duel-end/duel-end-rank-name";
import { DuelEndTpBar } from "@/components/duel-end/duel-end-tp-bar";
import { DuelEndTpDelta } from "@/components/duel-end/duel-end-tp-delta";
import type { RankCard } from "@/components/duel-end/rank-card";
import { TierBlason } from "@/components/tier/drawing/tier-blason";

type DuelEndStandingProps = {
  card: Extract<RankCard, { kind: "standing" }>;
  // In a Bo3's column: a smaller Blason and TP, the bar on a line of its own.
  compact: boolean;
};

// The rank after a ranked Duel, left to right: the Tier's Blason, the TP moved, the rank and its
// TP, then the Division's bar.
export const DuelEndStanding = ({ card, compact }: DuelEndStandingProps) => (
  <>
    <span className={cn("shrink-0", compact ? "size-16" : "size-28")}>
      <TierBlason tier={card.standing.tier} />
    </span>
    {card.tp === null ? null : <DuelEndTpDelta tp={card.tp} compact={compact} />}
    <DuelEndRankName standing={card.standing} headline={card.headline} />
    {card.bar === null ? null : (
      <div className={cn("flex grow", compact && "basis-full")}>
        <DuelEndTpBar bar={card.bar} standing={card.standing} />
      </div>
    )}
  </>
);
