import { type DuelRanked, rankChange } from "@/components/duel/rank-change";
import { DuelEndPlacement } from "@/components/duel-end/duel-end-placement";
import { DuelEndStanding } from "@/components/duel-end/duel-end-standing";
import { rankCardOf } from "@/components/duel-end/rank-card";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// What a ranked Duel did to the User's rank, on the board's card under the band: the Placement
// Duels played, or the rank after it. A move up into a new Tier is celebrated by its Tier-up,
// over the screen: here, it is the TP moved like any other.
export const DuelEndRank = ({ ranked }: { ranked: DuelRanked }) => {
  const locale = useLocale();
  const card = rankCardOf(rankChange(ranked));

  return (
    <section
      aria-label={m.duel_rank({}, { locale })}
      className="flex items-center gap-8 rounded-card bg-card px-9 py-[26px]"
    >
      {card.kind === "placement" ? (
        <DuelEndPlacement played={card.played} left={card.left} />
      ) : (
        <DuelEndStanding card={card} />
      )}
    </section>
  );
};
