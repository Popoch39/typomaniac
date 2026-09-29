import { PlacementProgress } from "@/components/duel/placement-progress";
import { type DuelRanked, rankChange } from "@/components/duel/rank-change";
import { RankRevealed } from "@/components/duel/rank-revealed";
import { TpChange } from "@/components/duel/tp-change";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// What a ranked Duel did to the User's rank, on its end screen. A move up into a new Tier is
// celebrated by its Tier-up, over the screen: here, it is the TP moved like any other.
export const DuelRank = ({ ranked }: { ranked: DuelRanked }) => {
  const locale = useLocale();
  const change = rankChange(ranked);

  return (
    <section aria-label={m.duel_rank({}, { locale })} className="rounded-card bg-card p-8">
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
