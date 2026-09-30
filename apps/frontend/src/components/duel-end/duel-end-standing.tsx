import { DuelEndRankName } from "@/components/duel-end/duel-end-rank-name";
import { DuelEndTpBar } from "@/components/duel-end/duel-end-tp-bar";
import { DuelEndTpDelta } from "@/components/duel-end/duel-end-tp-delta";
import type { RankCard } from "@/components/duel-end/rank-card";
import { TierBlason } from "@/components/tier/drawing/tier-blason";

type DuelEndStandingProps = { card: Extract<RankCard, { kind: "standing" }> };

// The rank after a ranked Duel, left to right: the Tier's Blason, the TP moved, the rank and its
// TP, then the Division's bar.
export const DuelEndStanding = ({ card }: DuelEndStandingProps) => (
  <>
    <span className="size-28 shrink-0">
      <TierBlason tier={card.standing.tier} />
    </span>
    {card.tp === null ? null : <DuelEndTpDelta tp={card.tp} />}
    <DuelEndRankName standing={card.standing} headline={card.headline} />
    {card.bar === null ? null : <DuelEndTpBar bar={card.bar} standing={card.standing} />}
  </>
);
