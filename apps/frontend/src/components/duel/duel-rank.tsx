import { PlacementProgress } from "@/components/duel/placement-progress";
import { type DuelRanked, rankChange, tierReached } from "@/components/duel/rank-change";
import { RankRevealed } from "@/components/duel/rank-revealed";
import { TierUp } from "@/components/duel/tier-up";
import { TpChange } from "@/components/duel/tp-change";

// What a ranked Duel did to the User's rank, on its end screen: a move up into a new Tier or
// Maître is celebrated.
export const DuelRank = ({ ranked }: { ranked: DuelRanked }) => {
  const change = rankChange(ranked);
  const reached = tierReached(change);

  return (
    <section aria-label="Rang" className="rounded-card bg-card p-8">
      {change.kind === "placement" ? (
        <PlacementProgress placementsLeft={change.placementsLeft} />
      ) : change.kind === "revealed" ? (
        <RankRevealed standing={change.standing} />
      ) : reached === null ? (
        <TpChange {...change} />
      ) : (
        <TierUp tp={change.tp} standing={reached} />
      )}
    </section>
  );
};
