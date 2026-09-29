import type { Rank } from "ranked";

import { rankLabel } from "@/components/tier/rank/rank-label";
import { TpProgress } from "@/components/tier/rank/tp-progress";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Where the User stands, as the sidebar's card says it: their rank and its TP bar, or where they
// are of their Placement, or Unranked before their first Duel.
export const RankedCardRank = ({ rank }: { rank: Rank | null }) => {
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-2 font-semibold">
      <p>{rank === null ? m.ranked_place_unranked({}, { locale }) : rankLabel(rank, locale)}</p>
      <TpProgress rank={rank} size="lg" />
    </div>
  );
};
