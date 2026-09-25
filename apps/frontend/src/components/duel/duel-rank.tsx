import { PlacementProgress } from "@/components/duel/placement-progress";
import { type DuelRanked, rankChange } from "@/components/duel/rank-change";
import { RankRevealed } from "@/components/duel/rank-revealed";
import { TpChange } from "@/components/duel/tp-change";

// What a ranked Duel did to the User's rank, on its end screen.
export const DuelRank = ({ ranked }: { ranked: DuelRanked }) => {
  const change = rankChange(ranked);

  return (
    <section aria-label="Rang" className="rounded-card bg-card p-8">
      {change.kind === "placement" ? (
        <PlacementProgress placementsLeft={change.placementsLeft} />
      ) : change.kind === "revealed" ? (
        <RankRevealed standing={change.standing} />
      ) : (
        <TpChange {...change} />
      )}
    </section>
  );
};
