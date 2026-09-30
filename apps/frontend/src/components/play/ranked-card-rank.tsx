import type { Rank } from "ranked";

import { profileRankView } from "@/components/profile/profile-rank-view";
import { TpProgress } from "@/components/tier/rank/tp-progress";
import { useLocale } from "@/locale/use-locale";
import { m } from "@/paraglide/messages";

// Where the User stands, in words over the Ranked card's button: « Gold II » and « 62/100 TP »,
// then its TP bar; « Placement » and the Duels played on its notches; Unranked before their first
// Duel.
export const RankedCardRank = ({ rank }: { rank: Rank | null }) => {
  const locale = useLocale();
  const view = profileRankView(rank, locale);

  return (
    <div className="flex flex-col gap-2 font-semibold">
      {view === null ? (
        <p>{m.ranked_place_unranked({}, { locale })}</p>
      ) : (
        <p className="flex items-baseline justify-between gap-3">
          <span>{view.name}</span>
          <span className="text-sm tabular-nums opacity-80">{view.figure}</span>
        </p>
      )}
      <TpProgress rank={rank} size="lg" />
    </div>
  );
};
